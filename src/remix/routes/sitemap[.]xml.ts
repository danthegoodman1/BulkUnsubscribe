import { LoaderFunctionArgs } from "@remix-run/node"

export function loader(args: LoaderFunctionArgs) {
  return new Response(
    `
  <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap>
      <loc>${process.env.MY_URL}/sitemap-pages.xml</loc>
    </sitemap>
    <sitemap>
      <loc>${process.env.MY_URL}/sitemap-posts.xml</loc>
    </sitemap>
  </sitemapindex>
  `,
    {
      headers: {
        "Content-Type": "application/xml",
        "xml-version": "1.0",
        encoding: "UTF-8",
        "cache-control": "public, max-age=600",
      },
    }
  )
}
