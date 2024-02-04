import {
  json,
  redirect,
  type LoaderFunctionArgs,
  type MetaFunction,
  defer,
  ActionFunctionArgs,
} from "@remix-run/node"
import { Await, Form, useLoaderData } from "@remix-run/react"
import { Suspense, useState } from "react"
import { getAuthedUser } from "~/auth/authenticator"
import { refreshToken } from "~/auth/google.server"
import { ParsedEmail, getMessages, parseEmail } from "~/google/gmail.server"
import { workflowRunner } from "~/entry.server"
import { encrypt } from "src/utils.server"
import { logger } from "src/logger"

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ]
}

export async function loader(args: LoaderFunctionArgs) {
  const user = await getAuthedUser(args.request)

  return defer({
    user,
    unsubable: (async () => {
      if (user) {
        // If they have not given us the proper scopes
        if (
          !user.scopes.includes(
            "https://www.googleapis.com/auth/gmail.metadata"
          )
        ) {
          return redirect("/signout?redirectTo=/signin-needs-scopes")
        }

        if (!user.refresh_token) {
          return redirect("/signout?error=missing-refresh-token")
        }

        const tokens = await refreshToken(user.id, user.refresh_token!)
        const messages = await getMessages(tokens.access_token, 100)
        return parseEmail(messages.map((m) => m.data)).filter(
          (m) => m.MailTo || m.OneClick
        )
      }
      return null
    })(),
  })
}

export async function action(args: ActionFunctionArgs) {
  const user = await getAuthedUser(args.request)
  if (!user) {
    // bruh
    return redirect("/signin")
  }
  if (!user.refresh_token) {
    return redirect("/signout?error=missing-refresh-token")
  }

  const formData = await args.request.formData()
  const msgIDs = formData.getAll("msgID")

  await workflowRunner.addWorkflow({
    name: `Unsubscribe for ${user.email}`,
    tasks: msgIDs.map((id) => {
      return {
        taskName: "unsubscribe",
        data: {
          id,
        },
      }
    }),
    metadata: {
      userID: user.id,
    },
  })

  return null
}

export default function Index() {
  const data = useLoaderData<typeof loader>()

  return (
    <div className="flex flex-col gap-4 mb-10">
      {!data.user && <h1 className="font-bold">Signed Out :(</h1>}
      <Suspense fallback={<Loading />}>
        <Await resolve={data.unsubable}>
          {(u) => {
            if (!u) {
              return <></>
            }
            const unsubable = u as ParsedEmail[] | undefined
            const nameCombos: { [key: string]: ParsedEmail[] } = {}
            if (unsubable) {
              unsubable.map((msg) => {
                const combo = [msg.Sender.Name, msg.Sender.Email].join(",")
                if (!nameCombos[combo]) {
                  nameCombos[combo] = []
                }

                nameCombos[combo].push(msg)
              })
            }

            return (
              <Form method="post">
                <div className="flex gap-4 items-end mb-4">
                  <h1 className="font-bold">Unsubscribe from emails</h1>
                  <p className="mb-[1px] text-neutral-500 font-medium">
                    {Object.keys(nameCombos).length} unique senders,{" "}
                    {unsubable?.length} emails{" "}
                    <span className="font-normal">
                      (from your last 1,000 emails)
                    </span>
                  </p>
                </div>
                <div className="flex w-full gap-4 mb-4">
                  <button className="rounded-md py-2 px-8 bg-black text-white flex items-center justify-center hover:bg-neutral-700 disabled:bg-neutral-700 text-medium">
                    Bulk Unsubscribe!
                  </button>
                  <div className="grow"></div>
                  <button
                    type="button"
                    onClick={() => {
                      for (const e of document.getElementsByClassName(
                        "email-checkbox"
                      )) {
                        ;(e as HTMLInputElement).checked = true
                      }
                    }}
                    className="rounded-md py-2 px-6 border-2 border-black flex items-center justify-center hover:bg-neutral-200 disabled:bg-neutral-200 disabled:text-neutral-700"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      for (const e of document.getElementsByClassName(
                        "email-checkbox"
                      )) {
                        ;(e as HTMLInputElement).checked = false
                      }
                    }}
                    className="rounded-md py-2 px-6 border-2 border-black flex items-center justify-center hover:bg-neutral-200 disabled:bg-neutral-200 disabled:text-neutral-700"
                  >
                    Unselect All
                  </button>
                </div>
                <div className="flex flex-col gap-6 sm:gap-10">
                  <div className="flex flex-col gap-3">
                    {Object.entries(nameCombos).map(([sender, msgs]) => {
                      return <MsgRow key={sender} msgs={msgs} />
                    })}
                  </div>
                </div>
              </Form>
            )
          }}
        </Await>
      </Suspense>
    </div>
  )
}

export function MsgRow(props: { msgs: ParsedEmail[] }) {
  const first = props.msgs[0]
  const others = props.msgs.slice(1)
  return (
    <div
      key={first.ID}
      className="flex flex-col lg:flex-row gap-3 p-4 border-2 border-black rounded-lg"
    >
      <div className="flex flex-col lg:w-[25%]">
        {first.Sender.Name && (
          <p className="font-medium text-lg">{first.Sender.Name}</p>
        )}
        {first.Sender.Name && (
          <p className="text-neutral-600 text-sm">({first.Sender.Email})</p>
        )}
        {!first.Sender.Name && (
          <p className="font-medium text-lg">{first.Sender.Email}</p>
        )}
      </div>
      <div className="flex-col lg:max-w-[60%]">
        <p>{first.Subject}</p>
        {others.length > 0 && (
          <p className="text-sm text-neutral-600">(and {others.length} more)</p>
        )}
      </div>
      <div className="grow"></div>
      <div className="flex gap-1 items-center">
        <label className="text-sm text-neutral-600">Unsubscribe?</label>
        <input
          defaultChecked={true}
          type="checkbox"
          name={"msgID"}
          value={first.ID}
          className="w-5 h-5 my-auto rounded-md cursor-pointer email-checkbox"
        />
      </div>
    </div>
  )
}

function Loading() {
  return <h3>Checking your last 1,000 emails...</h3>
}
