import Link from "next/link";
import { Suspense } from "react";
import { format, parseISO } from "date-fns";
import { QuotesFilters } from "@/components/QuotesFilters";
import { StatusBadge } from "@/components/StatusBadge";
import { FollowUpCountdown } from "@/components/FollowUpCountdown";
import { NotesLog } from "@/components/NotesLog";
import { SetupBanner } from "@/components/SetupBanner";
import { CLOSED_STATUSES, OPEN_STATUSES } from "@/lib/constants";
import { nextFollowUpInfo } from "@/lib/follow-ups";
import {
  needsAttentionToday,
  nextFollowUpSortKey,
  sortDateKey,
  type QuoteWithChildren,
} from "@/lib/quote-helpers";
import { createServerClient } from "@/lib/supabase/server";
import type { NoteRow, QuoteRow } from "@/lib/types";

export const dynamic = "force-dynamic";

type Search = {
  q?: string;
  status?: string;
  from?: string;
  to?: string;
  urgent?: string;
  sort?: string;
};

type QuoteRowDb = QuoteRow & {
  follow_ups: QuoteWithChildren["follow_ups"];
  notes: Pick<NoteRow, "id" | "body" | "created_at">[];
};

export default async function QuotesPage({ searchParams }: { searchParams: Search }) {
  const supabase = createServerClient();
  const initial = {
    q: searchParams.q ?? "",
    status: searchParams.status ?? "",
    from: searchParams.from ?? "",
    to: searchParams.to ?? "",
    urgent: searchParams.urgent ?? "",
    sort: searchParams.sort ?? "date",
  };

  if (!supabase) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-zinc-100">Quotes</h1>
        <SetupBanner />
      </div>
    );
  }

  let query = supabase.from("quotes").select(`
    *,
    follow_ups (*),
    notes (id, body, created_at)
  `);

  if (searchParams.status) {
    query = query.eq("status", searchParams.status);
  }
  if (searchParams.q?.trim()) {
    query = query.ilike("company_name", `%${searchParams.q.trim()}%`);
  }
  if (searchParams.from) {
    query = query.gte("quote_sent_date", searchParams.from);
  }
  if (searchParams.to) {
    query = query.lte("quote_sent_date", searchParams.to);
  }

  const { data, error } = await query;

  if (error) {
    return <p className="text-red-400">Could not load quotes: {error.message}</p>;
  }

  let rows = (data ?? []) as QuoteRowDb[];

  if (searchParams.urgent === "1") {
    rows = rows.filter((r) => {
      const q = r as QuoteWithChildren;
      return OPEN_STATUSES.includes(q.status) && needsAttentionToday(q);
    });
  }

  const sort = searchParams.sort ?? "date";
  const sorted = [...rows];
  if (sort === "value") {
    sorted.sort((a, b) => Number(b.quote_value_sgd) - Number(a.quote_value_sgd));
  } else if (sort === "followup") {
    sorted.sort(
      (a, b) =>
        nextFollowUpSortKey(a as QuoteWithChildren) - nextFollowUpSortKey(b as QuoteWithChildren)
    );
  } else {
    sorted.sort((a, b) => sortDateKey(b) - sortDateKey(a));
  }

  function fmtMoney(n: number) {
    return new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD" }).format(n);
  }

  function fmtDate(s: string | null) {
    if (!s) return "—";
    try {
      return format(parseISO(s), "d MMM yyyy");
    } catch {
      return s;
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Quotes</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {sorted.length} quote{sorted.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/quotes/new"
          className="inline-flex w-fit rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
        >
          Add quote
        </Link>
      </div>

      <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-zinc-900/60" />}>
        <QuotesFilters initial={initial} />
      </Suspense>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">RFQ</th>
              <th className="px-4 py-3 font-medium">Quote sent</th>
              <th className="px-4 py-3 font-medium">Value</th>
              <th className="px-4 py-3 font-medium">Profit</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Next follow-up</th>
              <th className="px-4 py-3 font-medium">Last note</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-zinc-500">
                  No quotes match your filters.
                </td>
              </tr>
            )}
            {sorted.map((row) => {
              const dates = row.follow_ups.map((f) => f.follow_up_date);
              const info = nextFollowUpInfo(dates);
              const noteList = [...(row.notes ?? [])]
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                .map((n) => ({ ...n, quote_id: row.id })) as NoteRow[];

              return (
                <tr key={row.id} className="border-b border-zinc-800/80 hover:bg-zinc-900/40">
                  <td className="px-4 py-3">
                    <Link href={`/quotes/${row.id}`} className="font-medium text-sky-400 hover:underline">
                      {row.company_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{row.contact_name ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-400">{fmtDate(row.rfq_date)}</td>
                  <td className="px-4 py-3 text-zinc-400">{fmtDate(row.quote_sent_date)}</td>
                  <td className="px-4 py-3 tabular-nums text-zinc-200">
                    {fmtMoney(Number(row.quote_value_sgd))}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-400">
                    {fmtMoney(Number(row.profit_sgd))}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3">
                    {!CLOSED_STATUSES.includes(row.status) ? (
                      <FollowUpCountdown
                        nextDate={info.nextDate}
                        urgency={info.urgency}
                        daysUntil={info.daysUntil}
                      />
                    ) : (
                      <span className="text-xs text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="max-w-[200px] px-4 py-3">
                    <NotesLog quoteId={row.id} notes={noteList as NoteRow[]} compact />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
