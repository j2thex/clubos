"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPin, createMemberToken, setMemberCookie } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginMember(clubSlug: string, formData: FormData) {
  const memberCode = (formData.get("memberCode") as string).toUpperCase().trim();
  const pin = formData.get("pin") as string;

  if (!memberCode || !pin) {
    return { error: "Member code and PIN are required" };
  }

  const supabase = createAdminClient();

  // Get club
  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) return { error: "Club not found" };

  // Get member
  const { data: member } = await supabase
    .from("members")
    .select("id, pin_hash, status")
    .eq("club_id", club.id)
    .eq("member_code", memberCode)
    .single();

  if (!member) return { error: "Invalid member code or PIN" };
  if (member.status !== "active") return { error: "Account is inactive" };
  if (!verifyPin(pin, member.pin_hash)) return { error: "Invalid member code or PIN" };

  // Create JWT and set cookie
  const token = await createMemberToken(member.id, club.id);
  await setMemberCookie(token);

  redirect(`/${clubSlug}`);
}
