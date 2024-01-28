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
  { name: "Posts", href: "/" },
  { name: "About", href: "/about" },
  { name: "Terms", href: "/terms" },
]

const rightNav: LinkItem[] = [
  { name: "Settings", href: "/settings", authed: true },
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
                        <h3>aspiring.dev</h3>
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
                      <button>
                        <img
                          src="https://huggingface.co/datasets/huggingface/badges/resolve/main/sign-in-with-huggingface-lg.svg"
                          alt="huggingface logo"
                        />
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
                      {props.isAdmin && (
                        <NavLink key={"posts"} to={`/admin/posts`}>
                          Posts
                        </NavLink>
                      )}
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
                      <button>
                        <img
                          src="https://huggingface.co/datasets/huggingface/badges/resolve/main/sign-in-with-huggingface-lg.svg"
                          alt="huggingface logo"
                        />
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
                  {props.isAdmin && (
                    <NavLink key={"posts"} to={`/admin/posts`}>
                      Posts
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
