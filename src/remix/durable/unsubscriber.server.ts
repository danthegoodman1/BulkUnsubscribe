import {
  TaskExecutionContext,
  TaskExecutionResult,
  TaskRunner,
} from "./task_runner.server"

export class UnsubscribeRunner implements TaskRunner {
  Name = "unsubscribe"
  async Execute(
    ctx: TaskExecutionContext<{
      id: string
    }>
  ) {
    // If One-Click, navigate to link
    // If email, send email

    return {}
  }
}