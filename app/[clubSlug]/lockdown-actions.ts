"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffFromCookie, getOwnerFromCookie } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { notifyStaff } from "@/lib/staff-notify";
import { revalidatePath } from "next/cache";

type Result = { error: string } | { ok: true };

// Authorize the caller against the target club. Staff cookie or owner
// cookie is accepted — either can flip the lockdown. Returns the canonical
// clubId and the staff member_id (if the caller was staff) for logging.
async function authorize(clubSlug: string): Promise<
  | { error: string }
  | { ok: true; clubId: string; staffMemberId: string | null; actor: string }
> {
  const supabase = createAdminClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .maybeSingle();

  if (!club) return { error: "Club not found" };

  const staff = await getStaffFromCookie();
  if (staff && staff.club_id === club.id) {
    const { data: m } = await supabase
      .from("members")
      .select("member_code")
      .eq("id", staff.member_id)
      .maybeSingle();
    return {
      ok: true,
      clubId: club.id,
      staffMemberId: staff.member_id,
      actor: m?.member_code ?? "staff",
    };
  }

  const owner = await getOwnerFromCookie();
  if (owner && owner.club_id === club.id) {
    return { ok: true, clubId: club.id, staffMemberId: null, actor: "admin" };
  }

  return { error: "Unauthorized" };
}

export async function lockClub(
  clubSlug: string,
  reason?: string,
): Promise<Result> {
  const auth = await authorize(clubSlug);
  if ("error" in auth) return auth;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("clubs")
    .update({
      locked_at: new Date().toISOString(),
      locked_by: auth.staffMemberId,
      locked_reason: reason?.trim() || null,
    })
    .eq("id", auth.clubId);

  if (error) return { error: "Failed to lock club" };

  await logActivity({
    clubId: auth.clubId,
    staffMemberId: auth.staffMemberId,
    action: "club_locked",
    details: reason?.trim() || null,
  });

  await notifyStaff(auth.clubId, `🔒 <b>Club locked</b> by ${auth.actor}`);

  revalidatePath(`/${clubSlug}`, "layout");
  return { ok: true };
}

export async function unlockClub(clubSlug: string): Promise<Result> {
  const auth = await authorize(clubSlug);
  if ("error" in auth) return auth;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("clubs")
    .update({ locked_at: null, locked_by: null, locked_reason: null })
    .eq("id", auth.clubId);

  if (error) return { error: "Failed to unlock club" };

  await logActivity({
    clubId: auth.clubId,
    staffMemberId: auth.staffMemberId,
    action: "club_unlocked",
  });

  await notifyStaff(auth.clubId, `🔓 <b>Club unlocked</b> by ${auth.actor}`);

  revalidatePath(`/${clubSlug}`, "layout");
  return { ok: true };
}
