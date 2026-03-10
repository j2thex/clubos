"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffFromCookie } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function lookupMember(memberCode: string, clubId: string): Promise<{ error: string } | { memberCode: string; balance: number }> {
  const code = memberCode.trim().toUpperCase();
  if (!code || code.length < 3 || code.length > 6) {
    return { error: "Invalid member code" };
  }

  const supabase = createAdminClient();

  const { data: member } = await supabase
    .from("members")
    .select("id, spin_balance, member_code")
    .eq("club_id", clubId)
    .eq("member_code", code)
    .single();

  if (!member) {
    return { error: "Member not found" };
  }

  return {
    memberCode: member.member_code,
    balance: member.spin_balance,
  };
}

export async function performSpinForMember(memberCode: string, clubId: string): Promise<{ error: string } | { outcome: { label: string; rewardType: string; value: number; color: string }; newBalance: number; segmentIndex: number }> {
  const code = memberCode.trim().toUpperCase();
  if (!code || code.length < 3 || code.length > 6) {
    return { error: "Invalid member code" };
  }

  const supabase = createAdminClient();

  // Look up member
  const { data: member } = await supabase
    .from("members")
    .select("id, spin_balance, club_id")
    .eq("club_id", clubId)
    .eq("member_code", code)
    .single();

  if (!member) {
    return { error: "Member not found" };
  }

  if (member.spin_balance <= 0) {
    return { error: "No spins remaining for this member" };
  }

  // Get wheel config
  const { data: segments } = await supabase
    .from("wheel_configs")
    .select("*")
    .eq("club_id", clubId)
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

  // Decrement balance and log spin
  await supabase
    .from("members")
    .update({ spin_balance: member.spin_balance - 1 })
    .eq("id", member.id);

  await supabase.from("spins").insert({
    club_id: clubId,
    member_id: member.id,
    outcome_label: selected.label,
    outcome_value: selected.reward_value,
  });

  const staff = await getStaffFromCookie();
  await logActivity({
    clubId,
    staffMemberId: staff?.member_id,
    action: "spin_performed",
    targetMemberCode: code,
    details: `${selected.label}${selected.reward_value > 0 ? ` (+${selected.reward_value} spins)` : ""}`,
  });

  return {
    outcome: {
      label: selected.label,
      rewardType: selected.reward_type,
      value: selected.reward_value,
      color: selected.color,
    },
    newBalance: member.spin_balance - 1,
    segmentIndex: segments.indexOf(selected),
  };
}
