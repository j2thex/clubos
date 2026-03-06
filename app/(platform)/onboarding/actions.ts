"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { hashPin } from "@/lib/auth";
import { generateSlug, generateMemberCode, generatePin } from "@/lib/utils";
import { redirect } from "next/navigation";

export async function createOrgAndClub(formData: FormData) {
  const clubName = formData.get("clubName") as string;
  const timezone = (formData.get("timezone") as string) || "UTC";
  const currency = (formData.get("currency") as string) || "EUR";

  if (!clubName) {
    return { error: "Club name is required" };
  }

  const supabase = createAdminClient();

  // Create organization (auto-named after club)
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name: clubName, slug: generateSlug(clubName) })
    .select()
    .single();

  if (orgError) {
    return { error: `Failed to create organization: ${orgError.message}` };
  }

  // Create club
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .insert({
      organization_id: org.id,
      name: clubName,
      slug: generateSlug(clubName),
      timezone,
      currency,
    })
    .select()
    .single();

  if (clubError) {
    return { error: `Failed to create club: ${clubError.message}` };
  }

  // Create default branding
  await supabase.from("club_branding").insert({ club_id: club.id });

  redirect(`/onboarding/branding?clubId=${club.id}`);
}

export async function updateBranding(formData: FormData) {
  const clubId = formData.get("clubId") as string;
  const primaryColor = formData.get("primaryColor") as string;
  const secondaryColor = formData.get("secondaryColor") as string;
  const heroContent = formData.get("heroContent") as string;

  if (!clubId) return { error: "Club ID is required" };

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("club_branding")
    .update({
      primary_color: primaryColor || "#16a34a",
      secondary_color: secondaryColor || "#052e16",
      hero_content: heroContent,
    })
    .eq("club_id", clubId);

  if (error) {
    return { error: `Failed to update branding: ${error.message}` };
  }

  redirect(`/onboarding/complete?clubId=${clubId}`);
}

export async function seedClubData(clubId: string) {
  const supabase = createAdminClient();

  // Seed default wheel segments — all shades of green
  const segments = [
    { club_id: clubId, label: "Drink", reward_type: "prize", reward_value: 1, probability: 0.2, color: "#22c55e" },
    { club_id: clubId, label: "Snack", reward_type: "prize", reward_value: 1, probability: 0.2, color: "#15803d" },
    { club_id: clubId, label: "Paper", reward_type: "prize", reward_value: 1, probability: 0.2, color: "#4ade80" },
    { club_id: clubId, label: "Pre-Roll", reward_type: "prize", reward_value: 1, probability: 0.15, color: "#059669" },
    { club_id: clubId, label: "No Win", reward_type: "nothing", reward_value: 0, probability: 0.25, color: "#064e3b" },
  ];

  await supabase.from("wheel_configs").insert(segments);

  // Create test member
  const memberCode = generateMemberCode();
  const pin = generatePin();

  const { data: member } = await supabase
    .from("members")
    .insert({
      club_id: clubId,
      member_code: memberCode,
      pin_hash: hashPin(pin),
      full_name: "Test Member",
      spin_balance: 10,
    })
    .select()
    .single();

  return { memberCode, pin, memberId: member?.id };
}
