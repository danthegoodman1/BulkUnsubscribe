// This is safe to run as a component for client-hydration, but uses less-optimized FenceClient

import Markdoc from "@markdoc/markdoc"
import React from "react"
import yaml from "js-yaml"

export default function MarkdownRenderer(props: {
  content: string
  variables?: Record<string, any>
}) {
  const ast = Markdoc.parse(props.content)

  const frontmatter: any = ast.attributes.frontmatter
    ? yaml.load(ast.attributes.frontmatter)
    : {}

  const content = Markdoc.transform(ast, {
    variables: {
      ...frontmatter,
      ...props.variables,
    },
  })

  return Markdoc.renderers.react(content, React, {
    components: {
    },
  })
}
