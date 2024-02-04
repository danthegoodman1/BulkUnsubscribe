export interface TaskExecutionContext<Tin = any> {
  workflowID: string
  wfMetadata: any | null
  /**
   * If something returned from the prepare, provide it here
   */
  preparedData?: any
  /**
   * The task number in the list, starting at 0
   */
  seq: number
  /**
   * Input to the specific task
   */
  data: Tin | null
  /**
   * Number of retries on this task
   */
  attempt: number
}

export interface TaskExecutionResult<Tout = any> {
  /**
   * some result, if we ever need to reference this for what ever reason
   */
  data?: Tout
  /**
   * provide an error to either retry or abort, see `.abort` property
   */
  error?: Error
  metadata?: any
  /**
   * If `.error` is an Error, specify abort behavior.
   * undefined means will to try (and increment attempts).
   * "task" will abort this task with the `error.Message` written to the DB, and continue
   * processing the workflow.
   * "workflow" will abort the entire workflow, and mark the workflow and task that failed it as "failed"
   */
  abort?: "task" | "workflow"
}

/**
 * TaskRunners are shared instances (not per task)
 */
export interface TaskRunner<Tin = any, Tout = any> {
  Name: string
  Execute(ctx: TaskExecutionContext<Tin>): Promise<TaskExecutionResult<Tout>>
  /**
   * If there is something that needs to be run before workflow execution starts, like getting a token that is shared among tasks. Does not store the value.
   */
  Prepare?(ctx: TaskExecutionContext<Tin>): Promise<any | undefined>
}

export class ExpectedError extends Error {
  constructor(msg: string) {
    super(msg)

    // capturing the stack trace keeps the reference to your error class
    // Error.captureStackTrace(this, this.constructor); // THIS BREAKS BUN
  }
}
