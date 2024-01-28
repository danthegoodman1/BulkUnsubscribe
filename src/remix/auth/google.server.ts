import { updateUserRefreshToken } from "src/db/users.server"
import { HighStatusCode } from "src/errors"

export async function refreshToken(
  userID: string,
  refreshToken: string
): Promise<RefreshResponse> {
  const payload = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  })
  const res = await fetch("https://oauth2.googleapis.com/token", {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    method: "POST",
    body: payload.toString(),
  })

  const text = await res.text()
  if (res.status >= 400) {
    throw new HighStatusCode(res.status, text)
  }

  const token: RefreshResponse = await JSON.parse(text)
  if (!!token.refresh_token) {
    // We need to store for the user
    await updateUserRefreshToken(userID, refreshToken)
  }

  return token
}

export interface RefreshResponse {
  access_token: string
  expires_in: 3599
  scope: string
  token_type: "Bearer"
  id_token: string
  refresh_token?: string
}
