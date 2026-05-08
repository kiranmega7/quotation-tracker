import Link from "next/link";
import { redirect } from "next/navigation";
import {
  conversionRate,
  needsAttentionToday,
  pipelineValue,
  quoteInCurrentMonth,
  type QuoteWithChildren,
} from "@/lib/quote-helpers";
import { SetupBanner } from "@/components/SetupBanner";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type DashboardSearch = {
  rep?: string;
};

export default async function DashboardPage({ searchParams }: { searchParams: DashboardSearch }) {
  const supabase = createServerClient();
  if (!supabase) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Dashboard</h1>
        <SetupBanner />
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const isAdmin = Boolean(adminEmail && user.email?.toLowerCase() === adminEmail);
  const selectedRep = searchParams.rep?.trim() || "";

  let rows: QuoteWithChildren[] = [];
  let repOptions: Array<{ id: string; email: string }> = [];

  if (isAdmin) {
    const adminClient = createAdminClient();
    if (!adminClient) {
      return (
        <p className="text-red-400">
          Manager mode needs <code className="rounded bg-zinc-800 px-1">SUPABASE_SERVICE_ROLE_KEY</code>.
        </p>
      );
    }

    let query = adminClient.from("quotes").select("*, follow_ups (*)");
    if (selectedRep) {
      query = query.eq("user_id", selectedRep);
    }
    const { data: allRows, error } = await query;
    if (error) return <p className="text-red-400">Could not load team quotes: {error.message}</p>;
    rows = (allRows ?? []) as QuoteWithChildren[];

    const { data: userList, error: usersError } = await adminClient.auth.admin.listUsers();
    if (!usersError) {
      repOptions = (userList?.users ?? []).map((u) => ({ id: u.id, email: u.email ?? u.id }));
    }
  } else {
    const { data: ownRows, error } = await supabase.from("quotes").select("*, follow_ups (*)");
    if (error) {
      return (
        <p className="text-red-400">
          Could not load quotes: {error.message}. Check your Supabase URL, key, and that{" "}
          <code className="rounded bg-zinc-800 px-1">schema.sql</code> was applied.
        </p>
      );
    }
    rows = (ownRows ?? []) as QuoteWithChildren[];
  }

  const quotes = rows;
  const thisMonth = quotes.filter((q) => quoteInCurrentMonth(q));
  const pipeline = pipelineValue(quotes);
  const conversion = conversionRate(quotes);
  const urgent = quotes.filter((q) => needsAttentionToday(q));

  function fmtMoney(n: number) {
    return new Intl.NumberFormat("en-SG", {
      style: "currency",
      currency: "SGD",
      maximumFractionDigits: 0,
    }).format(n);
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {isAdmin ? "Team pipeline overview (manager mode)." : "Overview of your quotes and follow-ups."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <form className="rounded-md border border-zinc-700 bg-zinc-900/70 px-2 py-1">
              <label className="mr-2 text-xs text-zinc-400">Rep</label>
              <select
                name="rep"
                defaultValue={selectedRep}
                className="rounded bg-zinc-900 px-2 py-1 text-xs text-zinc-200"
              >
                <option value="">All reps</option>
                {repOptions.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.email}
                  </option>
                ))}
              </select>
              <button className="ml-2 rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-200">Apply</button>
            </form>
          )}
          {!isAdmin && (
            <Link
              href="/quotes/new"
              className="inline-flex w-fit items-center justify-center rounded-md bg-sky-600 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-sky-500"
            >
              Quick add quote
            </Link>
          )}
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Quotes this month</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-100">{thisMonth.length}</p>
          <p className="mt-1 text-xs text-zinc-600">By quote sent date, else record created date.</p>
        </article>
        <article className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Pipeline (SGD)</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-emerald-300">{fmtMoney(pipeline)}</p>
          <p className="mt-1 text-xs text-zinc-600">Open statuses only.</p>
        </article>
        <article className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Conversion rate</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-sky-300">{conversion}%</p>
          <p className="mt-1 text-xs text-zinc-600">Closed won ÷ all quotes.</p>
        </article>
        <article className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Needs attention</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-red-300">{urgent.length}</p>
          <p className="mt-1 text-xs text-zinc-600">Open deals with overdue or today follow-up.</p>
        </article>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-zinc-200">Deals requiring follow-up today</h2>
        {urgent.length === 0 ? (
          <p className="rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-3 text-sm text-zinc-500">
            None right now. You’re all caught up.
          </p>
        ) : (
          <ul className="space-y-2">
            {urgent.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/quotes/${q.id}`}
                  className="flex items-center justify-between rounded-lg border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm transition hover:bg-red-500/10"
                >
                  <span className="font-medium text-red-100">{q.company_name}</span>
                  <span className="text-xs text-red-300/90">View →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
