"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { replaceFollowUpsForQuote } from "@/lib/sync-follow-ups";
import type { PaymentTerms, QuoteStatus } from "@/lib/types";

export type QuoteFormState = {
  company_name: string;
  contact_name: string;
  contact_number: string;
  rfq_date: string;
  quote_sent_date: string;
  quote_value_sgd: string;
  profit_sgd: string;
  brand_description: string;
  payment_terms: PaymentTerms;
  status: QuoteStatus;
};

function parseNum(s: string, fallback = 0): number {
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : fallback;
}

export async function createQuote(form: QuoteFormState) {
  const supabase = createServerClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const row = {
    company_name: form.company_name.trim(),
    contact_name: form.contact_name.trim() || null,
    contact_number: form.contact_number.trim() || null,
    rfq_date: form.rfq_date || null,
    quote_sent_date: form.quote_sent_date || null,
    quote_value_sgd: parseNum(form.quote_value_sgd),
    profit_sgd: parseNum(form.profit_sgd),
    brand_description: form.brand_description.trim() || null,
    payment_terms: form.payment_terms,
    status: form.status,
  };

  if (!row.company_name) {
    return { error: "Company name is required." };
  }

  const { data, error } = await supabase.from("quotes").insert(row).select("id").single();
  if (error) return { error: error.message };

  await replaceFollowUpsForQuote(supabase, data.id, row.quote_sent_date);

  revalidatePath("/");
  revalidatePath("/quotes");
  return { success: true, id: data.id };
}

export async function updateQuote(id: string, form: QuoteFormState) {
  const supabase = createServerClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const row = {
    company_name: form.company_name.trim(),
    contact_name: form.contact_name.trim() || null,
    contact_number: form.contact_number.trim() || null,
    rfq_date: form.rfq_date || null,
    quote_sent_date: form.quote_sent_date || null,
    quote_value_sgd: parseNum(form.quote_value_sgd),
    profit_sgd: parseNum(form.profit_sgd),
    brand_description: form.brand_description.trim() || null,
    payment_terms: form.payment_terms,
    status: form.status,
  };

  if (!row.company_name) {
    return { error: "Company name is required." };
  }

  const { error } = await supabase.from("quotes").update(row).eq("id", id);
  if (error) return { error: error.message };

  await replaceFollowUpsForQuote(supabase, id, row.quote_sent_date);

  revalidatePath("/");
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${id}`);
  revalidatePath(`/quotes/${id}/edit`);
  return { success: true, id };
}
