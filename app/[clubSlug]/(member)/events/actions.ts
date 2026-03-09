"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function rsvpEvent(
  eventId: string,
  memberId: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("event_rsvps")
    .insert({ event_id: eventId, member_id: memberId });

  if (error) {
    if (error.code === "23505") return { error: "Already signed up" };
    return { error: "Failed to sign up" };
  }

  return { ok: true };
}

export async function cancelRsvp(
  eventId: string,
  memberId: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("event_rsvps")
    .delete()
    .eq("event_id", eventId)
    .eq("member_id", memberId);

  if (error) return { error: "Failed to cancel RSVP" };

  return { ok: true };
}
