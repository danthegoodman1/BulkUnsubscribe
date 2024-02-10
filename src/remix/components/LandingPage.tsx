import { Link } from "@remix-run/react"

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-20">
      <div className="flex flex-col gap-4 text-center items-center">
        <h1 className="font-bold mb-4">Bulk Unsubscribe from junk emails</h1>
        <p>How you started getting those marketing emails, nobody knows.</p>
        <p>But we can definitely get rid of them!</p>
        <img
          className="shadow-xl max-w-[90vw] w-[850px] rounded-md mt-4"
          src="/bulk-unsub-example.png"
        />
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="font-medium mb-4">
          Recent standardization in marketing emails FTW
        </h2>
        <p>
          With the new <code>List-Unsubscribe</code> email header requirements
          by inbox providers like Google and Yahoo, there is now a standard for
          unsubscribing from marketing emails in one click
        </p>
        <p>
          But these inbox providers haven't made a method for you to do them in
          bulk, so we've made it ourself.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="font-medium mb-4">Open source, free to use</h2>
        <p>
          You can find the code for this site on{" "}
          <Link
            className="underline"
            to="https://github.com/danthegoodman1/BulkUnsubscribe"
          >
            Github
          </Link>
          .
        </p>
        <p>
          We don't collect any data (see{" "}
          <Link className="underline" to="/terms">
            Terms
          </Link>{" "}
          and{" "}
          <Link className="underline" to="/terms">
            Privacy
          </Link>
          ), and offer this service for free.
        </p>
        <p>
          You can support this service by{" "}
          <Link className="underline" to="https://github.com/danthegoodman1">
            sponsoring me (Dan Goodman) on Github
          </Link>
        </p>
      </div>
    </div>
  )
}
