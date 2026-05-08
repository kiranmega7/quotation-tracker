"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export async function addNote(quoteId: string, body: string) {
  const supabase = createServerClient();
  if (!supabase) return { error: "Supabase is not configured." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const trimmed = body.trim();
  if (!trimmed) return { error: "Note cannot be empty." };

  const { error } = await supabase.from("notes").insert({
    quote_id: quoteId,
    body: trimmed,
  });

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
  return { success: true };
}
