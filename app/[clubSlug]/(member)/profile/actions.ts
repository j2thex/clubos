"use server";

import { clearMemberCookie } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export async function logout(clubSlug: string) {
  await clearMemberCookie();
  redirect(`/${clubSlug}/login`);
}

export async function updateEmail(
  memberId: string,
  email: string,
): Promise<{ error: string } | { ok: true }> {
  const trimmed = email.trim();

  if (!trimmed) {
    return { error: "Email is required" };
  }

  // Simple email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { error: "invalid" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("members")
    .update({ email: trimmed })
    .eq("id", memberId);

  if (error) {
    return { error: error.message };
  }

  return { ok: true };
}
