import { refreshToken } from "~/auth/google.server"
import {
  ExpectedError,
  TaskExecutionContext,
  TaskExecutionResult,
  TaskRunner,
} from "./task_runner.server"
import { selectUser } from "src/db/users.server"
import { google } from "googleapis"
import { logger } from "src/logger"
import { parseEmail } from "~/google/gmail.server"

export class UnsubscribeRunner implements TaskRunner {
  Name = "unsubscribe"
  gmail = google.gmail({ version: "v1" })
  async Execute(
    ctx: TaskExecutionContext<{
      id: string
    }>
  ): Promise<TaskExecutionResult> {
    const log = logger.child({
      msgID: ctx.data?.id,
    })
    try {
      // Get the email again
      const msg = await this.gmail.users.messages.get({
        access_token: ctx.preparedData.accessToken,
        userId: "me",
        id: ctx.data?.id,
        format: "metadata",
      })
      const unsubable = msg.data.payload?.headers?.some(
        (header) => header.name === "List-Unsubscribe"
      )
      if (!unsubable) {
        log.info("msg not unsubable, aborting")
        return {
          error: new ExpectedError("msg not unsubable"),
        }
      }

      const [parsed] = parseEmail([msg.data])

      if (parsed.OneClick) {
        // If One-Click, navigate to link
        return {
          data: {
            method: "one-click",
          },
        }
      }

      // If email, send email
      if (parsed.MailTo) {
        // If One-Click, navigate to link
        return {
          data: {
            method: "one-click",
          },
        }
      }

      return {
        error: new ExpectedError("failed to parse msg"),
        data: {
          parsed,
        },
      }
    } catch (error) {
      return {
        error: error as Error,
      }
    }
  }

  async Prepare(ctx: TaskExecutionContext<any>): Promise<any> {
    const user = await selectUser(ctx.wfMetadata.userID)
    if (!user.refresh_token) {
      throw new Error("User did not have refresh token")
    }
    const tokens = await refreshToken(user.id, user.refresh_token)
    return {
      accessToken: tokens.access_token,
    }
  }
}
