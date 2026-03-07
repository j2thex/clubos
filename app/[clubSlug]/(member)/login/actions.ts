"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createMemberToken, setMemberCookie } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginMember(clubSlug: string, formData: FormData) {
  const memberCode = (formData.get("memberCode") as string).toUpperCase().trim();

  if (!memberCode) {
    return { error: "Member code is required" };
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
    .select("id, status")
    .eq("club_id", club.id)
    .eq("member_code", memberCode)
    .single();

  if (!member) return { error: "Invalid member code" };
  if (member.status !== "active") return { error: "Account is inactive" };

  const token = await createMemberToken(member.id, club.id);
  await setMemberCookie(token);

  redirect(`/${clubSlug}`);
}
