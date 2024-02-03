export interface TaskExecutionContext<Tin = any> {
  workflowID: string
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
  /**
   * If `.error` is an Error, specify abort behavior.
   * undefined means will to try (and increment attempts).
   * "task" will abort this task with the `error.Message` written to the DB, and continue
   * processing the workflow.
   * "workflow" will abort the entire workflow and mark all remaining tasks failed for "workflow abandoned"
   */
  abort?: "task" | "workflow"
}

/**
 * TaskRunners are shared instances (not per task)
 */
export interface TaskRunner<Tin = any, Tout = any> {
  Name: string
  Execute(ctx: TaskExecutionContext<Tin>): Promise<TaskExecutionResult<Tout>>
}
