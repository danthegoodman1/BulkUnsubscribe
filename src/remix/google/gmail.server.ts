import { google } from "googleapis"

export async function getMessages(accessToken: string) {
  const gmail = google.gmail({ version: "v1" })
  const messages = await gmail.users.messages.list({
    access_token: accessToken,
    userId: "me",
    maxResults: 50,
  })
  const unsubabble = (
    await Promise.all(
      messages.data.messages!.map(async (msg) => {
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
