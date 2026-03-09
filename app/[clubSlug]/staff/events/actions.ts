"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function checkinMember(
  memberCode: string,
  eventId: string,
  clubId: string,
  staffMemberId: string,
): Promise<{ error: string } | { ok: true; newBalance: number }> {
  const code = memberCode.trim().toUpperCase();

  if (!code || code.length < 3 || code.length > 6) {
    return { error: "Invalid member code" };
  }
  if (!/^[A-Z0-9]+$/.test(code)) {
    return { error: "Invalid member code" };
  }

  const supabase = createAdminClient();

  // Look up member
  const { data: member } = await supabase
    .from("members")
    .select("id, spin_balance")
    .eq("club_id", clubId)
    .eq("member_code", code)
    .eq("status", "active")
    .single();

  if (!member) return { error: "Member not found" };

  // Get event reward
  const { data: event } = await supabase
    .from("events")
    .select("reward_spins")
    .eq("id", eventId)
    .single();

  if (!event) return { error: "Event not found" };

  // Insert checkin (unique constraint prevents duplicates)
  const { error: insertError } = await supabase
    .from("event_checkins")
    .insert({
      event_id: eventId,
      member_id: member.id,
      verified_by: staffMemberId,
    });

  if (insertError) {
    if (insertError.code === "23505") return { error: "Already checked in" };
    return { error: "Failed to check in" };
  }

  // Award spins
  const newBalance = (member.spin_balance ?? 0) + event.reward_spins;

  await supabase
    .from("members")
    .update({ spin_balance: newBalance })
    .eq("id", member.id);

  return { ok: true, newBalance };
}
