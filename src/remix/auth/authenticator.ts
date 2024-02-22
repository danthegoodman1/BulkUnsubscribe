import { createCookieSessionStorage, redirect } from "@remix-run/node"
import { Authenticator } from "remix-auth"
import { GoogleStrategy } from "remix-auth-google"

import { logger } from "src/logger"
import { extractError } from "src/utils"
import { createOrGetUser, selectUser } from "src/db/users.server"
import { UserRow } from "src/db/types"
import { RowsNotFound } from "src/db/errors"

// export the whole sessionStorage object
export let sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_session",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets: [process.env.COOKIE_SECRET!],
    secure: process.env.NODE_ENV === "production", // enable this in prod only
    maxAge: 3600 * 24 * 14, // 2 weeks
  },
})

export interface AuthSession {
  id: string
  email: string
  scopes: string
  subscription?: string
}

export let authenticator = new Authenticator<AuthSession>(sessionStorage)

export const googleAuth = "google"

let secret = process.env.COOKIE_SECRET
if (!secret) throw new Error("Missing COOKIE_SECRET env variable.")

authenticator.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.MY_URL + "/auth/google/callback",
      accessType: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "openid",
        "https://www.googleapis.com/auth/userinfo.email",
        // "https://www.googleapis.com/auth/gmail.compose",
        "https://www.googleapis.com/auth/gmail.metadata",
      ].join(" "),
    },
    async ({ accessToken, refreshToken, extraParams, profile }) => {
      try {
        logger.debug(
          {
            profile,
            extraParams,
          },
          "got user"
        )

        const user = await createOrGetUser(
          profile.emails[0].value,
          extraParams.scope,
          refreshToken
        )

        return {
          email: user.email,
          id: user.id,
          scopes: user.scopes,
          subscription: user.subscription,
        }
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
  ),
  // this is optional, but if you setup more than one OAuth2 instance you will
  // need to set a custom name to each one
  googleAuth
)

export interface authedUser extends UserRow {
  authSession: AuthSession
}

export async function getAuthedUser(
  request: Request
): Promise<authedUser | null> {
  const user = await authenticator.isAuthenticated(request)
  if (!user) {
    return null
  }

  try {
    const userInfo = await selectUser(user.id)
    return {
      ...userInfo,
      authSession: user,
    }
  } catch (error) {
    if (error instanceof RowsNotFound) {
      throw redirect("/signout")
    }
    throw error
  }
}
