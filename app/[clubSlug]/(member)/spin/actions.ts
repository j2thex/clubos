"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getMemberFromCookie } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { notifyStaff } from "@/lib/staff-notify";

export async function memberSpin(
  clubSlug: string,
): Promise<
  | { error: string }
  | {
      outcome: { label: string; labelEs: string | null; rewardType: string; value: number; color: string };
      newBalance: number;
      segmentIndex: number;
    }
> {
  const session = await getMemberFromCookie();
  if (!session) {
    return { error: "Not logged in" };
  }

  const supabase = createAdminClient();

  // Get member with balance
  const { data: member } = await supabase
    .from("members")
    .select("id, spin_balance, member_code, club_id, status")
    .eq("id", session.member_id)
    .eq("club_id", session.club_id)
    .single();

  if (!member || member.status !== "active") {
    return { error: "Account is inactive" };
  }

  if (member.spin_balance <= 0) {
    return { error: "No spins remaining" };
  }

  // Get wheel config
  const { data: segments } = await supabase
    .from("wheel_configs")
    .select("*")
    .eq("club_id", session.club_id)
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (!segments || segments.length === 0) {
    return { error: "Wheel not configured" };
  }

  // Weighted random selection
  const totalProb = segments.reduce(
    (sum, s) => sum + Number(s.probability),
    0,
  );
  let random = Math.random() * totalProb;
  let selected = segments[0];
  for (const segment of segments) {
    random -= Number(segment.probability);
    if (random <= 0) {
      selected = segment;
      break;
    }
  }

  const isWin = selected.reward_type !== "nothing" && selected.reward_value > 0;

  // Decrement balance
  await supabase
    .from("members")
    .update({ spin_balance: member.spin_balance - 1 })
    .eq("id", member.id);

  // Insert spin record
  await supabase.from("spins").insert({
    club_id: session.club_id,
    member_id: member.id,
    outcome_label: selected.label,
    outcome_value: selected.reward_value,
    status: isWin ? "pending" : "fulfilled",
  });

  // Log activity
  await logActivity({
    clubId: session.club_id,
    staffMemberId: null,
    action: "member_spin",
    targetMemberCode: member.member_code,
    details: `${selected.label}${selected.reward_value > 0 ? ` (+${selected.reward_value})` : ""}`,
  });

  // Notify staff if member won a prize
  if (isWin) {
    notifyStaff(
      session.club_id,
      `🎰 Member spin result\n<b>${selected.label}</b>\nMember: ${member.member_code}\nFulfill the prize!`,
    );
  }

  return {
    outcome: {
      label: selected.label,
      labelEs: selected.label_es ?? null,
      rewardType: selected.reward_type,
      value: selected.reward_value,
      color: selected.color,
    },
    newBalance: member.spin_balance - 1,
    segmentIndex: segments.indexOf(selected),
  };
}
