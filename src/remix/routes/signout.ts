import { LoaderFunctionArgs } from "@remix-run/node"
import { authenticator } from "~/auth/authenticator"

export async function loader(args: LoaderFunctionArgs) {
  const searchParams = new URL(args.request.url).searchParams
  const redirectTo = searchParams.get("redirectTo")

  return await authenticator.logout(args.request, {
    redirectTo: `${redirectTo ?? "/"}`,
  })
}
