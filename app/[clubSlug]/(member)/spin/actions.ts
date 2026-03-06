"use server";

import { getMemberFromCookie } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function performSpin() {
  const memberPayload = await getMemberFromCookie();
  if (!memberPayload) return { error: "Not authenticated" };

  const supabase = createAdminClient();

  // Check balance
  const { data: member } = await supabase
    .from("members")
    .select("id, spin_balance, club_id")
    .eq("id", memberPayload.member_id)
    .single();

  if (!member || member.spin_balance <= 0) {
    return { error: "No spins available" };
  }

  // Get wheel config
  const { data: segments } = await supabase
    .from("wheel_configs")
    .select("*")
    .eq("club_id", member.club_id)
    .eq("active", true);

  if (!segments || segments.length === 0) {
    return { error: "Wheel not configured" };
  }

  // Weighted random selection
  const totalProb = segments.reduce(
    (sum, s) => sum + Number(s.probability),
    0
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
    club_id: member.club_id,
    member_id: member.id,
    outcome_label: selected.label,
    outcome_value: selected.reward_value,
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
