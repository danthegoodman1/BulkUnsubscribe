import { google } from "googleapis"
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
