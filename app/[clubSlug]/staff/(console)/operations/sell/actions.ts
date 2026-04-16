"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaffForClub } from "@/lib/auth";
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
  staff_wrong_club: "Unauthorized",
  tx_not_found: "Transaction not found",
  cross_club: "Unauthorized",
  already_voided: "Already voided",
  product_missing: "Product no longer exists",
  reason_required: "Void reason is required",
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

  // Load the transaction just to learn its club_id so we can authorize.
  // The RPC below re-checks club membership defensively.
  const { data: tx } = await supabase
    .from("product_transactions")
    .select("club_id")
    .eq("id", transactionId)
    .single();

  if (!tx) return { error: "Transaction not found" };

  let staff: { member_id: string; club_id: string };
  try { staff = await requireStaffForClub(tx.club_id); } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  // Atomic: locks tx + product, restores stock, stamps void, writes audit row.
  const { error } = await supabase.rpc("void_product_sale", {
    p_transaction_id: transactionId,
    p_club_id: tx.club_id,
    p_staff_id: staff.member_id,
    p_reason: trimmed,
  });

  if (error) {
    const mapped = RPC_ERRORS[error.message];
    return { error: mapped ?? "Failed to void transaction" };
  }

  revalidatePath(`/${clubSlug}/staff/operations/transactions`);
  revalidatePath(`/${clubSlug}/staff/operations/products`);
  return { ok: true };
}
