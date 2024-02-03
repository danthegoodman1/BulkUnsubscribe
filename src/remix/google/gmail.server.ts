import { gmail_v1, google } from "googleapis"
import { logger } from "src/logger"

export async function getMessages(accessToken: string, maxResults: number) {
  const gmail = google.gmail({ version: "v1" })
  const loops = Math.ceil(maxResults / 500)
  const res = await gmail.users.messages.list({
    access_token: accessToken,
    userId: "me",
    maxResults: Math.min(maxResults, 500),
  })
  const messages = res.data.messages!
  if (res.data.nextPageToken && res.data.messages!.length >= 500 && loops > 1) {
    // Get more pages
    for (let i = 0; i < loops - 1; i++) {
      logger.debug("getting another page")
      const more = await gmail.users.messages.list({
        access_token: accessToken,
        userId: "me",
        maxResults: 500,
        pageToken: res.data.nextPageToken,
      })
      messages.push(...more.data.messages!)
    }
  }
  const unsubabble = (
    await Promise.all(
      messages.map(async (msg) => {
        const mcontent = await gmail.users.messages.get({
          access_token: accessToken,
          userId: "me",
          id: msg.id!,
          format: "metadata",
        })
        return mcontent
      })
    )
  ).filter((msg) =>
    msg.data.payload?.headers?.some(
      (header) => header.name === "List-Unsubscribe"
    )
  )
  return unsubabble
}

export interface ParsedEmail {
  Sender: {
    Name?: string
    Email: string
  }
  MailTo?: string
  OneClick?: string
  Subject?: string
  ID: string
}

export function parseEmail(messages: gmail_v1.Schema$Message[]): ParsedEmail[] {
  const parsed: ParsedEmail[] = []
  for (const msg of messages) {
    const senderParts = msg.payload?.headers
      ?.find((header) => header.name === "From")
      ?.value?.split(" <")
    if (!senderParts) {
      logger.error(
        {
          msg,
        },
        "got weird email From header!"
      )
      continue
    }

    const listUnsubOptions = msg.payload?.headers
      ?.find((header) => header.name === "List-Unsubscribe")
      ?.value?.split(",")
      .map((val) => val.trim())
      .map((val) => val.substring(val.indexOf("<") + 1, val.indexOf(">")))

    parsed.push({
      ID: msg.id!,
      Subject:
        msg.payload?.headers?.find((header) => header.name === "Subject")
          ?.value ?? undefined,
      Sender: {
        Email:
          senderParts?.length == 2
            ? senderParts[1].substring(
                senderParts[1].indexOf("<") + 1,
                senderParts[1].indexOf(">")
              )
            : senderParts[0],
        Name:
          senderParts?.length == 2
            ? senderParts[0].replaceAll(/[\\"]/g, "")
            : undefined,
      },
      MailTo: listUnsubOptions
        ?.find((opt) => opt.startsWith("mailto:"))
        ?.replaceAll("mailto:", ""),
      OneClick: msg.payload?.headers?.find(
        (header) => header.name === "List-Unsubscribe-Post"
      )
        ? listUnsubOptions?.find((opt) => !opt.startsWith("mailto:"))
        : undefined,
    })
  }

  return parsed
}
