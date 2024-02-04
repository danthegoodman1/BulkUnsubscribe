import { db } from "./db.server"
import { UnsubedMessageRow } from "./types"

export async function selectUnsubedMessage(userID: string, messageID: string) {
  return await db.get<UnsubedMessageRow>(
    `select * from unsubed_messages where user = ? and message_id = ?`,
    userID,
    messageID
  )
}

export async function insertUnsubedMessageRow(
  userID: string,
  messageID: string
) {
  return await db.run(
    `insert into unsubed_messages (user, message_id, created_ms) values (?, ?, ?)`,
    userID,
    messageID,
    new Date().getTime()
  )
}
