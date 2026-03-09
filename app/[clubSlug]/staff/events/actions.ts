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

export async function getEventRsvps(
  eventId: string,
  clubId: string,
): Promise<
  | { error: string }
  | {
      ok: true;
      rsvps: {
        member_id: string;
        member_code: string;
        full_name: string;
        rsvp_date: string;
        checked_in: boolean;
      }[];
    }
> {
  const supabase = createAdminClient();

  // Verify event belongs to club
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("club_id", clubId)
    .single();

  if (!event) return { error: "Event not found" };

  // Get RSVPs with member info
  const { data: rsvps, error } = await supabase
    .from("event_rsvps")
    .select("member_id, created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) return { error: "Failed to load RSVPs" };

  // Get checkins for this event
  const { data: checkins } = await supabase
    .from("event_checkins")
    .select("member_id")
    .eq("event_id", eventId);

  const checkinSet = new Set((checkins ?? []).map((c) => c.member_id));

  // Fetch member details
  const memberIds = (rsvps ?? []).map((r) => r.member_id);
  const { data: members } = await supabase
    .from("members")
    .select("id, member_code, full_name")
    .in("id", memberIds.length > 0 ? memberIds : ["__none__"]);

  const memberMap = new Map(
    (members ?? []).map((m) => [m.id, { code: m.member_code, name: m.full_name }]),
  );

  return {
    ok: true,
    rsvps: (rsvps ?? []).map((r) => ({
      member_id: r.member_id,
      member_code: memberMap.get(r.member_id)?.code ?? "???",
      full_name: memberMap.get(r.member_id)?.name ?? "Unknown",
      rsvp_date: r.created_at,
      checked_in: checkinSet.has(r.member_id),
    })),
  };
}
