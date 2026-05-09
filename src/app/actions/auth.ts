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
  const inviteCode = String(formData.get("invite_code") ?? "").trim();

  if (!email || !password || !name || !inviteCode) {
    redirect("/signup?error=missing");
  }

  const expectedInviteCode = process.env.INVITE_CODE?.trim();
  if (!expectedInviteCode || inviteCode !== expectedInviteCode) {
    redirect(
      `/signup?error=${encodeURIComponent("Invalid invite code. Please contact admin for access.")}`
    );
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
