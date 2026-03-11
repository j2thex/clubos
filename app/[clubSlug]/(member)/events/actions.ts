"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function rsvpEvent(
  eventId: string,
  memberId: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  // Verify event exists and is not in the past
  const today = new Date().toISOString().split("T")[0];
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .gte("date", today)
    .single();

  if (!event) return { error: "Event not found or already passed" };

  const { error } = await supabase
    .from("event_rsvps")
    .insert({ event_id: eventId, member_id: memberId });

  if (error) {
    if (error.code === "23505") return { error: "Already signed up" };
    return { error: "Failed to sign up" };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function cancelRsvp(
  eventId: string,
  memberId: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  // Prevent cancellation if already checked in
  const { data: checkin } = await supabase
    .from("event_checkins")
    .select("id")
    .eq("event_id", eventId)
    .eq("member_id", memberId)
    .maybeSingle();

  if (checkin) return { error: "Cannot cancel — already checked in" };

  const { error } = await supabase
    .from("event_rsvps")
    .delete()
    .eq("event_id", eventId)
    .eq("member_id", memberId);

  if (error) return { error: "Failed to cancel RSVP" };

  revalidatePath("/");
  return { ok: true };
}
