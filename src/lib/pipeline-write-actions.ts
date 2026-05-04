import { format, isValid, parse } from "date-fns";
import { QUOTE_STATUSES } from "@/lib/constants";
import { createServerClient } from "@/lib/supabase/server";
import type { PipelineSnapshot } from "@/lib/pipeline-context";
import type { QuoteStatus } from "@/lib/types";

type RequestedAction =
  | { type: "add_note"; quote: string; note: string }
  | { type: "update_status"; quote: string; status: string }
  | { type: "update_follow_up"; quote: string; date: string; day?: number; target?: "next" | "specific_day" };

type ActionResult = {
  ok: boolean;
  summary: string;
};

function normalize(input: string): string {
  return input.trim().toLowerCase();
}

function parseDateInput(input: string): string | null {
  const value = input.trim();
  const now = new Date();
  const candidates = [
    parse(value, "yyyy-MM-dd", now),
    parse(value, "d MMM yyyy", now),
    parse(value, "d MMMM yyyy", now),
    parse(value, "MMM d, yyyy", now),
    parse(value, "MMMM d, yyyy", now),
    parse(value, "MMM d", now),
    parse(value, "MMMM d", now),
    new Date(value),
  ];

  const parsed = candidates.find((d) => isValid(d));
  if (!parsed) return null;
  return format(parsed, "yyyy-MM-dd");
}

function resolveQuote(snapshot: PipelineSnapshot, quoteRef: string) {
  const ref = normalize(quoteRef);
  if (!ref) return null;

  const exactId = snapshot.quotes.find((q) => normalize(q.id) === ref);
  if (exactId) return exactId;

  const exactCompany = snapshot.quotes.find((q) => normalize(q.company) === ref);
  if (exactCompany) return exactCompany;

  const partial = snapshot.quotes.filter((q) => {
    const company = normalize(q.company);
    return company.includes(ref) || ref.includes(company);
  });

  if (partial.length === 1) return partial[0];
  if (partial.length > 1) return { ambiguous: true, options: partial.slice(0, 5).map((p) => p.company) };
  return null;
}

function normalizeStatus(input: string): QuoteStatus | null {
  const cleaned = normalize(input).replace(/\s+/g, " ");
  const mapped = QUOTE_STATUSES.find((status) => normalize(status) === cleaned);
  if (mapped) return mapped;

  if (cleaned === "checking") return "Checking With Supplier";
  if (cleaned === "won") return "Closed Won";
  if (cleaned === "lost") return "Closed Lost";
  return null;
}

async function applyOneAction(snapshot: PipelineSnapshot, action: RequestedAction): Promise<ActionResult> {
  const supabase = createServerClient();
  if (!supabase) {
    return { ok: false, summary: "Supabase is not configured." };
  }

  const target = resolveQuote(snapshot, action.quote);
  if (!target) {
    return { ok: false, summary: `Could not find quote matching "${action.quote}".` };
  }
  if ("ambiguous" in target) {
    return {
      ok: false,
      summary: `Quote reference "${action.quote}" is ambiguous: ${target.options.join(", ")}.`,
    };
  }

  if (action.type === "add_note") {
    const note = action.note.trim();
    if (!note) return { ok: false, summary: `Skipped empty note for ${target.company}.` };

    const { error } = await supabase.from("notes").insert({ quote_id: target.id, body: note });
    if (error) return { ok: false, summary: `Failed to add note for ${target.company}: ${error.message}` };
    return { ok: true, summary: `Added note to ${target.company}.` };
  }

  if (action.type === "update_status") {
    const status = normalizeStatus(action.status);
    if (!status) {
      return { ok: false, summary: `Invalid status "${action.status}" for ${target.company}.` };
    }

    const { error } = await supabase.from("quotes").update({ status }).eq("id", target.id);
    if (error) return { ok: false, summary: `Failed to update status for ${target.company}: ${error.message}` };
    return { ok: true, summary: `Updated ${target.company} status to ${status}.` };
  }

  const parsedDate = parseDateInput(action.date);
  if (!parsedDate) {
    return { ok: false, summary: `Could not parse follow-up date "${action.date}" for ${target.company}.` };
  }

  if (action.target === "specific_day" || action.day) {
    const dayOffset = action.day;
    if (!dayOffset || ![3, 7, 14, 21].includes(dayOffset)) {
      return { ok: false, summary: `Follow-up day must be one of 3, 7, 14, 21 for ${target.company}.` };
    }

    const { error } = await supabase
      .from("follow_ups")
      .update({ follow_up_date: parsedDate })
      .eq("quote_id", target.id)
      .eq("day_offset", dayOffset);
    if (error) return { ok: false, summary: `Failed to update Day ${dayOffset} for ${target.company}: ${error.message}` };
    return { ok: true, summary: `Updated ${target.company} Day ${dayOffset} follow-up to ${parsedDate}.` };
  }

  const nextDay = [...target.followUps].sort((a, b) => a.date.localeCompare(b.date))[0];
  if (!nextDay) {
    return { ok: false, summary: `No follow-up rows exist for ${target.company}.` };
  }

  const { error } = await supabase
    .from("follow_ups")
    .update({ follow_up_date: parsedDate })
    .eq("quote_id", target.id)
    .eq("day_offset", nextDay.day);
  if (error) {
    return { ok: false, summary: `Failed to update next follow-up for ${target.company}: ${error.message}` };
  }
  return {
    ok: true,
    summary: `Updated ${target.company} next follow-up (Day ${nextDay.day}) to ${parsedDate}.`,
  };
}

export async function applyPipelineActions(
  snapshot: PipelineSnapshot,
  actions: RequestedAction[]
): Promise<{ summaries: string[]; anySuccess: boolean }> {
  const summaries: string[] = [];
  let anySuccess = false;

  for (const action of actions) {
    const result = await applyOneAction(snapshot, action);
    summaries.push(result.summary);
    if (result.ok) anySuccess = true;
  }

  return { summaries, anySuccess };
}

export type ExtractedActions = {
  actions: RequestedAction[];
};

export function parseExtractedActions(raw: string): ExtractedActions {
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(cleaned) as ExtractedActions;
  if (!parsed || !Array.isArray(parsed.actions)) return { actions: [] };
  return parsed;
}
