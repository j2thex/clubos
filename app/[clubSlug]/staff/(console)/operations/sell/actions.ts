"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaffForClub } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { revalidatePath } from "next/cache";

export type SellInput = {
  clubId: string;
  productId: string;
  memberId: string;
  quantity: number;
  weightSource: "manual" | "scale";
  scaleRawReading?: string | null;
};

const RPC_ERRORS: Record<string, string> = {
  invalid_quantity: "Quantity must be greater than zero",
  invalid_weight_source: "Invalid weight source",
  product_not_found: "Product not found",
  product_inactive: "Product is archived or inactive",
  insufficient_stock: "Not enough stock on hand",
  member_not_found: "Member not found",
};

export async function sellProduct(
  clubSlug: string,
  input: SellInput,
): Promise<{ error: string } | { ok: true; transactionId: string }> {
  let staff: { member_id: string; club_id: string };
  try { staff = await requireStaffForClub(input.clubId); } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    return { error: "Quantity must be greater than zero" };
  }

  const supabase = createAdminClient();

  const { data: txId, error } = await supabase.rpc("sell_product", {
    p_club_id: input.clubId,
    p_product_id: input.productId,
    p_member_id: input.memberId,
    p_staff_id: staff.member_id,
    p_quantity: input.quantity,
    p_weight_source: input.weightSource,
    p_scale_raw: input.scaleRawReading ?? null,
  });

  if (error) {
    const mapped = RPC_ERRORS[error.message];
    return { error: mapped ?? "Failed to record sale" };
  }

  revalidatePath(`/${clubSlug}/staff/operations/products`);
  revalidatePath(`/${clubSlug}/staff/operations/sell`);
  revalidatePath(`/${clubSlug}/staff/operations/transactions`);

  return { ok: true, transactionId: txId as string };
}

export async function voidTransaction(
  transactionId: string,
  clubSlug: string,
  reason: string,
): Promise<{ error: string } | { ok: true }> {
  const trimmed = reason.trim();
  if (!trimmed) return { error: "Void reason is required" };

  const supabase = createAdminClient();

  const { data: tx } = await supabase
    .from("product_transactions")
    .select(
      "id, club_id, product_id, quantity, voided_at, members(member_code), products(name)",
    )
    .eq("id", transactionId)
    .single();

  if (!tx) return { error: "Transaction not found" };
  if (tx.voided_at) return { error: "Already voided" };

  let staff: { member_id: string; club_id: string };
  try { staff = await requireStaffForClub(tx.club_id); } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const { error } = await supabase
    .from("product_transactions")
    .update({
      voided_at: new Date().toISOString(),
      voided_by: staff.member_id,
      void_reason: trimmed,
    })
    .eq("id", transactionId);

  if (error) return { error: "Failed to void transaction" };

  // Restore the quantity to stock. Re-query current stock to avoid stale writes.
  const { data: product } = await supabase
    .from("products")
    .select("stock_on_hand, name")
    .eq("id", tx.product_id)
    .single();

  if (product) {
    await supabase
      .from("products")
      .update({ stock_on_hand: Number(product.stock_on_hand) + Number(tx.quantity) })
      .eq("id", tx.product_id);
  }

  const memberRef = Array.isArray(tx.members) ? tx.members[0] : tx.members;
  const productRef = Array.isArray(tx.products) ? tx.products[0] : tx.products;

  await logActivity({
    clubId: tx.club_id,
    staffMemberId: staff.member_id,
    action: "product_sale_voided",
    targetMemberCode: memberRef?.member_code ?? null,
    details: `${productRef?.name ?? "product"} · qty ${tx.quantity} restored · reason: ${trimmed}`,
  });

  revalidatePath(`/${clubSlug}/staff/operations/transactions`);
  revalidatePath(`/${clubSlug}/staff/operations/products`);
  return { ok: true };
}
