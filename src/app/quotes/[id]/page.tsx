import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { FollowUpCountdown } from "@/components/FollowUpCountdown";
import { FollowUpTimeline } from "@/components/FollowUpTimeline";
import { NotesLog } from "@/components/NotesLog";
import { StatusBadge } from "@/components/StatusBadge";
import { SetupBanner } from "@/components/SetupBanner";
import { CLOSED_STATUSES } from "@/lib/constants";
import { nextFollowUpInfo } from "@/lib/follow-ups";
import { createServerClient } from "@/lib/supabase/server";
import type { FollowUpRow, NoteRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function QuoteDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient();
  if (!supabase) {
    return (
      <div className="space-y-6">
        <SetupBanner />
      </div>
    );
  }

  const { data, error } = await supabase
    .from("quotes")
    .select(
      `
      *,
      follow_ups (*),
      notes (*)
    `
    )
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    return <p className="text-red-400">{error.message}</p>;
  }
  if (!data) {
    notFound();
  }

  const followUps = (data.follow_ups ?? []) as FollowUpRow[];
  const notesRaw = (data.notes ?? []) as NoteRow[];
  const notes = notesRaw.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const dates = followUps.map((f) => f.follow_up_date);
  const fu = nextFollowUpInfo(dates);
  const open = !CLOSED_STATUSES.includes(data.status);

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
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">{data.company_name}</h1>
            <StatusBadge status={data.status} />
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            Updated {format(parseISO(data.updated_at), "d MMM yyyy, HH:mm")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/quotes/${params.id}/edit`}
            className="rounded-md border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            Edit quote
          </Link>
          <Link href="/quotes" className="rounded-md px-4 py-2 text-sm text-sky-400 hover:underline">
            ← Back to quotes
          </Link>
        </div>
      </div>

      {open && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-sm font-medium text-zinc-400">Next follow-up</h2>
          <div className="mt-3">
            <FollowUpCountdown nextDate={fu.nextDate} urgency={fu.urgency} daysUntil={fu.daysUntil} />
          </div>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
          <h2 className="text-sm font-medium text-zinc-400">Details</h2>
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-zinc-800/80 pb-2">
              <dt className="text-zinc-500">Contact</dt>
              <dd className="text-right text-zinc-200">{data.contact_name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-zinc-800/80 pb-2">
              <dt className="text-zinc-500">Phone</dt>
              <dd className="text-right text-zinc-200">{data.contact_number ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-zinc-800/80 pb-2">
              <dt className="text-zinc-500">RFQ date</dt>
              <dd className="text-right text-zinc-200">{fmtDate(data.rfq_date)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-zinc-800/80 pb-2">
              <dt className="text-zinc-500">Quote sent</dt>
              <dd className="text-right text-zinc-200">{fmtDate(data.quote_sent_date)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-zinc-800/80 pb-2">
              <dt className="text-zinc-500">Value</dt>
              <dd className="text-right tabular-nums text-zinc-200">
                {fmtMoney(Number(data.quote_value_sgd))}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-zinc-800/80 pb-2">
              <dt className="text-zinc-500">Profit</dt>
              <dd className="text-right tabular-nums text-zinc-200">
                {fmtMoney(Number(data.profit_sgd))}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-zinc-800/80 pb-2">
              <dt className="text-zinc-500">Payment terms</dt>
              <dd className="text-right text-zinc-200">{data.payment_terms}</dd>
            </div>
            <div className="pt-1">
              <dt className="text-zinc-500">Brand / product</dt>
              <dd className="mt-1 whitespace-pre-wrap text-zinc-200">{data.brand_description ?? "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
            <FollowUpTimeline rows={followUps} />
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
            <NotesLog quoteId={params.id} notes={notes} />
          </div>
        </div>
      </section>
    </div>
  );
}
