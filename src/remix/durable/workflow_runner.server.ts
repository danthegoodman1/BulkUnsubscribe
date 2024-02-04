import { v4 as uuid } from "uuid"

import { db } from "src/db/db.server"
import { TaskRunner } from "./task_runner.server"
import { logger } from "src/logger"
import { extractError } from "src/utils"

interface WorkflowRow {
  id: string
  name: string
  metadata: string | null
  status: "pending" | "completed" | "failed"
  created_ms: number
  updated_ms: number
}

interface WorkflowTaskRow {
  workflow: string
  task_name: string
  seq: number
  status: "pending" | "completed" | "failed"
  data: string | null
  return: string | null
  error: string | null
  created_ms: number
  updated_ms: number
}

interface NewWorkflow {
  tasks: {
    taskName: string
    data?: Record<string, any>
  }[]
  metadata?: Record<string, any>
  name: string
}

export class WorkflowRunner {
  taskRunners: { [name: string]: TaskRunner }
  retryDelayMS: number

  constructor(opts: { taskRunners: TaskRunner[]; retryDelayMS: number }) {
    // Turn it into a map where key is the name
    this.taskRunners = Object.fromEntries(
      opts.taskRunners.map((tr) => [tr.Name, tr])
    )
    this.retryDelayMS = opts.retryDelayMS
  }

  /**
   * Recover workflows from the DB on reboot (always call this)
   */
  async recover() {
    logger.debug("recovering workflows")
    // load all pending workflows from the db
    const workflows: WorkflowRow[] = await db.all(
      `select * from workflows where status = 'pending'`
    )
    logger.info(`got ${workflows.length} workflows form recovery`)
    for (const workflow of workflows) {
      logger.debug(
        {
          worfklowID: workflow.id,
        },
        "recovered workflow"
      )
      this.executeWorkflow(workflow.id)
    }
  }

  async addWorkflow(newWorkflow: NewWorkflow) {
    const workflowID = uuid()
    const log = await logger.child({
      workflowID,
    })
    log.info("adding workflow")
    const now = new Date().getTime()
    // Store the workflow
    await db.run(
      `insert into workflows (
      id,
      name,
      metadata,
      status,
      created_ms,
      updated_ms
    ) values (
      ?,
      ?,
      ?,
      ?,
      ?,
      ?
    )`,
      workflowID,
      newWorkflow.name,
      newWorkflow.metadata ?? null,
      "pending",
      now,
      now
    )

    // Store the tasks
    await db.run(`insert into workflow_tasks (
      workflow,
      task_name,
      seq,
      status,
      data,
      return,
      error,
      created_ms,
      updated_ms
  ) values ${newWorkflow.tasks
    .map((task, index) => {
      return `(
        '${workflowID}',
        '${task.taskName}',
        ${index},
        'pending',
        ${task.data ? "'" + JSON.stringify(task.data) + "'" : null},
        null,
        null,
        ${now},
        ${now}
      )`
    })
    .join(", ")}`)

    // Start execution async
    this.executeWorkflow(workflowID)
  }

  async executeWorkflow(workflowID: string) {
    const wfLogger = await logger.child({
      workflowID,
    })
    try {
      wfLogger.info("executing workflow")

      let attempts = 0
      while (true) {
        attempts = 0
        // Process the tasks
        while (true) {
          wfLogger.debug("getting latest workflow task")
          const task = await db.get<WorkflowTaskRow>(
            `select * from workflow_tasks
            where status = 'pending'
            order by seq
            limit 1`
          )
          if (!task) {
            wfLogger.info("workflow completed")
            return await this.updateWorkflowStatus(workflowID, "completed")
          }
          const taskLogger = wfLogger.child({
            seq: task.seq,
            attempts,
          })
          if (!this.taskRunners[task.task_name]) {
            taskLogger.error(
              {
                taskName: task.task_name,
              },
              "task name not found, aborting workflow (add task and reboot to recover workflow, or update task in db for next attempt)"
            )
            return
          }
          taskLogger.debug("executing task")
          const result = await this.taskRunners[task.task_name].Execute({
            attempt: attempts,
            data: task.data,
            seq: task.seq,
            workflowID,
          })
          if (result.error) {
            taskLogger.error(
              {
                err: extractError(result.error),
                abort: result.abort,
              },
              "task execution error"
            )
            if (result.abort) {
              taskLogger.warn("failing task")
              await this.updateTaskStatus(workflowID, task.seq, "failed", {
                errorMessage: result.error.message,
              })
            }
            if (result.abort === "workflow") {
              taskLogger.warn("failing workflow")
              await this.updateWorkflowStatus(workflowID, "failed")
              return // we are done processing, exit
            }

            // sleep and retry
            await new Promise((r) => setTimeout(r, this.retryDelayMS))
            attempts += 1
            taskLogger.debug("retrying task")
            continue
          }

          // Completed
          taskLogger.info("task completed")
          await this.updateTaskStatus(workflowID, task.seq, "completed", {
            data: result.data,
          })
          break
        }
      }
    } catch (error) {
      wfLogger.error(
        {
          err: extractError(error),
        },
        "error executing workflow"
      )
      throw error
    }
  }

  async updateWorkflowStatus(
    workflowID: string,
    status: "pending" | "completed" | "failed"
  ) {
    await db.run(
      `update workflows
    set status = ?
    where id = ?
    `,
      status,
      workflowID
    )
  }

  async updateTaskStatus(
    workflowID: string,
    seq: number,
    status: "pending" | "completed" | "failed",
    result: {
      data?: any
      errorMessage?: string
    }
  ) {
    await db.run(
      `update workflow_tasks
    set status = ?,
    data = ?,
    error = ?
    where workflow = ?
    and seq = ?`,
      status,
      result.data ? "'" + JSON.stringify(result.data) + "'" : null,
      result.errorMessage
        ? "'" + JSON.stringify(result.errorMessage) + "'"
        : null,
      workflowID,
      seq
    )
  }

  async deleteOldWorkflowsAndTasks(olderThanMS: number) {
    const start = new Date().getTime()
    await db.run(
      `
      delete from workflows
      where updated_ms < ?
    `,
      olderThanMS
    )
    await db.run(
      `
      delete from workflow_tasks
      where updated_ms < ?
    `,
      olderThanMS
    )
    logger.info(
      { durationMS: new Date().getTime() - start },
      "deleted old workflows and tasks"
    )
  }
}
