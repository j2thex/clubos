"use server";

import { clearMemberCookie, getMemberFromCookie } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export async function logout(clubSlug: string) {
  await clearMemberCookie();
  redirect(`/${clubSlug}/login`);
}

export async function updateRole(roleId: string | null) {
  const session = await getMemberFromCookie();
  if (!session) return { error: "Not authenticated" };

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("members")
    .update({ role_id: roleId || null })
    .eq("id", session.member_id);

  if (error) {
    return { error: "Failed to update role" };
  }

  return { ok: true };
}
