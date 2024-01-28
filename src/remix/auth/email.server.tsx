// app/services/email.server.tsx
import { renderToString } from "react-dom/server"
import type { SendEmailFunction } from "remix-auth-email-link"
import { UserRow } from "src/db/types"
import { logger } from "src/logger"

export let sendEmail: SendEmailFunction<UserRow> = async (options) => {
  let body = renderToString(
    <div
      style={{
        fontFamily: "sans-serif",
      }}
    >
      <p>
        Hello there!
        <br />
        <br />
        <a href={options.magicLink}>Click here to login to aspiring.dev</a>
      </p>
    </div>
  )

  logger.debug({ body, email: options.emailAddress }, "sending login email")

  const res = await fetch("https://api.postmarkapp.com/email/batch", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Postmark-Server-Token": process.env.POSTMARK_TOKEN,
    },
    body: JSON.stringify([
      {
        From: "auth@aspiring.dev",
        To: options.emailAddress,
        Subject: "aspiring.dev SignIn Link",
        TextBody: `Hello there!\n\nUse ${options.magicLink} to login to aspiring.dev`,
        HtmlBody: body,
        MessageStream: "outbound",
      },
    ]),
  })
  const text = await res.text()
  if (res.status >= 400) {
    throw new Error(`High status code from postmark (${res.status}): ${text}`)
  }
}

export interface SendBulkEmailOpts {
  emailGenerator(params: any): { html: string; text: string; subject: string }
  targets: {
    email: string
    param: any
  }[]
  fromEmail: string
  fromName: string
}

// Add a helper function to create chunks of the target array
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

export async function sendBulkEmails(opts: SendBulkEmailOpts) {
  // The maximum number of targets per batch
  const MAX_BATCH_SIZE = 500

  // Use the helper function to break up the targets into chunks of MAX_BATCH_SIZE
  const targetChunks = chunkArray(opts.targets, MAX_BATCH_SIZE)

  for (const chunk of targetChunks) {
    const res = await fetch("https://api.postmarkapp.com/email/batch", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Postmark-Server-Token": process.env.POSTMARK_TOKEN,
      },
      body: JSON.stringify(
        chunk.map((target) => {
          const generated = opts.emailGenerator(target.param)
          return {
            From: `${opts.fromName} <${opts.fromEmail}>`,
            To: target.email,
            Subject: generated.subject,
            TextBody: generated.text,
            HtmlBody: generated.html,
            MessageStream: "outbound",
          }
        })
      ),
    })
    const text = await res.text()
    if (res.status >= 400) {
      throw new Error(`High status code from postmark (${res.status}): ${text}`)
    }
  }
}
