export default function SigninNeedsScopes() {
  return (
    <div className="flex flex-col gap-4 mb-10">
      <h1>
        ⚠️ You must allow the requested scopes to be able to use BulkUnsub.
      </h1>
      <p>
        How are we going to be able to read the emails that need to be
        unsubscribed?
      </p>
      <a className="underline" href="/privacy">
        See our privacy policy
      </a>
    </div>
  )
}
