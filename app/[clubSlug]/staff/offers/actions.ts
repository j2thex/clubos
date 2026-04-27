"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity-log";
import { requireOpsAccess } from "@/lib/auth";

// record_sale / record_offer_fulfillment error codes mapped to user copy.
// Kept in sync with app/[clubSlug]/staff/(console)/operations/sell/actions.ts.
const RPC_ERRORS: Record<string, string> = {
  invalid_quantity: "Quantity must be greater than zero",
  invalid_weight_source: "Invalid weight source",
  invalid_lines: "Invalid cart contents",
  invalid_paid_with: "Invalid payment method",
  empty_cart: "Cart is empty",
  product_not_found: "Product not found",
  product_inactive: "Product is archived or inactive",
  insufficient_stock: "Not enough stock on hand",
  insufficient_saldo: "Insufficient saldo",
  discount_too_large: "Discount is larger than the subtotal",
  member_not_found: "Member not found",
  staff_wrong_club: "Unauthorized",
  club_not_found: "Club not found",
  wrong_currency_mode: "Payment method does not match this club's currency mode",
  offer_order_not_found: "Order not found",
  offer_order_not_pending: "Order is no longer pending",
  offer_not_linked_to_product: "Offer is not linked to a product",
};

function mapRpcError(message: string, fallback: string): string {
  if (message.includes("over_consumption_limit")) {
    // Parse "over_consumption_limit:<used>:<limit>:<attempted>"
    const parts = message.split(":");
    if (parts.length >= 4) {
      const used = Number(parts[1]);
      const limit = Number(parts[2]);
      const attempted = Number(parts[3]);
      const remaining = Math.max(0, limit - used);
      return `Monthly limit reached: ${used}g used of ${limit}g this month. Only ${remaining}g left, this order is ${attempted}g.`;
    }
    return "Monthly consumption limit exceeded";
  }
  return RPC_ERRORS[message] ?? fallback;
}

export async function fulfillOfferOrder(
  orderId: string,
  staffMemberId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  // Resolve the order's club + linked-product status for auth + routing.
  const { data: orderForAuth } = await supabase
    .from("offer_orders")
    .select("member_id, club_offer_id, club_offers!inner(club_id, product_id)")
    .eq("id", orderId)
    .single();
  if (!orderForAuth) return { error: "Order not found" };

  const co = Array.isArray(orderForAuth.club_offers)
    ? orderForAuth.club_offers[0]
    : (orderForAuth.club_offers as { club_id: string; product_id: string | null } | null);
  if (!co) return { error: "Order not found" };
  const authClubId = co.club_id;
  const productId = co.product_id;

  // Linked-product fulfillments create a sale → require 'sell' on top of 'qebo'.
  try {
    await requireOpsAccess(authClubId, "qebo");
    if (productId) await requireOpsAccess(authClubId, "sell");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  if (productId) {
    // Route through record_offer_fulfillment for stock/saldo/cap enforcement.
    const { error: rpcError } = await supabase.rpc("record_offer_fulfillment", {
      p_offer_order_id: orderId,
      p_staff_id: staffMemberId,
    });
    if (rpcError) {
      return { error: mapRpcError(rpcError.message, "Failed to fulfill order") };
    }
  } else {
    // Legacy status-flip path for unlinked offers.
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
  }

  // Activity log (the linked-product path also logs via record_sale's
  // product_sale entry; this one is specific to the offer fulfillment).
  const [{ data: memberForLog }, { data: offer }] = await Promise.all([
    supabase.from("members").select("member_code, club_id").eq("id", orderForAuth.member_id).single(),
    supabase
      .from("club_offers")
      .select("offer_catalog(name)")
      .eq("id", orderForAuth.club_offer_id)
      .single(),
  ]);
  const catalogInfo = offer
    ? Array.isArray(offer.offer_catalog) ? offer.offer_catalog[0] : offer.offer_catalog
    : null;
  await logActivity({
    clubId: memberForLog?.club_id ?? authClubId,
    staffMemberId,
    action: "offer_order_fulfilled",
    targetMemberCode: memberForLog?.member_code,
    details: catalogInfo?.name,
  });

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
  const code = memberCode.trim().toUpperCase();
  if (!code || code.length < 3 || code.length > 6) return { error: "Invalid member code" };
  if (!/^[A-Z0-9]+$/.test(code)) return { error: "Invalid member code" };

  const supabase = createAdminClient();

  // Resolve product linkage on the offer before we decide the path.
  const { data: offer } = await supabase
    .from("club_offers")
    .select("product_id, offer_catalog(name)")
    .eq("id", clubOfferId)
    .eq("club_id", clubId)
    .single();
  if (!offer) return { error: "Offer not found" };
  const productId = offer.product_id as string | null;

  try {
    await requireOpsAccess(clubId, "qebo");
    if (productId) await requireOpsAccess(clubId, "sell");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("club_id", clubId)
    .eq("member_code", code)
    .eq("status", "active")
    .single();
  if (!member) return { error: "Member not found" };

  if (productId) {
    // Insert a pending order first so record_offer_fulfillment has a row
    // to lock + update. Compensate (delete) on failure since the sale
    // transaction rolled back.
    const { data: pending, error: insertError } = await supabase
      .from("offer_orders")
      .insert({
        club_offer_id: clubOfferId,
        member_id: member.id,
      })
      .select("id")
      .single();
    if (insertError || !pending) return { error: "Failed to create order" };

    const { error: rpcError } = await supabase.rpc("record_offer_fulfillment", {
      p_offer_order_id: pending.id,
      p_staff_id: staffMemberId,
    });
    if (rpcError) {
      await supabase.from("offer_orders").delete().eq("id", pending.id);
      return { error: mapRpcError(rpcError.message, "Failed to add order") };
    }
  } else {
    const { error } = await supabase.from("offer_orders").insert({
      club_offer_id: clubOfferId,
      member_id: member.id,
      status: "fulfilled",
      fulfilled_by: staffMemberId,
      fulfilled_at: new Date().toISOString(),
    });
    if (error) return { error: "Failed to add order" };
  }

  const catalogInfo = offer.offer_catalog
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
