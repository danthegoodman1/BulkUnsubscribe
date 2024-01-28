import { json } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import { readMarkdown } from "src/utils"
import MarkdownRenderer from "~/components/MarkdownRenderer"

export async function loader() {
  return json({ markdownContent: await readMarkdown("terms.md") })
}

export default function Terms() {
  const data = useLoaderData<typeof loader>()

  return (
    <div className="flex max-w-[1400px] w-full h-full flex-col py-4 md:py-10 gap-8">
      <MarkdownRenderer content={data.markdownContent} />
    </div>
  )
}
