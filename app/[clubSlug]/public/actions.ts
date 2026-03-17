"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { notifyPlatform } from "@/lib/staff-notify";

export async function requestInvite(
  clubId: string,
  clubName: string,
  name: string,
  contact: string,
  message?: string,
): Promise<{ error: string } | { ok: true }> {
  if (!name.trim()) return { error: "Name is required" };
  if (!contact.trim()) return { error: "Contact info is required" };

  const supabase = createAdminClient();

  const { error } = await supabase.from("invite_requests").insert({
    club_id: clubId,
    name: name.trim(),
    contact: contact.trim(),
    message: message?.trim() || null,
    consent_given_at: new Date().toISOString(),
  });

  if (error) return { error: "Failed to submit request" };

  await notifyPlatform(
    `🔑 Invite request for <b>${clubName}</b>\nName: ${name.trim()}\nContact: ${contact.trim()}${message?.trim() ? `\nMessage: ${message.trim()}` : ""}`,
  );

  return { ok: true };
}
