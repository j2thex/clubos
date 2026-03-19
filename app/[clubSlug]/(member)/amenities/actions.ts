"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyStaff } from "@/lib/staff-notify";

export async function requestAmenity(
  clubAmenityId: string,
  memberId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  // Check if already has pending order
  const { data: existing } = await supabase
    .from("amenity_orders")
    .select("id")
    .eq("club_amenity_id", clubAmenityId)
    .eq("member_id", memberId)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) return { error: "Already requested" };

  const { error } = await supabase.from("amenity_orders").insert({
    club_amenity_id: clubAmenityId,
    member_id: memberId,
  });

  if (error) return { error: "Failed to submit request" };

  // Get amenity name and member code for notification
  const { data: info } = await supabase
    .from("club_amenities")
    .select("amenity_catalog(name), clubs(id, name)")
    .eq("id", clubAmenityId)
    .single();

  const { data: member } = await supabase
    .from("members")
    .select("member_code, club_id")
    .eq("id", memberId)
    .single();

  if (member && info) {
    const catalogInfo = Array.isArray(info.amenity_catalog) ? info.amenity_catalog[0] : info.amenity_catalog;
    await notifyStaff(
      member.club_id,
      `\u{1F6CE} Amenity request\n<b>${catalogInfo?.name ?? "Unknown"}</b>\nMember: ${member.member_code}`,
    );
  }

  revalidatePath(`/${clubSlug}/amenities`);
  return { ok: true };
}

export async function cancelAmenityRequest(
  orderId: string,
  memberId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("amenity_orders")
    .delete()
    .eq("id", orderId)
    .eq("member_id", memberId)
    .eq("status", "pending");

  if (error) return { error: "Failed to cancel request" };

  revalidatePath(`/${clubSlug}/amenities`);
  return { ok: true };
}
