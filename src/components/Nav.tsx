import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { createServerClient } from "@/lib/supabase/server";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/quotes", label: "Quotes" },
];

export async function Nav() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const displayName = user?.user_metadata?.name ?? user?.email ?? "";

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-100">
          Quote<span className="text-sky-400">Tracker</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {user ? (
            <>
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-100"
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href="/quotes/new"
                className="ml-2 rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-500"
              >
                Add quote
              </Link>
              <span className="ml-2 hidden rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 sm:inline">
                {displayName}
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100"
                >
                  Logout
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-900"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-500"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
