import { faBars, faClose } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Disclosure } from "@headlessui/react"
import { Link, NavLink } from "@remix-run/react"

interface LinkItem {
  name: string
  href: string
  subscriber?: boolean
  authed?: boolean
  end?: boolean
}

const leftNav: LinkItem[] = [
  { name: "Terms", href: "/terms" },
  { name: "Privacy", href: "/privacy" },
]

const rightNav: LinkItem[] = [
  // { name: "Settings", href: "/settings", authed: true },
]

export default function TopNav(props: {
  authed?: boolean
  subscribed?: boolean
  isAdmin?: boolean
  redirectTo: string
}) {
  return (
    <div className="flex h-full flex-col justify-center w-full min-h-[86px] mt-4 rounded-lg px-4 sm:px-6 py-2 border-black border-2 mb-6">
      <Disclosure>
        {({ open }) => (
          <>
            <div className="h-full w-full flex justify-between">
              <div className="flex w-full items-center justify-between">
                {/* Left side */}
                <div className="flex item-start sm:items-center justify-center">
                  <div className="flex items-center gap-2">
                    {/* Mobile menu button*/}
                    <div className="inset-y-0 left-0 flex items-center sm:hidden">
                      <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-inset">
                        <FontAwesomeIcon
                          width={16}
                          icon={open ? faClose : faBars}
                        />
                      </Disclosure.Button>
                    </div>
                    <Disclosure.Button>
                      <Link to="/" className="active:!no-underline">
                        <h3>BulkUnsubscribe</h3>
                      </Link>
                    </Disclosure.Button>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex items-center gap-8">
                    <div className="hidden sm:flex gap-8 items-center justify-center text-neutral-700 font-medium">
                      {leftNav.map((item) => (
                        <Disclosure.Button key={item.name}>
                          <NavLink to={item.href}>{item.name}</NavLink>
                        </Disclosure.Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right side */}
                <div className="inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                  {!props.authed && (
                    <Link
                      className="items-center justify-center hidden sm:flex"
                      to={`/signin`}
                    >
                      <button className="gsi-material-button">
                        <div className="gsi-material-button-state" />
                        <div className="gsi-material-button-content-wrapper">
                          <div className="gsi-material-button-icon">
                            <svg
                              version="1.1"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 48 48"
                              xmlnsXlink="http://www.w3.org/1999/xlink"
                              style={{ display: "block" }}
                            >
                              <path
                                fill="#EA4335"
                                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                              />
                              <path
                                fill="#4285F4"
                                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                              />
                              <path
                                fill="#34A853"
                                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                              />
                              <path fill="none" d="M0 0h48v48H0z" />
                            </svg>
                          </div>
                          <span className="gsi-material-button-contents">
                            Continue with Google
                          </span>
                          <span style={{ display: "none" }}>
                            Continue with Google
                          </span>
                        </div>
                      </button>
                    </Link>
                  )}
                  {props.authed && (
                    <div className="hidden sm:flex gap-8 items-center justify-center text-neutral-700 font-medium">
                      {rightNav.map((item) => {
                        if (item.subscriber && !props.subscribed) {
                          return null
                        }
                        if (item.authed && !props.authed) {
                          return null
                        }
                        return (
                          <NavLink
                            end={item.end ?? false}
                            key={item.name}
                            to={item.href}
                          >
                            {item.name}
                          </NavLink>
                        )
                      })}
                      <NavLink
                        key={"signout"}
                        to={`/signout?redirectTo=${props.redirectTo}`}
                      >
                        Sign out
                      </NavLink>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Disclosure.Panel className="sm:hidden">
              <div className="space-y-1 px-2 pb-3 pt-2 flex flex-col gap-3">
                <>
                  <NavLink key={"home"} end to="/">
                    <Disclosure.Button>Home</Disclosure.Button>
                  </NavLink>
                  {[...leftNav, ...(props.authed ? rightNav : [])].map(
                    (item) => {
                      if (item.subscriber && !props.subscribed) {
                        return null
                      }
                      if (item.authed && !props.authed) {
                        return null
                      }
                      return (
                        <NavLink
                          key={item.name}
                          end={item.end ?? false}
                          to={item.href}
                        >
                          <Disclosure.Button>{item.name}</Disclosure.Button>
                        </NavLink>
                      )
                    }
                  )}
                  {!props.authed && (
                    <Link className="flex" to={`/signin`}>
                      <button className="gsi-material-button">
                        <div className="gsi-material-button-state" />
                        <div className="gsi-material-button-content-wrapper">
                          <div className="gsi-material-button-icon">
                            <svg
                              version="1.1"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 48 48"
                              xmlnsXlink="http://www.w3.org/1999/xlink"
                              style={{ display: "block" }}
                            >
                              <path
                                fill="#EA4335"
                                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                              />
                              <path
                                fill="#4285F4"
                                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                              />
                              <path
                                fill="#34A853"
                                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                              />
                              <path fill="none" d="M0 0h48v48H0z" />
                            </svg>
                          </div>
                          <span className="gsi-material-button-contents">
                            Continue with Google
                          </span>
                          <span style={{ display: "none" }}>
                            Continue with Google
                          </span>
                        </div>
                      </button>
                    </Link>
                  )}
                  {props.authed && (
                    <NavLink
                      key={"signout"}
                      to={`/signout?redirectTo=${props.redirectTo}`}
                    >
                      Sign out
                    </NavLink>
                  )}
                </>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </div>
  )
}
