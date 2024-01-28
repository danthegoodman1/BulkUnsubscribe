import { logger } from "src/logger"
import { db } from "./db.server"
import { UserRow } from "./types"
import { extractError } from "src/utils"
import { RowsNotFound } from "./errors"
import { randomUUID } from "crypto"

export async function createOrGetUser(
  email: string,
  refreshToken?: string
): Promise<UserRow> {
  try {
    let user = await db.get<UserRow>(
      `
    select *
    from users
    where email = ?
  `,
      email
    )
    if (!user) {
      // Create it
      const id = randomUUID()
      user = await db.get<UserRow>(
        `insert into users (id, email, created_ms, refresh_token) values (?, ?, ?, ?) returning *`,
        id,
        email,
        new Date().getTime(),
        refreshToken
      )
    }

    return user!
  } catch (error) {
    logger.error(
      {
        err: extractError(error),
      },
      "error in createOrGetUser"
    )
    throw error
  }
}

export async function selectUser(id: string): Promise<UserRow> {
  const user = await db.get<UserRow>(
    `
select *
from users
where id = ?
`,
    id
  )
  if (!user) {
    throw new RowsNotFound()
  }
  return user
}

export async function updateUserRefreshToken(id: string, refreshToken: string) {
  await db.run(
    `
    update users
    set refresh_token = ?
    where id = ?
  `,
    refreshToken,
    id
  )
}
