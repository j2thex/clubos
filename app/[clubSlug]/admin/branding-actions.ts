"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { uploadClubImage } from "@/lib/supabase/storage";
import { extractPlaceId } from "@/lib/google-maps";
import { revalidatePath } from "next/cache";

export async function updateClubBranding(formData: FormData) {
  const clubId = formData.get("clubId") as string;
  const clubSlug = formData.get("clubSlug") as string;
  const primaryColor = (formData.get("primaryColor") as string) || "#16a34a";
  const secondaryColor = (formData.get("secondaryColor") as string) || "#052e16";
  const heroContent = (formData.get("heroContent") as string) || "";
  const socialInstagram = (formData.get("socialInstagram") as string)?.trim() || null;
  const socialWhatsapp = (formData.get("socialWhatsapp") as string)?.trim() || null;
  const socialTelegram = (formData.get("socialTelegram") as string)?.trim() || null;
  const socialGoogleMaps = (formData.get("socialGoogleMaps") as string)?.trim() || null;
  const socialWebsite = (formData.get("socialWebsite") as string)?.trim() || null;
  const logo = formData.get("logo") as File | null;
  const cover = formData.get("cover") as File | null;

  if (!clubId || !clubSlug) {
    return { error: "Missing club information" };
  }

  const placeId = await extractPlaceId(socialGoogleMaps ?? "");

  const supabase = createAdminClient();
  const updates: Record<string, string | null> = {
    primary_color: primaryColor,
    secondary_color: secondaryColor,
    hero_content: heroContent,
    social_instagram: socialInstagram,
    social_whatsapp: socialWhatsapp,
    social_telegram: socialTelegram,
    social_google_maps: socialGoogleMaps,
    social_website: socialWebsite,
    google_place_id: placeId,
  };

  if (logo && logo.size > 0) {
    const result = await uploadClubImage(clubId, logo);
    if ("error" in result) return { error: result.error };
    updates.logo_url = result.url;
  }

  if (cover && cover.size > 0) {
    const result = await uploadClubImage(clubId, cover);
    if ("error" in result) return { error: result.error };
    updates.cover_url = result.url;
  }

  const { error } = await supabase
    .from("club_branding")
    .update(updates)
    .eq("club_id", clubId);

  if (error) {
    return { error: "Failed to update branding" };
  }

  revalidatePath(`/${clubSlug}`, "layout");
  return { ok: true };
}
