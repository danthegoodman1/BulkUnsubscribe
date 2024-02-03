import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import { logger } from "src/logger"
import { getAuthedUser } from "~/auth/authenticator"
import { refreshToken } from "~/auth/google.server"
import { getMessages } from "~/google/gmail.server"

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ]
}

export async function loader(args: LoaderFunctionArgs) {
  const user = await getAuthedUser(args.request)

  if (user) {
    // TODO: If no refresh token, signout
    const tokens = await refreshToken(user.id, user.refresh_token!)
    const messages = await getMessages(tokens.access_token)
    console.log(
      messages.map(
        (msg) =>
          `${
            msg.data.payload?.headers?.find((header) => header.name === "From")
              ?.value
          } sent: ${
            msg.data.payload?.headers?.find(
              (header) => header.name === "Subject"
            )?.value
          }`
      )
    )
  }

  return json({
    user,
  })
}

export default function Index() {
  const data = useLoaderData<typeof loader>()

  return (
    <div className="flex flex-col gap-4 mb-10">
      {!data.user && <h1 className="font-bold">Signed Out :(</h1>}
      {data.user && <h1 className="font-bold">Signed in!</h1>}
      <div className="flex flex-col gap-6 sm:gap-10">
        <pre>{JSON.stringify(data.user)}</pre>
      </div>
    </div>
  )
}
