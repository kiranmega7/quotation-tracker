import { cookies } from "next/headers";
import { createServerClient as createSsrServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export function createServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const cookieStore = cookies();
  return createSsrServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Ignore cookie writes where Next disallows mutations.
        }
      },
    },
  });
}
