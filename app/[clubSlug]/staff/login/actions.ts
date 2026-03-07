"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPin, createStaffToken, setStaffCookie } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginStaff(clubSlug: string, formData: FormData) {
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
    .select("id, pin_hash, status, is_staff")
    .eq("club_id", club.id)
    .eq("member_code", staffCode)
    .single();

  if (!member) return { error: "Invalid staff code or PIN" };
  if (!member.is_staff) return { error: "Invalid staff code or PIN" };
  if (member.status !== "active") return { error: "Account is inactive" };
  if (!member.pin_hash || !verifyPin(pin, member.pin_hash)) {
    return { error: "Invalid staff code or PIN" };
  }

  const token = await createStaffToken(member.id, club.id);
  await setStaffCookie(token);

  redirect(`/${clubSlug}/staff`);
}
