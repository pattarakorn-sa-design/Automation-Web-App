"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { getNavItems, isActive, type Role } from "./navigation";

type NavbarProps = {
  user: { fullName: string; role: Role };
  // Server Action that signs the user out, e.g. signOut from features/auth/actions.
  signOutAction: () => void | Promise<void>;
};

const linkBase =
  "block rounded-md px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";
const linkActive =
  "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
const linkIdle =
  "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800";

// Top navigation for signed-in pages. Below the md breakpoint the menu is
// folded behind a button so it fits a 360 px wide screen.
export default function Navbar({ user, signOutAction }: NavbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = getNavItems(user.role);
  const closeMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3"
      >
        <Link
          href="/"
          onClick={closeMenu}
          className="mr-auto text-base font-semibold text-gray-900 md:mr-0 dark:text-gray-100"
        >
          Alarm &amp; Maintenance
        </Link>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="main-menu"
          onClick={() => setOpen((value) => !value)}
          className="rounded-md border border-gray-300 p-2 text-gray-700 hover:bg-gray-100 md:hidden dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <span className="sr-only">Menu</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>

        <div
          id="main-menu"
          className={`${open ? "flex" : "hidden"} w-full flex-col gap-3 md:flex md:w-auto md:flex-1 md:flex-row md:items-center md:justify-between md:gap-6`}
        >
          <ul className="flex flex-col gap-1 md:flex-row">
            {items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeMenu}
                    aria-current={active ? "page" : undefined}
                    className={`${linkBase} ${active ? linkActive : linkIdle}`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-3 md:justify-end md:border-t-0 md:pt-0 dark:border-gray-800">
            <Link
              href="/profile"
              onClick={closeMenu}
              className="flex min-w-0 items-center gap-2 rounded-md px-1 py-1 text-sm text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
            >
              <span className="truncate font-medium">{user.fullName}</span>
              <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {user.role}
              </span>
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </nav>
    </header>
  );
}
