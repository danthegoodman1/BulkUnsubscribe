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
import { HighStatusCode } from "src/errors"

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
      workflowID: ctx.workflowID,
      seq: ctx.seq,
      userID: ctx.wfMetadata.userID,
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
        log.debug(
          {
            url: parsed.OneClick,
          },
          "doing one-click"
        )
        const res = await fetch(parsed.OneClick, {
          method: "POST",
        })

        if (res.status >= 500) {
          // retry
          throw new HighStatusCode(res.status, await res.text())
        }
        if (res.status >= 400) {
          // don't retry
          // TODO: Store messageID handled
          return {
            error: new HighStatusCode(res.status, await res.text()),
            abort: "task",
          }
        }

        return {
          data: {
            method: "one-click",
          },
        }
      }

      if (parsed.MailTo) {
        // If email, send email
        log.debug(
          {
            url: parsed.MailTo,
          },
          "doing mailto"
        )

        // TODO: send email

        return {
          data: {
            method: "mailto",
          },
        }
      }

      // TODO: Store messageID is handled

      return {
        error: new ExpectedError("no valid unsub action"),
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
