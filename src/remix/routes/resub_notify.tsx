import { LoaderFunctionArgs, redirect } from "@remix-run/node"
import { insertResubNotifyIfNotExists } from "src/db/users.server"
import { getAuthedUser } from "~/auth/authenticator"
import { sendSESEmail } from "~/email/ses"

export async function loader(args: LoaderFunctionArgs) {
  const user = await getAuthedUser(args.request)
  if (!user) {
    return redirect("/")
  }

  await insertResubNotifyIfNotExists(user.id)

  await sendSESEmail(user.email, "Test email", "This is a test email!")

  return new Response("will be notified")
}

export default function ResubNotify() {
  return (
    <div className="flex flex-col gap-4 mb-10">
      <p>Thanks, you will be notified!</p>
    </div>
  )
}
