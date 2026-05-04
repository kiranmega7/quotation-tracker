import { endOfMonth, isAfter, isBefore, parseISO, startOfMonth } from "date-fns";
import { CLOSED_STATUSES, OPEN_STATUSES } from "@/lib/constants";
import { nextFollowUpInfo } from "@/lib/follow-ups";
import type { FollowUpRow, QuoteRow } from "@/lib/types";

export type QuoteWithChildren = QuoteRow & {
  follow_ups: FollowUpRow[];
};

export function quoteInCurrentMonth(q: QuoteRow, ref = new Date()): boolean {
  const start = startOfMonth(ref);
  const end = endOfMonth(ref);
  if (q.quote_sent_date) {
    const d = parseISO(q.quote_sent_date);
    return !isBefore(d, start) && !isAfter(d, end);
  }
  const c = parseISO(q.created_at);
  return !isBefore(c, start) && !isAfter(c, end);
}

export function pipelineValue(quotes: QuoteRow[]): number {
  return quotes
    .filter((q) => OPEN_STATUSES.includes(q.status))
    .reduce((sum, q) => sum + Number(q.quote_value_sgd ?? 0), 0);
}

export function conversionRate(quotes: QuoteRow[]): number {
  if (quotes.length === 0) return 0;
  const won = quotes.filter((q) => q.status === "Closed Won").length;
  return Math.round((won / quotes.length) * 1000) / 10;
}

export function needsAttentionToday(q: QuoteWithChildren): boolean {
  if (CLOSED_STATUSES.includes(q.status)) return false;
  const dates = q.follow_ups.map((f) => f.follow_up_date);
  const { urgency } = nextFollowUpInfo(dates);
  return urgency === "today" || urgency === "overdue";
}

export function sortDateKey(q: QuoteRow): number {
  const s = q.quote_sent_date ?? q.rfq_date ?? q.created_at.slice(0, 10);
  return new Date(s).getTime();
}

export function nextFollowUpSortKey(q: QuoteWithChildren): number {
  const dates = q.follow_ups.map((f) => f.follow_up_date);
  const { nextDate } = nextFollowUpInfo(dates);
  if (!nextDate) return Number.MAX_SAFE_INTEGER;
  return new Date(nextDate).getTime();
}
