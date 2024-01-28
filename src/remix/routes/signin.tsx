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
    await authenticator.authenticate(googleAuth, args.request, {
      throwOnError: true,
    })
    // Valid, let's redirect to the cookie if exists
    const cookieHeader = args.request.headers.get("cookie")
    const cookie: string | undefined = await signinRedirectCookie.parse(
      cookieHeader
    )
    return redirect(cookie ?? "/dashboard", {
      headers: {
        "set-cookie": await signinRedirectCookie.serialize(undefined, {
          maxAge: 0, // unset it
        }),
      },
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

// export async function action(args: ActionFunctionArgs) {
//   const searchParams = new URL(args.request.url).searchParams
//   const redirectTo = searchParams.get("redirectTo")

//   return await authenticator.authenticate(
//     googleAuth,
//     args.request,
//     {
//       successRedirect: redirectTo ?? "/dashboard",
//       failureRedirect: "/signin?failed=true",
//     }
//   )
// }

// export default function signin() {
//   const [searchParams, _] = useSearchParams()
//   const failureParam = searchParams.get("failed")
//   const fromParam = searchParams.get("from")
//   return (
//     <div>
//       {failureParam && (
//         <div className="bg-red-200 p-3">
//           <p>{failureParam}</p>
//         </div>
//       )}
//       {fromParam === "/signout" && (
//         <div role="alert" className="alert alert-success">
//           <span>You have been logged out!</span>
//         </div>
//       )}
//       <Form method="post">
//         <button>signin</button>
//       </Form>
//     </div>
//   )
// }
