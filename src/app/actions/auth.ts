"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export async function loginAction(formData: FormData) {
  const supabase = createServerClient();
  if (!supabase) redirect("/login?error=config");

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=missing");
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}

export async function signupAction(formData: FormData) {
  const supabase = createServerClient();
  if (!supabase) redirect("/signup?error=config");

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!email || !password || !name) {
    redirect("/signup?error=missing");
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?signup=success");
}

export async function logoutAction() {
  const supabase = createServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/login");
}
