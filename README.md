# Bulk Unsubscribe

https://www.aspiring.dev/bulk-unsubscribe/

## Privacy

Your data is used to identify you during login (e.g. email), as well as to identify what emails can be unsubscribed from, and how to unsubscribe from them (List-Unsubscribe headers, subject header, sender header).

As you can tell from the post so far and the open source code (same used in production), no sensitive data is stored. You can explore the privacy policy on [the site](https://bulkunsubscribe.com/privacy), but TLDR the most that's kept is logs/operational data (durable execution state) of the target email and/or link, and maybe some headers if they aren't in an expected format.

## Env vars

See `index.ts` on what are defined, but also the standard AWS ones are needed

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_DEFAULT_REGION (if applicable)
```
