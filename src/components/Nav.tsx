import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/quotes", label: "Quotes" },
];

export function Nav() {
  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-100">
          Quote<span className="text-sky-400">Tracker</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
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
        </nav>
      </div>
    </header>
  );
}
