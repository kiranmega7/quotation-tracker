import { addDays, format, parseISO } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import { FOLLOW_UP_OFFSETS } from "./follow-ups";

export async function replaceFollowUpsForQuote(
  supabase: SupabaseClient,
  quoteId: string,
  quoteSentDate: string | null
) {
  await supabase.from("follow_ups").delete().eq("quote_id", quoteId);

  if (!quoteSentDate) return;

  const sent = parseISO(quoteSentDate);
  const rows = FOLLOW_UP_OFFSETS.map((offset) => ({
    quote_id: quoteId,
    day_offset: offset,
    follow_up_date: format(addDays(sent, offset), "yyyy-MM-dd"),
  }));

  const { error } = await supabase.from("follow_ups").insert(rows);
  if (error) throw error;
}
