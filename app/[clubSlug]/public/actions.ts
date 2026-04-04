"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { notifyPlatform, notifyStaff } from "@/lib/staff-notify";
import { sendPreregistrationConfirmation } from "@/lib/email";
import { logActivity } from "@/lib/activity-log";

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

export async function submitPreregistration(
  clubId: string,
  clubName: string,
  email: string,
  visitDate: string,
  numVisitors: number,
  ageConfirmed: boolean,
  disclaimerAccepted: boolean,
): Promise<{ error: string } | { ok: true }> {
  if (!email.trim() || !email.includes("@")) return { error: "Valid email is required" };
  if (!visitDate) return { error: "Visit date is required" };
  if (numVisitors < 1 || numVisitors > 20) return { error: "Invalid number of visitors" };
  if (!ageConfirmed) return { error: "Age confirmation is required" };
  if (!disclaimerAccepted) return { error: "Disclaimer must be accepted" };

  const supabase = createAdminClient();

  const { error } = await supabase.from("preregistrations").insert({
    club_id: clubId,
    email: email.trim().toLowerCase(),
    visit_date: visitDate,
    num_visitors: numVisitors,
    age_confirmed: ageConfirmed,
    disclaimer_accepted: disclaimerAccepted,
  });

  if (error) return { error: "Failed to submit pre-registration" };

  // Send confirmation email (fire-and-forget)
  try {
    await sendPreregistrationConfirmation(email.trim().toLowerCase(), clubName, visitDate, numVisitors);
  } catch {
    // Don't block on email failure
  }

  // Notify staff via Telegram
  await notifyStaff(
    clubId,
    `📋 New pre-registration for <b>${clubName}</b>\nDate: ${visitDate}\nEmail: ${email.trim()}\nVisitors: ${numVisitors}`,
  );

  // Log activity
  await logActivity({
    clubId,
    staffMemberId: null,
    action: "preregistration_submitted",
    targetMemberCode: null,
    details: `${email.trim()} — ${visitDate} (${numVisitors} visitors)`,
  });

  return { ok: true };
}
