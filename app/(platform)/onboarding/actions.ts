"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { generateSlug } from "@/lib/utils";
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

export async function seedClubDefaults(clubId: string) {
  const supabase = createAdminClient();

  // Guard against re-seeding (e.g. page refresh)
  const { count } = await supabase
    .from("wheel_configs")
    .select("*", { count: "exact", head: true })
    .eq("club_id", clubId);

  if (count && count > 0) return;

  // Seed default wheel segments (ignoreDuplicates handles race conditions)
  await supabase.from("wheel_configs").insert([
    { club_id: clubId, label: "No prize", reward_type: "nothing", reward_value: 0, probability: 0.20, color: "#4b5563", label_color: "#d1d5db", display_order: 0 },
    { club_id: clubId, label: "Mascotte", reward_type: "prize", reward_value: 1, probability: 0.15, color: "#c4a265", label_color: "#1c1008", display_order: 1 },
    { club_id: clubId, label: "Free Drink", reward_type: "prize", reward_value: 1, probability: 0.15, color: "#0284c7", label_color: "#e0f2fe", display_order: 2 },
    { club_id: clubId, label: "Snack", reward_type: "prize", reward_value: 1, probability: 0.10, color: "#16a34a", label_color: "#f0fdf4", display_order: 3 },
    { club_id: clubId, label: "Pure Pre-roll", reward_type: "prize", reward_value: 1, probability: 0.10, color: "#e11d48", label_color: "#fff1f2", display_order: 4 },
    { club_id: clubId, label: "Blue Pre-roll", reward_type: "prize", reward_value: 1, probability: 0.10, color: "#4f46e5", label_color: "#eef2ff", display_order: 5 },
    { club_id: clubId, label: "Yellow Pre-roll", reward_type: "prize", reward_value: 1, probability: 0.10, color: "#ca8a04", label_color: "#fefce8", display_order: 6 },
    { club_id: clubId, label: "Orange Pre-roll", reward_type: "prize", reward_value: 1, probability: 0.10, color: "#ea580c", label_color: "#fff7ed", display_order: 7 },
  ]);

}
