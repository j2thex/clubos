"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity-log";
import { requireActiveStaff } from "@/lib/auth";

export async function fulfillAmenityOrder(
  orderId: string,
  staffMemberId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  try { await requireActiveStaff(); } catch { return { error: "Account is inactive" }; }
  const supabase = createAdminClient();

  // Get order details for logging before updating
  const { data: order } = await supabase
    .from("amenity_orders")
    .select("member_id, club_amenity_id")
    .eq("id", orderId)
    .single();

  const { error } = await supabase
    .from("amenity_orders")
    .update({
      status: "fulfilled",
      fulfilled_by: staffMemberId,
      fulfilled_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "pending");

  if (error) return { error: "Failed to fulfill order" };

  if (order) {
    const [{ data: memberForLog }, { data: amenity }] = await Promise.all([
      supabase.from("members").select("member_code, club_id").eq("id", order.member_id).single(),
      supabase
        .from("club_amenities")
        .select("amenity_catalog(name)")
        .eq("id", order.club_amenity_id)
        .single(),
    ]);

    const catalogInfo = amenity
      ? Array.isArray(amenity.amenity_catalog) ? amenity.amenity_catalog[0] : amenity.amenity_catalog
      : null;

    await logActivity({
      clubId: memberForLog?.club_id ?? "",
      staffMemberId,
      action: "amenity_order_fulfilled",
      targetMemberCode: memberForLog?.member_code,
      details: catalogInfo?.name,
    });
  }

  revalidatePath(`/${clubSlug}/staff/amenities`);
  return { ok: true };
}

export async function addWalkinAmenityOrder(
  memberCode: string,
  clubAmenityId: string,
  clubId: string,
  staffMemberId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  try { await requireActiveStaff(); } catch { return { error: "Account is inactive" }; }
  const code = memberCode.trim().toUpperCase();
  if (!code || code.length < 3 || code.length > 6) return { error: "Invalid member code" };
  if (!/^[A-Z0-9]+$/.test(code)) return { error: "Invalid member code" };

  const supabase = createAdminClient();

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("club_id", clubId)
    .eq("member_code", code)
    .eq("status", "active")
    .single();

  if (!member) return { error: "Member not found" };

  const { error } = await supabase.from("amenity_orders").insert({
    club_amenity_id: clubAmenityId,
    member_id: member.id,
    status: "fulfilled",
    fulfilled_by: staffMemberId,
    fulfilled_at: new Date().toISOString(),
  });

  if (error) return { error: "Failed to add order" };

  const { data: amenity } = await supabase
    .from("club_amenities")
    .select("amenity_catalog(name)")
    .eq("id", clubAmenityId)
    .single();

  const catalogInfo = amenity
    ? Array.isArray(amenity.amenity_catalog) ? amenity.amenity_catalog[0] : amenity.amenity_catalog
    : null;

  await logActivity({
    clubId,
    staffMemberId,
    action: "amenity_walkin_order",
    targetMemberCode: code,
    details: catalogInfo?.name,
  });

  revalidatePath(`/${clubSlug}/staff/amenities`);
  return { ok: true };
}
