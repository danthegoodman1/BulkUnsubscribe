// app/routes/magic.tsx
import { LoaderFunctionArgs, redirect } from "@remix-run/node"
import { authenticator, emailStrategyAuthenticator } from "~/auth/authenticator"
import { signinRedirectCookie } from "~/auth/signin_redirect_cookie"

export async function loader({ request }: LoaderFunctionArgs) {
  // The success redirect is required in this action, this is where the user is
  // going to be redirected after the magic link is sent, note that here the
  // user is not yet authenticated, so you can't send it to a private page.
  const cookie = await signinRedirectCookie.parse(request.headers.get("Cookie"))
  const { searchParams } = new URL(request.url)
  const redirectTo = searchParams.get("redirectTo")

  try {
    // Set headers because for some reason the package does not pass through the request body
    await authenticator.authenticate(emailStrategyAuthenticator, request, {
      // If this is not set, any error will be throw and the ErrorBoundary will be
      // rendered.
      successRedirect: cookie ?? "/",
      throwOnError: true,
    })
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
