import { format } from "date-fns";
import { CLOSED_STATUSES, OPEN_STATUSES } from "@/lib/constants";
import { nextFollowUpInfo } from "@/lib/follow-ups";
import type { QuoteWithChildren } from "@/lib/quote-helpers";
import { createServerClient } from "@/lib/supabase/server";

export type PipelineSnapshot = {
  generatedAt: string;
  dashboard: {
    totalQuotes: number;
    pipelineValueSgd: number;
    conversionRatePercent: number;
  };
  overdueFollowUps: Array<{
    company: string;
    status: string;
    nextFollowUpDate: string;
    quoteValueSgd: number;
    profitSgd: number;
  }>;
  quotes: Array<{
    id: string;
    company: string;
    status: string;
    quoteValueSgd: number;
    profitSgd: number;
    quoteSentDate: string | null;
    nextFollowUpDate: string | null;
    followUps: Array<{ day: number; date: string }>;
  }>;
};

export async function getPipelineSnapshot(): Promise<{ data: PipelineSnapshot | null; error?: string }> {
  const supabase = createServerClient();
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("quotes")
    .select("id, company_name, status, quote_value_sgd, profit_sgd, quote_sent_date, follow_ups (*)");

  if (error) {
    return { data: null, error: error.message };
  }

  const rows = ((data ?? []) as QuoteWithChildren[]).map((q) => {
    const sortedFollowUps = [...(q.follow_ups ?? [])].sort((a, b) => a.day_offset - b.day_offset);
    const next = nextFollowUpInfo(sortedFollowUps.map((f) => f.follow_up_date));
    return {
      id: q.id,
      company: q.company_name,
      status: q.status,
      quoteValueSgd: Number(q.quote_value_sgd ?? 0),
      profitSgd: Number(q.profit_sgd ?? 0),
      quoteSentDate: q.quote_sent_date ?? null,
      nextFollowUpDate: next.nextDate,
      followUps: sortedFollowUps.map((f) => ({ day: f.day_offset, date: f.follow_up_date })),
    };
  });

  const overdueFollowUps = rows
    .filter((r) => {
      if (!r.nextFollowUpDate) return false;
      if (CLOSED_STATUSES.includes(r.status)) return false;
      return nextFollowUpInfo([r.nextFollowUpDate]).urgency === "overdue";
    })
    .map((r) => ({
      company: r.company,
      status: r.status,
      nextFollowUpDate: r.nextFollowUpDate as string,
      quoteValueSgd: r.quoteValueSgd,
      profitSgd: r.profitSgd,
    }));

  const totalQuotes = rows.length;
  const pipelineValueSgd = rows
    .filter((r) => OPEN_STATUSES.includes(r.status))
    .reduce((sum, row) => sum + row.quoteValueSgd, 0);
  const closedWon = rows.filter((r) => r.status === "Closed Won").length;
  const conversionRatePercent = totalQuotes === 0 ? 0 : Math.round((closedWon / totalQuotes) * 1000) / 10;

  return {
    data: {
      generatedAt: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      dashboard: {
        totalQuotes,
        pipelineValueSgd,
        conversionRatePercent,
      },
      overdueFollowUps,
      quotes: rows,
    },
  };
}
