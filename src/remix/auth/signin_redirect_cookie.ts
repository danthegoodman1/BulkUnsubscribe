import { createCookie } from "@remix-run/node"

export const signinRedirectCookie = createCookie("signin-redirect", {
  sameSite: "lax",
  path: "/",
  httpOnly: true,
  secrets: [process.env.COOKIE_SECRET!],
  secure: false, // process.env.NODE_ENV === "production", // enable this in prod only
})
