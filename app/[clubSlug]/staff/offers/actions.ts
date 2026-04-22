"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity-log";
import { requireOpsAccess } from "@/lib/auth";

export async function fulfillOfferOrder(
  orderId: string,
  staffMemberId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  // Resolve the order's club via the club_offer for authorization,
  // then fetch details for logging below.
  const { data: orderForAuth } = await supabase
    .from("offer_orders")
    .select("club_offers!inner(club_id)")
    .eq("id", orderId)
    .single();
  const authClubId = orderForAuth
    ? (Array.isArray(orderForAuth.club_offers)
        ? orderForAuth.club_offers[0]?.club_id
        : (orderForAuth.club_offers as { club_id: string } | null)?.club_id)
    : null;
  if (!authClubId) return { error: "Order not found" };
  try { await requireOpsAccess(authClubId, "qebo"); } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  // Get order details for logging before updating
  const { data: order } = await supabase
    .from("offer_orders")
    .select("member_id, club_offer_id")
    .eq("id", orderId)
    .single();

  const { error } = await supabase
    .from("offer_orders")
    .update({
      status: "fulfilled",
      fulfilled_by: staffMemberId,
      fulfilled_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "pending");

  if (error) return { error: "Failed to fulfill order" };

  if (order) {
    const [{ data: memberForLog }, { data: offer }] = await Promise.all([
      supabase.from("members").select("member_code, club_id").eq("id", order.member_id).single(),
      supabase
        .from("club_offers")
        .select("offer_catalog(name)")
        .eq("id", order.club_offer_id)
        .single(),
    ]);

    const catalogInfo = offer
      ? Array.isArray(offer.offer_catalog) ? offer.offer_catalog[0] : offer.offer_catalog
      : null;

    await logActivity({
      clubId: memberForLog?.club_id ?? "",
      staffMemberId,
      action: "offer_order_fulfilled",
      targetMemberCode: memberForLog?.member_code,
      details: catalogInfo?.name,
    });
  }

  revalidatePath(`/${clubSlug}/staff/offers`);
  revalidatePath(`/${clubSlug}/staff`, "layout");
  return { ok: true };
}

export async function addWalkinOfferOrder(
  memberCode: string,
  clubOfferId: string,
  clubId: string,
  staffMemberId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  try { await requireOpsAccess(clubId, "qebo"); } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }
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

  const { error } = await supabase.from("offer_orders").insert({
    club_offer_id: clubOfferId,
    member_id: member.id,
    status: "fulfilled",
    fulfilled_by: staffMemberId,
    fulfilled_at: new Date().toISOString(),
  });

  if (error) return { error: "Failed to add order" };

  const { data: offer } = await supabase
    .from("club_offers")
    .select("offer_catalog(name)")
    .eq("id", clubOfferId)
    .single();

  const catalogInfo = offer
    ? Array.isArray(offer.offer_catalog) ? offer.offer_catalog[0] : offer.offer_catalog
    : null;

  await logActivity({
    clubId,
    staffMemberId,
    action: "offer_walkin_order",
    targetMemberCode: code,
    details: catalogInfo?.name,
  });

  revalidatePath(`/${clubSlug}/staff/offers`);
  revalidatePath(`/${clubSlug}/staff`, "layout");
  return { ok: true };
}
