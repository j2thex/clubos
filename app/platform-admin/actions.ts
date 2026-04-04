"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { hashPassword, createOwnerToken, setOwnerCookie } from "@/lib/auth";
import { generateSlug } from "@/lib/utils";
import { revalidatePath } from "next/cache";

/** Extract place name and coordinates from a Google Maps URL */
function parseGoogleMapsUrl(url: string): { name: string | null; lat: number | null; lng: number | null } {
  let name: string | null = null;
  let lat: number | null = null;
  let lng: number | null = null;

  // Try to extract place name from /place/Name+Name/ pattern
  const placeMatch = url.match(/\/place\/([^/@]+)/);
  if (placeMatch) {
    name = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
  }

  // Try to extract coordinates from @lat,lng pattern
  const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordMatch) {
    lat = parseFloat(coordMatch[1]);
    lng = parseFloat(coordMatch[2]);
  }

  return { name, lat, lng };
}

export async function createClubFromGoogleMaps(
  mapsUrl: string,
  secret: string,
): Promise<{ error: string } | { ok: true; slug: string; name: string; email: string }> {
  if (secret !== process.env.PLATFORM_ADMIN_SECRET) {
    return { error: "Unauthorized" };
  }

  if (!mapsUrl || !mapsUrl.includes("google")) {
    return { error: "Please provide a valid Google Maps URL" };
  }

  const parsed = parseGoogleMapsUrl(mapsUrl);
  if (!parsed.name) {
    return { error: "Could not extract place name from URL. Ensure the URL contains /place/Name" };
  }

  const clubName = parsed.name;
  const slug = generateSlug(clubName);
  const emailPrefix = slug.replace(/-/g, "");
  const email = `${emailPrefix}@osocios.com`;
  const password = "q1234567";

  const supabase = createAdminClient();

  // Check slug uniqueness
  const { count: slugCount } = await supabase
    .from("clubs")
    .select("*", { count: "exact", head: true })
    .eq("slug", slug);

  if ((slugCount ?? 0) > 0) {
    return { error: `Club with slug "${slug}" already exists` };
  }

  // Check email uniqueness
  const { count: emailCount } = await supabase
    .from("club_owners")
    .select("*", { count: "exact", head: true })
    .ilike("email", email);

  if ((emailCount ?? 0) > 0) {
    return { error: `Owner email "${email}" already exists` };
  }

  // Create organization
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name: clubName, slug: `org-${slug}` })
    .select("id")
    .single();

  if (orgError || !org) return { error: "Failed to create organization" };

  // Create club
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .insert({
      organization_id: org.id,
      name: clubName,
      slug,
      latitude: parsed.lat,
      longitude: parsed.lng,
      claimed: false,
    })
    .select("id")
    .single();

  if (clubError || !club) return { error: "Failed to create club" };

  // Create branding with Google Maps link
  await supabase.from("club_branding").insert({
    club_id: club.id,
    social_google_maps: mapsUrl,
  });

  // Create owner account
  const { data: owner, error: ownerError } = await supabase
    .from("club_owners")
    .insert({
      email,
      password_hash: hashPassword(password),
    })
    .select("id")
    .single();

  if (ownerError || !owner) return { error: "Failed to create owner" };

  // Link owner to club
  await supabase.from("club_owner_clubs").insert({
    owner_id: owner.id,
    club_id: club.id,
  });

  // Seed defaults
  const { seedClubDefaults } = await import("@/app/(platform)/onboarding/actions");
  await seedClubDefaults(club.id);

  revalidatePath("/platform-admin");
  return { ok: true, slug, name: clubName, email };
}

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

export async function approveCustomOffer(
  offerId: string,
  secret: string,
): Promise<{ error: string } | { ok: true }> {
  if (secret !== process.env.PLATFORM_ADMIN_SECRET) {
    return { error: "Unauthorized" };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("offer_catalog")
    .update({ is_approved: true })
    .eq("id", offerId);

  if (error) return { error: "Failed to approve offer" };

  revalidatePath("/platform-admin");
  return { ok: true };
}

export async function approveClub(
  clubId: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("clubs")
    .update({ approved: true, active: true })
    .eq("id", clubId);

  if (error) return { error: "Failed to approve club" };

  revalidatePath("/platform-admin");
  return { ok: true };
}

export async function rejectClub(
  clubId: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("clubs")
    .update({ approved: false })
    .eq("id", clubId);

  if (error) return { error: "Failed to reject club" };

  revalidatePath("/platform-admin");
  return { ok: true };
}

export async function setupStandardContent(
  clubId: string,
  clubType: string,
  secret: string,
): Promise<{ error: string } | { ok: true; questCount: number; eventCount: number }> {
  if (secret !== process.env.PLATFORM_ADMIN_SECRET) {
    return { error: "Unauthorized" };
  }

  const { CLUB_TYPE_TEMPLATES } = await import("@/lib/club-templates");
  const template = CLUB_TYPE_TEMPLATES[clubType];
  if (!template) return { error: `Unknown club type: ${clubType}` };

  const supabase = createAdminClient();

  // Get existing quest count for display_order
  const { count: existingQuestCount } = await supabase
    .from("quests")
    .select("*", { count: "exact", head: true })
    .eq("club_id", clubId);

  let questOrder = existingQuestCount ?? 0;

  // Insert quests
  const questRows = template.quests.map((q) => ({
    club_id: clubId,
    title: q.title,
    title_es: q.title_es,
    description: q.description,
    description_es: q.description_es,
    icon: q.icon,
    reward_spins: q.reward_spins,
    quest_type: q.quest_type,
    proof_mode: q.proof_mode,
    multi_use: q.multi_use,
    is_public: q.is_public,
    active: true,
    display_order: questOrder++,
  }));

  const { error: questError } = await supabase.from("quests").insert(questRows);
  if (questError) return { error: `Failed to create quests: ${questError.message}` };

  // Get existing event count for display_order
  const { count: existingEventCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("club_id", clubId);

  let eventOrder = existingEventCount ?? 0;

  // Insert events (set date to next Saturday as default)
  const nextSaturday = new Date();
  nextSaturday.setDate(nextSaturday.getDate() + (6 - nextSaturday.getDay() + 7) % 7 || 7);
  const eventDate = nextSaturday.toISOString().split("T")[0];

  const eventRows = template.events.map((e) => ({
    club_id: clubId,
    title: e.title,
    title_es: e.title_es,
    description: e.description,
    description_es: e.description_es,
    icon: e.icon,
    date: eventDate,
    time: "20:00",
    active: true,
    is_public: true,
    display_order: eventOrder++,
  }));

  const { error: eventError } = await supabase.from("events").insert(eventRows);
  if (eventError) return { error: `Failed to create events: ${eventError.message}` };

  revalidatePath("/platform-admin");
  return { ok: true, questCount: questRows.length, eventCount: eventRows.length };
}

export async function loginAsClubAdmin(
  clubId: string,
  clubSlug: string,
  secret: string,
): Promise<{ error: string } | { ok: true; redirectUrl: string }> {
  if (secret !== process.env.PLATFORM_ADMIN_SECRET) {
    return { error: "Unauthorized" };
  }

  const supabase = createAdminClient();

  // Find the first owner linked to this club
  const { data: link } = await supabase
    .from("club_owner_clubs")
    .select("owner_id")
    .eq("club_id", clubId)
    .limit(1)
    .maybeSingle();

  if (!link) {
    return { error: "No owner found for this club" };
  }

  const token = await createOwnerToken(link.owner_id, clubId);
  await setOwnerCookie(token);

  return { ok: true, redirectUrl: `/${clubSlug}/admin` };
}
