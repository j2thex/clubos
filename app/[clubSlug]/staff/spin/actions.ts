"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireActiveStaff } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function approveBonus(
  spinId: string,
  clubId: string,
): Promise<{ error: string } | { success: true }> {
  let staffSession: { member_id: string; club_id: string };
  try { staffSession = await requireActiveStaff(); } catch { return { error: "Account is inactive" }; }

  const supabase = createAdminClient();

  const { data: spin } = await supabase
    .from("spins")
    .select("id, status, outcome_label, club_id, members!inner(member_code)")
    .eq("id", spinId)
    .eq("club_id", clubId)
    .single();

  if (!spin) return { error: "Bonus not found" };
  if (spin.status !== "pending") return { error: "Already approved" };

  const { error } = await supabase
    .from("spins")
    .update({
      status: "fulfilled",
      fulfilled_by: staffSession.member_id,
      fulfilled_at: new Date().toISOString(),
    })
    .eq("id", spinId);

  if (error) return { error: "Failed to approve" };

  const member = Array.isArray(spin.members) ? spin.members[0] : spin.members;
  await logActivity({
    clubId,
    staffMemberId: staffSession.member_id,
    action: "bonus_approved",
    targetMemberCode: (member as { member_code: string } | null)?.member_code ?? null,
    details: spin.outcome_label,
  });

  return { success: true };
}
