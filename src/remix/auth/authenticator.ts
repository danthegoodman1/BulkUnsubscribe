import { createCookieSessionStorage } from "@remix-run/node"
import { Authenticator } from "remix-auth"
import { OAuth2Strategy } from "remix-auth-oauth2"
import { GoogleStrategy } from "remix-auth-google"

import { logger } from "src/logger"
import { extractError } from "src/utils"
import { isAdminEmail } from "src/utils.server"
import { createOrGetUser } from "src/db/users.server"

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
  increasedScopes: boolean
  subscription?: string
  accessToken: string
  refreshToken?: string
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
      callbackURL: process.env.MY_URL + '/auth/google/callback',
    },
    async ({ accessToken, refreshToken, extraParams, profile }) => {

      try {
        logger.debug(
          {
            profile,
          },
          "got user"
        )

        const user = await createOrGetUser(profile.emails[0].value, refreshToken)

        return {
          email: user.email,
          id: user.id,
          increasedScopes: user.increased_scopes,
          subscription: user.subscription,
          accessToken,
          refreshToken,
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
