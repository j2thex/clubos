"use server";

import { clearStaffCookie, requireStaffForClub } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity-log";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const LOCK_REDIRECT_URL = "https://www.google.com/";

export async function logoutStaff(clubSlug: string) {
  await clearStaffCookie();
  redirect(`/${clubSlug}/staff/login`);
}

export async function lockClubFromStaff(
  clubId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true; redirect: string }> {
  let session;
  try {
    session = await requireStaffForClub(clubId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const supabase = createAdminClient();

  const { data: member } = await supabase
    .from("members")
    .select("member_code")
    .eq("id", session.member_id)
    .single();

  const { error } = await supabase
    .from("clubs")
    .update({
      locked_at: new Date().toISOString(),
      locked_by_id: session.member_id,
      locked_by_type: "staff",
    })
    .eq("id", clubId)
    .is("locked_at", null);

  if (error) return { error: "Failed to lock club" };

  await logActivity({
    clubId,
    staffMemberId: session.member_id,
    action: "club_lockdown",
    details: `staff:${member?.member_code ?? session.member_id}`,
  });

  // Log the locker out immediately — their cookie must not survive the lock.
  await clearStaffCookie();
  revalidatePath(`/${clubSlug}`, "layout");
  return { ok: true, redirect: LOCK_REDIRECT_URL };
}
