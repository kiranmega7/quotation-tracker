import Link from "next/link";
import { loginAction } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

const errorLabels: Record<string, string> = {
  config: "Supabase configuration missing.",
  missing: "Please enter both email and password.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; signup?: string };
}) {
  const error = searchParams.error;
  const message = error ? errorLabels[error] ?? decodeURIComponent(error) : null;
  const signupSuccess = searchParams.signup === "success";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center">
      <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <h1 className="text-2xl font-semibold text-zinc-100">Login</h1>
        <p className="mt-1 text-sm text-zinc-500">Access your QuoteTracker pipeline.</p>

        {signupSuccess && (
          <p className="mt-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            Account created. You can log in now.
          </p>
        )}
        {message && (
          <p className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {message}
          </p>
        )}

        <form action={loginAction} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wide text-zinc-500">Email</span>
            <input
              required
              name="email"
              type="email"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-sky-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wide text-zinc-500">Password</span>
            <input
              required
              name="password"
              type="password"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-sky-500 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-500"
          >
            Login
          </button>
        </form>

        <p className="mt-4 text-sm text-zinc-500">
          New here?{" "}
          <Link href="/signup" className="text-sky-400 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
