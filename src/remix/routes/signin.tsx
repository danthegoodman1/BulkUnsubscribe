import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node"
import { Form, useLoaderData } from "@remix-run/react"
import { useState } from "react"
import {
  authenticator,
  emailStrategyAuthenticator,
  sessionStorage,
} from "~/auth/authenticator"
import { signinRedirectCookie } from "~/auth/signin_redirect_cookie"

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request)
  const cookie = await signinRedirectCookie.parse(request.headers.get("Cookie"))
  let session = await sessionStorage.getSession(request.headers.get("Cookie"))
  if (user && cookie) {
    return redirect(cookie, {
      headers: {
        "set-cookie": await signinRedirectCookie.serialize("", {
          maxAge: 1,
        }),
      },
    })
  }
  // This session key `auth:magiclink` is the default one used by the EmailLinkStrategy
  // you can customize it passing a `sessionMagicLinkKey` when creating an
  // instance.
  return json({
    magicLinkSent: session.has("auth:magiclink"),
    magicLinkEmail: session.get("auth:email"),
  })
}

export async function action({ request }: ActionFunctionArgs) {
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

export default function Login() {
  let { magicLinkSent, magicLinkEmail } = useLoaderData<typeof loader>()

  const [resent, setResent] = useState(false)

  return (
    <>
      {magicLinkSent ? (
        <Form
          onSubmit={() => {
            setResent(true)
          }}
          method="post"
        >
          <p>
            Successfully sent magic link{" "}
            {magicLinkEmail ? `to ${magicLinkEmail}` : ""}
          </p>
          <input
            value={magicLinkEmail}
            required
            type="hidden"
            name="email"
            id="email"
          />
          <button disabled={resent} className="mt-2 text-neutral-600">
            {resent ? "Resent" : "Need to resend?"}
          </button>
        </Form>
      ) : (
        <Form method="post">
          <h3>Sign in :)</h3>
          <input
            id="email"
            type="email"
            name="email"
            required
            placeholder="Your email"
            className="px-3 my-4 py-2 border-black border-2 rounded-md drop-shadow-md"
          />
          <button className="rounded-md py-2 px-8 bg-black text-white flex items-center justify-center hover:bg-neutral-700 disabled:bg-neutral-700">
            Join
          </button>
        </Form>
      )}
    </>
  )
}
