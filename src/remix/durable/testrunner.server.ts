import {
  TaskExecutionContext,
  TaskExecutionResult,
  TaskRunner,
} from "./task_runner.server"

export class TestRunner implements TaskRunner {
  Name = "testrunner"
  async Execute(
    ctx: TaskExecutionContext<any>
  ): Promise<TaskExecutionResult<any>> {
    // console.log("executing test runner", ctx)
    // if (ctx.attempt < 2) {
    //   console.log("failing")
    //   return {
    //     error: new Error("blah"),
    //   }
    // }
    // console.log("allowing")
    // if (ctx.seq === 3) {
    //   console.log("aborting")
    //   process.exit(1)
    // }
    return {
      data: { test: "thing" },
    }
  }
}
