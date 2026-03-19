"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { uploadClubImage } from "@/lib/supabase/storage";
import { hashPassword, createOwnerToken, setOwnerCookie } from "@/lib/auth";
import { generateSlug } from "@/lib/utils";
import { extractPlaceId } from "@/lib/google-maps";
import { redirect } from "next/navigation";

export async function createOrgAndClub(formData: FormData) {
  const clubName = formData.get("clubName") as string;
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const password = formData.get("password") as string;
  const timezone = (formData.get("timezone") as string) || "UTC";
  const currency = (formData.get("currency") as string) || "EUR";

  if (!clubName) {
    return { error: "Club name is required" };
  }
  if (!email) {
    return { error: "Email is required" };
  }
  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters" };
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
  const googleMapsUrl = (formData.get("googleMapsUrl") as string)?.trim() || null;
  const placeId = await extractPlaceId(googleMapsUrl ?? "");
  await supabase.from("club_branding").insert({
    club_id: club.id,
    social_google_maps: googleMapsUrl,
    google_place_id: placeId,
  });

  // Create club owner account
  const { data: owner, error: ownerError } = await supabase
    .from("club_owners")
    .insert({
      email,
      password_hash: hashPassword(password),
    })
    .select()
    .single();

  if (ownerError) {
    if (ownerError.code === "23505") {
      return { error: "An account with this email already exists" };
    }
    return { error: "Failed to create owner account" };
  }

  // Link owner to club
  await supabase.from("club_owner_clubs").insert({
    owner_id: owner.id,
    club_id: club.id,
  });

  // Auto-login owner so they can access admin panel after onboarding
  const token = await createOwnerToken(owner.id, club.id);
  await setOwnerCookie(token);

  redirect(`/onboarding/branding?clubId=${club.id}`);
}

export async function updateBranding(formData: FormData) {
  const clubId = formData.get("clubId") as string;
  const primaryColor = formData.get("primaryColor") as string;
  const secondaryColor = formData.get("secondaryColor") as string;
  const heroContent = formData.get("heroContent") as string;
  const logoFile = formData.get("logo") as File | null;
  const coverFile = formData.get("cover") as File | null;

  if (!clubId) return { error: "Club ID is required" };

  // Upload images if provided
  let logoUrl: string | undefined;
  let coverUrl: string | undefined;

  if (logoFile && logoFile.size > 0) {
    const result = await uploadClubImage(clubId, logoFile);
    if ("error" in result) return { error: result.error };
    logoUrl = result.url;
  }

  if (coverFile && coverFile.size > 0) {
    const result = await uploadClubImage(clubId, coverFile);
    if ("error" in result) return { error: result.error };
    coverUrl = result.url;
  }

  const supabase = createAdminClient();

  const updateData: Record<string, string> = {
    primary_color: primaryColor || "#16a34a",
    secondary_color: secondaryColor || "#052e16",
    hero_content: heroContent,
  };
  if (logoUrl) updateData.logo_url = logoUrl;
  if (coverUrl) updateData.cover_url = coverUrl;

  const { error } = await supabase
    .from("club_branding")
    .update(updateData)
    .eq("club_id", clubId);

  if (error) {
    return { error: `Failed to update branding: ${error.message}` };
  }

  redirect(`/onboarding/complete?clubId=${clubId}`);
}

export async function seedClubDefaults(clubId: string) {
  const supabase = createAdminClient();

  // Upsert is idempotent — safe on page refresh and concurrent requests.
  // Unique constraints: wheel_configs(club_id, display_order), membership_periods(club_id, name)

  await supabase.from("wheel_configs").upsert([
    { club_id: clubId, label: "No prize", reward_type: "nothing", reward_value: 0, probability: 0.20, color: "#4b5563", label_color: "#d1d5db", display_order: 0 },
    { club_id: clubId, label: "Mascotte", reward_type: "prize", reward_value: 1, probability: 0.15, color: "#c4a265", label_color: "#1c1008", display_order: 1 },
    { club_id: clubId, label: "Free Drink", reward_type: "prize", reward_value: 1, probability: 0.15, color: "#0284c7", label_color: "#e0f2fe", display_order: 2 },
    { club_id: clubId, label: "Snack", reward_type: "prize", reward_value: 1, probability: 0.10, color: "#16a34a", label_color: "#f0fdf4", display_order: 3 },
    { club_id: clubId, label: "Pure Pre-roll", reward_type: "prize", reward_value: 1, probability: 0.10, color: "#e11d48", label_color: "#fff1f2", display_order: 4 },
    { club_id: clubId, label: "Blue Pre-roll", reward_type: "prize", reward_value: 1, probability: 0.10, color: "#4f46e5", label_color: "#eef2ff", display_order: 5 },
    { club_id: clubId, label: "Yellow Pre-roll", reward_type: "prize", reward_value: 1, probability: 0.10, color: "#ca8a04", label_color: "#fefce8", display_order: 6 },
    { club_id: clubId, label: "Orange Pre-roll", reward_type: "prize", reward_value: 1, probability: 0.10, color: "#ea580c", label_color: "#fff7ed", display_order: 7 },
  ], { onConflict: "club_id,display_order", ignoreDuplicates: true });

  await supabase.from("membership_periods").upsert({
    club_id: clubId,
    name: "12 Months",
    duration_months: 12,
    display_order: 0,
    active: true,
  }, { onConflict: "club_id,name", ignoreDuplicates: true });

}
