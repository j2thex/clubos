"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function createUnclaimedClub(
  formData: FormData,
  secret: string,
): Promise<{ error: string } | { ok: true; slug: string }> {
  if (secret !== process.env.PLATFORM_ADMIN_SECRET) {
    return { error: "Unauthorized" };
  }

  const name = (formData.get("name") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  const primaryColor = (formData.get("primaryColor") as string) || "#16a34a";
  const secondaryColor = (formData.get("secondaryColor") as string) || "#052e16";
  const logo = formData.get("logo") as File | null;
  const cover = formData.get("cover") as File | null;

  if (!name) return { error: "Club name is required" };
  if (!slug || slug.length < 2) return { error: "Slug is required (min 2 chars)" };

  const supabase = createAdminClient();

  // Check slug uniqueness
  const { data: existing } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) return { error: "Slug already taken" };

  // Create organization
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name, slug: `org-${slug}` })
    .select("id")
    .single();

  if (orgError || !org) return { error: "Failed to create organization" };

  // Create club (unclaimed, invite-only)
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .insert({
      organization_id: org.id,
      name,
      slug,
      claimed: false,
      invite_only: true,
    })
    .select("id")
    .single();

  if (clubError || !club) return { error: "Failed to create club" };

  // Create branding
  let logoUrl: string | null = null;
  let coverUrl: string | null = null;

  if (logo && logo.size > 0) {
    const { uploadClubImage } = await import("@/lib/supabase/storage");
    const result = await uploadClubImage(club.id, logo);
    if (!("error" in result)) logoUrl = result.url;
  }

  if (cover && cover.size > 0) {
    const { uploadClubImage } = await import("@/lib/supabase/storage");
    const result = await uploadClubImage(club.id, cover);
    if (!("error" in result)) coverUrl = result.url;
  }

  await supabase.from("club_branding").insert({
    club_id: club.id,
    primary_color: primaryColor,
    secondary_color: secondaryColor,
    logo_url: logoUrl,
    cover_url: coverUrl,
  });

  revalidatePath("/");
  return { ok: true, slug };
}
