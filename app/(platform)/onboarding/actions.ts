"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { generateSlug } from "@/lib/utils";
import { redirect } from "next/navigation";

export async function createOrgAndClub(formData: FormData) {
  const orgName = formData.get("orgName") as string;
  const clubName = formData.get("clubName") as string;
  const timezone = (formData.get("timezone") as string) || "UTC";
  const currency = (formData.get("currency") as string) || "USD";

  if (!orgName || !clubName) {
    return { error: "Organization and club names are required" };
  }

  const supabase = createAdminClient();

  // Create organization
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name: orgName, slug: generateSlug(orgName) })
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
