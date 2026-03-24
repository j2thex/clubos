"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { geocodeAddress } from "@/app/discover/lib/geocode";

export async function updateClubLocation(formData: FormData): Promise<{ error: string } | { ok: true }> {
  const clubId = formData.get("clubId") as string;
  const clubSlug = formData.get("clubSlug") as string;
  const address = (formData.get("address") as string)?.trim() || null;
  const city = (formData.get("city") as string)?.trim() || null;
  const country = (formData.get("country") as string)?.trim() || null;
  const latStr = formData.get("latitude") as string;
  const lngStr = formData.get("longitude") as string;
  const latitude = latStr ? parseFloat(latStr) : null;
  const longitude = lngStr ? parseFloat(lngStr) : null;

  if (!clubId || !clubSlug) return { error: "Missing club information" };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("clubs")
    .update({ address, city, country, latitude, longitude })
    .eq("id", clubId);

  if (error) return { error: "Failed to save location" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}

export async function findCoordinates(
  address: string
): Promise<
  { lat: number; lng: number; display_name: string } | { error: string }
> {
  if (!address.trim()) return { error: "Please enter an address" };

  const result = await geocodeAddress(address);
  if (!result) return { error: "Address not found. Try being more specific." };

  return result;
}
