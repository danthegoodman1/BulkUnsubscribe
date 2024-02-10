import { ActionFunctionArgs, redirect } from "@remix-run/node"
import { insertResubNotifyIfNotExists } from "src/db/users.server"
import { getAuthedUser } from "~/auth/authenticator"

export async function action(args: ActionFunctionArgs) {
  const user = await getAuthedUser(args.request)
  if (!user) {
    return redirect("/")
  }

  await insertResubNotifyIfNotExists(user.id)
  return new Response("will be notified")
}
