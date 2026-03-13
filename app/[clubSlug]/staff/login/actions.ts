"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPin, createStaffToken, setStaffCookie } from "@/lib/auth";
import { redirect } from "next/navigation";
import { t, type Locale } from "@/lib/i18n";

export async function loginStaff(clubSlug: string, locale: Locale, formData: FormData) {
  const staffCode = (formData.get("staffCode") as string).toUpperCase().trim();
  const pin = formData.get("pin") as string;

  if (!staffCode || !pin) {
    return { error: "Staff code and PIN are required" };
  }

  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) return { error: "Club not found" };

  const { data: member } = await supabase
    .from("members")
    .select("id, pin_hash, status, is_staff, valid_till")
    .eq("club_id", club.id)
    .eq("member_code", staffCode)
    .single();

  if (!member) return { error: "Invalid staff code or PIN" };
  if (!member.is_staff) return { error: "Invalid staff code or PIN" };
  if (member.status !== "active") return { error: "Account is inactive" };

  if (member.valid_till) {
    const expiry = new Date(member.valid_till + "T00:00:00");
    if (expiry < new Date()) {
      const formatted = expiry.toLocaleDateString(locale === "es" ? "es-ES" : "en-US", { month: "long", day: "numeric", year: "numeric" });
      return { error: t(locale, "login.membershipExpired", { date: formatted }) };
    }
  }
  if (!member.pin_hash || !verifyPin(pin, member.pin_hash)) {
    return { error: "Invalid staff code or PIN" };
  }

  const token = await createStaffToken(member.id, club.id);
  await setStaffCookie(token);

  redirect(`/${clubSlug}/staff`);
}
