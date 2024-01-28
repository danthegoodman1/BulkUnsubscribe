import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node"
import { Form, useSearchParams } from "@remix-run/react"
import { authenticator, googleAuth } from "~/auth/authenticator"
import { signinRedirectCookie } from "~/auth/signin_redirect_cookie"

export async function loader(args: LoaderFunctionArgs) {
  const searchParams = new URL(args.request.url).searchParams
  const redirectTo = searchParams.get("redirectTo")

  try {
    return await authenticator.authenticate(googleAuth, args.request, {
      successRedirect: "/", // this is overridden below
      throwOnError: true,
    })
    // await authenticator.authenticate(huggingfaceAuthenticator, args.request, {
    //   throwOnError: true,
    // })
    // // Valid, let's redirect to the cookie if exists
    // const cookieHeader = args.request.headers.get("cookie")
    // const cookie: string | undefined = await signinRedirectCookie.parse(
    //   cookieHeader
    // )
    // return redirect(cookie ?? "/dashboard", {
    //   headers: {
    //     "set-cookie": await signinRedirectCookie.serialize(undefined, {
    //       maxAge: 0, // unset it
    //     }),
    //   },
    // })
  } catch (error) {
    // Because redirects work by throwing a Response, you need to check if the
    // caught error is a response and return it or throw it again
    if (error instanceof Response) {
      // Let's inject the cookie to set
      if (redirectTo) {
        error.headers.set(
          "set-cookie",
          await signinRedirectCookie.serialize(redirectTo)
        )
      }
      throw error
    }

    return redirect(
      "/signin?failed=" + encodeURIComponent((error as Error).message)
    )
  }
}
