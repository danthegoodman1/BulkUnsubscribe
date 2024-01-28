import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticator } from "~/auth/authenticator";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export async function loader(args: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(args.request)

  return json({
    user
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
  );
}
