"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyPlatform, notifyStaff } from "@/lib/staff-notify";
import { sendPreregistrationConfirmation, sendAutoRegistrationEmail } from "@/lib/email";
import { logActivity } from "@/lib/activity-log";
import { generateMemberCode } from "@/lib/utils";

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
  if (numVisitors < 1 || numVisitors > 4) return { error: "Invalid number of visitors" };
  if (!ageConfirmed) return { error: "Age confirmation is required" };
  if (!disclaimerAccepted) return { error: "Disclaimer must be accepted" };

  const supabase = createAdminClient();

  const normalizedEmail = email.trim().toLowerCase();

  const { data: prereg, error } = await supabase.from("preregistrations").insert({
    club_id: clubId,
    email: normalizedEmail,
    visit_date: visitDate,
    num_visitors: numVisitors,
    age_confirmed: ageConfirmed,
    disclaimer_accepted: disclaimerAccepted,
  }).select("id").single();

  if (error || !prereg) return { error: "Failed to submit pre-registration" };

  // Fetch club info including auto_registration flag + slug (for revalidation)
  const { data: clubInfo } = await supabase
    .from("clubs")
    .select("slug, address, city, auto_registration")
    .eq("id", clubId)
    .single();
  const clubAddress = [clubInfo?.address, clubInfo?.city].filter(Boolean).join(", ") || null;
  const autoReg = clubInfo?.auto_registration === true;

  let memberCode: string | null = null;

  if (autoReg) {
    // Auto-create member with inactive status
    let created = false;
    for (let attempt = 0; attempt < 3 && !created; attempt++) {
      const code = generateMemberCode();
      const { data: member, error: memberError } = await supabase
        .from("members")
        .insert({
          club_id: clubId,
          member_code: code,
          email: normalizedEmail,
          status: "inactive",
          spin_balance: 0,
        })
        .select("id")
        .single();

      if (memberError?.code === "23505") continue; // Code collision, retry
      if (memberError || !member) break;

      // Link member to preregistration
      await supabase
        .from("preregistrations")
        .update({ member_id: member.id })
        .eq("id", prereg.id);

      memberCode = code;
      created = true;
    }
  }

  // Send appropriate email
  try {
    if (autoReg && memberCode) {
      await sendAutoRegistrationEmail(normalizedEmail, clubName, memberCode, visitDate, numVisitors, clubAddress);
    } else {
      await sendPreregistrationConfirmation(normalizedEmail, clubName, visitDate, numVisitors, clubAddress);
    }
  } catch {
    // Don't block on email failure
  }

  // Notify staff via Telegram
  const autoRegNote = autoReg && memberCode ? `\n🆔 Auto-registered as <b>${memberCode}</b>` : "";
  await notifyStaff(
    clubId,
    `📋 New pre-registration for <b>${clubName}</b>\nDate: ${visitDate}\nEmail: ${normalizedEmail}\nVisitors: ${numVisitors}${autoRegNote}`,
  );

  // Log activity
  await logActivity({
    clubId,
    staffMemberId: null,
    action: "preregistration_submitted",
    targetMemberCode: memberCode,
    details: `${normalizedEmail} — ${visitDate} (${numVisitors} visitors)${autoReg ? " [auto-registered]" : ""}`,
  });

  if (clubInfo?.slug) {
    revalidatePath(`/${clubInfo.slug}/staff`, "layout");
  }

  return { ok: true };
}
