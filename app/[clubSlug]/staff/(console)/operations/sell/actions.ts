"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireOpsAccess } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { lookupMemberForEntry, type LookedUpMember } from "../entry/actions";

// ---------- Types ----------

export type SaleLineInput = {
  productId: string;
  quantity: number;
  weightSource: "manual" | "scale";
  scaleRawReading?: string | null;
};

export type RecordSaleInput = {
  clubId: string;
  memberId: string;
  lines: SaleLineInput[];
  discount: number;
  comment: string | null;
  paidWith: "saldo" | "cash";
};

export type TopupInput = {
  clubId: string;
  memberId: string;
  amount: number;
  method: string;
  comment: string | null;
};

// Legacy single-item input — kept for any callers still on the
// pre-cart UX. New callers should use recordSale.
export type SellInput = {
  clubId: string;
  productId: string;
  memberId: string;
  quantity: number;
  weightSource: "manual" | "scale";
  scaleRawReading?: string | null;
};

const RPC_ERRORS: Record<string, string> = {
  // shared
  invalid_quantity: "Quantity must be greater than zero",
  invalid_weight_source: "Invalid weight source",
  invalid_amount: "Amount must be greater than zero",
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
  comment_required: "Comment is required",
  would_go_negative: "Adjustment would push the balance below zero",
  // void
  tx_not_found: "Transaction not found",
  sale_not_found: "Sale not found",
  cross_club: "Unauthorized",
  already_voided: "Already voided",
  product_missing: "Product no longer exists",
  reason_required: "Void reason is required",
};

// Sentinel string returned to the client on the limit error. The client
// recognises it and builds a rich message from local state (current cart +
// month-to-date consumed grams), which is safer than parsing the RPC's
// formatted message — PostgREST sometimes wraps it unpredictably.
function mapRpcError(message: string, fallback: string): string {
  if (message.includes("over_consumption_limit")) return "over_consumption_limit";
  return RPC_ERRORS[message] ?? fallback;
}

// ---------- lookupMemberForSell: cart-page member lookup ----------
//
// Wraps the entry lookup and adds POS-specific data: saldo balance and the
// member's last 10 sales. Reused by the SellClient when scanning a QR or
// switching member.

export type RecentSale = {
  saleId: string;
  total: number;
  paidWith: "saldo" | "cash";
  comment: string | null;
  voidedAt: string | null;
  createdAt: string;
  lineCount: number;
};

export type MemberForSell = {
  member: LookedUpMember;
  saldoBalance: number;
  recentSales: RecentSale[];
  monthlyLimitGrams: number | null;
  monthlyConsumedGrams: number;
};

export async function lookupMemberForSell(
  clubId: string,
  rawCode: string,
): Promise<{ error: string } | { ok: true; data: MemberForSell }> {
  const inner = await lookupMemberForEntry(clubId, rawCode);
  if ("error" in inner) return { error: inner.error };

  const supabase = createAdminClient();
  const memberId = inner.member.id;

  const now = new Date();
  const monthStartIso = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();

  const [
    { data: memberRow },
    { data: salesRows },
    { data: clubRow },
    { data: monthGramsRows },
  ] = await Promise.all([
    supabase.from("members").select("saldo_balance").eq("id", memberId).single(),
    supabase
      .from("sales")
      .select("id, total, paid_with, comment, voided_at, created_at, lines:product_transactions(id)")
      .eq("club_id", clubId)
      .eq("member_id", memberId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("clubs")
      .select("monthly_consumption_limit_grams")
      .eq("id", clubId)
      .single(),
    supabase
      .from("product_transactions")
      .select("quantity, products!inner(unit)")
      .eq("club_id", clubId)
      .eq("member_id", memberId)
      .is("voided_at", null)
      .eq("products.unit", "gram")
      .gte("created_at", monthStartIso),
  ]);

  const recentSales: RecentSale[] = (salesRows ?? []).map((s) => ({
    saleId: s.id,
    total: Number(s.total),
    paidWith: s.paid_with as "saldo" | "cash",
    comment: s.comment,
    voidedAt: s.voided_at,
    createdAt: s.created_at,
    lineCount: Array.isArray(s.lines) ? s.lines.length : 0,
  }));

  const monthlyConsumedGrams = (monthGramsRows ?? []).reduce(
    (sum, row) => sum + Number(row.quantity ?? 0),
    0,
  );
  const limitRaw = clubRow?.monthly_consumption_limit_grams;
  const monthlyLimitGrams =
    limitRaw === null || limitRaw === undefined ? null : Number(limitRaw);

  return {
    ok: true,
    data: {
      member: inner.member,
      saldoBalance: Number(memberRow?.saldo_balance ?? 0),
      recentSales,
      monthlyLimitGrams,
      monthlyConsumedGrams,
    },
  };
}

// ---------- recordSale: multi-item cart ----------

export async function recordSale(
  clubSlug: string,
  input: RecordSaleInput,
): Promise<
  | { error: string }
  | { ok: true; saleId: string; total: number; balanceAfter: number | null }
> {
  let actor: Awaited<ReturnType<typeof requireOpsAccess>>;
  try {
    actor = await requireOpsAccess(input.clubId, "sell");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  if (!Array.isArray(input.lines) || input.lines.length === 0) {
    return { error: "Cart is empty" };
  }
  if (!Number.isFinite(input.discount) || input.discount < 0) {
    return { error: "Invalid discount" };
  }
  if (input.paidWith !== "saldo" && input.paidWith !== "cash") {
    return { error: "Invalid payment method" };
  }

  const lines = input.lines.map((l) => ({
    product_id: l.productId,
    quantity: l.quantity,
    weight_source: l.weightSource,
    scale_raw: l.scaleRawReading ?? null,
  }));

  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("record_sale", {
    p_club_id: input.clubId,
    p_member_id: input.memberId,
    p_staff_id: actor.member_id,
    p_lines: lines,
    p_discount: input.discount,
    p_comment: input.comment,
    p_paid_with: input.paidWith,
  });

  if (error) return { error: mapRpcError(error.message, "Failed to record sale") };

  const result = data as { sale_id: string; total: number; balance_after: number | null };

  revalidatePath(`/${clubSlug}/staff/operations/products`);
  revalidatePath(`/${clubSlug}/staff/operations/sell`);
  revalidatePath(`/${clubSlug}/staff/operations/transactions`);
  revalidatePath(`/${clubSlug}/admin/operations/sell`);
  revalidatePath(`/${clubSlug}/admin/operations/transactions`);

  return {
    ok: true,
    saleId: result.sale_id,
    total: Number(result.total),
    balanceAfter: result.balance_after === null ? null : Number(result.balance_after),
  };
}

// ---------- topupSaldo ----------

export async function topupSaldo(
  clubSlug: string,
  input: TopupInput,
): Promise<{ error: string } | { ok: true; balanceAfter: number }> {
  let actor: Awaited<ReturnType<typeof requireOpsAccess>>;
  try {
    actor = await requireOpsAccess(input.clubId, "topup");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { error: "Amount must be greater than zero" };
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("topup_saldo", {
    p_club_id: input.clubId,
    p_member_id: input.memberId,
    p_amount: input.amount,
    p_method: input.method,
    p_comment: input.comment,
    p_staff_id: actor.member_id,
  });

  if (error) return { error: mapRpcError(error.message, "Failed to top up") };

  const result = data as { balance_after: number };

  revalidatePath(`/${clubSlug}/staff/operations/sell`);
  revalidatePath(`/${clubSlug}/admin/operations/sell`);
  revalidatePath(`/${clubSlug}/admin`, "layout");

  return { ok: true, balanceAfter: Number(result.balance_after) };
}

// ---------- voidSale: void a multi-line sale ----------

export async function voidSale(
  saleId: string,
  clubSlug: string,
  reason: string,
): Promise<
  | { error: string }
  | { ok: true; refunded: number; balanceAfter: number | null }
> {
  const trimmed = reason.trim();
  if (!trimmed) return { error: "Void reason is required" };

  const supabase = createAdminClient();

  // Load club_id for permission check; the RPC re-checks defensively.
  const { data: sale } = await supabase
    .from("sales")
    .select("club_id")
    .eq("id", saleId)
    .single();

  if (!sale) return { error: "Sale not found" };

  let actor: Awaited<ReturnType<typeof requireOpsAccess>>;
  try {
    actor = await requireOpsAccess(sale.club_id, "transactions");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const { data, error } = await supabase.rpc("void_sale", {
    p_sale_id: saleId,
    p_club_id: sale.club_id,
    p_staff_id: actor.member_id,
    p_reason: trimmed,
  });

  if (error) return { error: mapRpcError(error.message, "Failed to void sale") };

  const result = data as { sale_id: string; refunded: number; balance_after: number | null };

  revalidatePath(`/${clubSlug}/staff/operations/transactions`);
  revalidatePath(`/${clubSlug}/staff/operations/products`);
  revalidatePath(`/${clubSlug}/staff/operations/sell`);
  revalidatePath(`/${clubSlug}/admin/operations/transactions`);
  revalidatePath(`/${clubSlug}/admin/operations/sell`);
  revalidatePath(`/${clubSlug}/admin`, "layout");

  return {
    ok: true,
    refunded: Number(result.refunded),
    balanceAfter: result.balance_after === null ? null : Number(result.balance_after),
  };
}

// ---------- sellProduct: thin shim around recordSale ----------
// Kept so the legacy SellClient (single-item, 3-step) keeps working until
// the multi-item cart UI ships. New code should call recordSale directly.

export async function sellProduct(
  clubSlug: string,
  input: SellInput,
): Promise<{ error: string } | { ok: true; transactionId: string }> {
  // Resolve the club's currency mode so the shim picks the right paid_with.
  const supabase = createAdminClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("currency_mode")
    .eq("id", input.clubId)
    .single();

  const paidWith: "saldo" | "cash" = club?.currency_mode === "saldo" ? "saldo" : "cash";

  const result = await recordSale(clubSlug, {
    clubId: input.clubId,
    memberId: input.memberId,
    lines: [
      {
        productId: input.productId,
        quantity: input.quantity,
        weightSource: input.weightSource,
        scaleRawReading: input.scaleRawReading ?? null,
      },
    ],
    discount: 0,
    comment: null,
    paidWith,
  });

  if ("error" in result) return result;
  // Legacy contract returns transactionId. The new flow returns saleId; the
  // legacy callers only use it for display, so saleId works as a stand-in.
  return { ok: true, transactionId: result.saleId };
}

// ---------- exportTodayTransactionsCsv (unchanged) ----------

export async function exportTodayTransactionsCsv(
  clubId: string,
): Promise<{ error: string } | { ok: true; csv: string; filename: string }> {
  try {
    await requireOpsAccess(clubId, "transactions");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const supabase = createAdminClient();
  const dayStart = new Date(new Date().toDateString()).toISOString();

  const { data } = await supabase
    .from("product_transactions")
    .select(
      "id, created_at, quantity, unit_price_at_sale, total_price, weight_source, scale_raw_reading, voided_at, void_reason, members(member_code), products(name, unit), staff:fulfilled_by(member_code)",
    )
    .eq("club_id", clubId)
    .gte("created_at", dayStart)
    .order("created_at", { ascending: false });

  const header = [
    "timestamp",
    "transaction_id",
    "product",
    "unit",
    "quantity",
    "unit_price_eur",
    "total_eur",
    "member_code",
    "staff_code",
    "weight_source",
    "scale_raw",
    "voided",
    "void_reason",
  ].join(",");

  const rows = (data ?? []).map((tx) => {
    const member = Array.isArray(tx.members) ? tx.members[0] : tx.members;
    const product = Array.isArray(tx.products) ? tx.products[0] : tx.products;
    const staffRef = Array.isArray(tx.staff) ? tx.staff[0] : tx.staff;
    const cells = [
      tx.created_at,
      tx.id,
      product?.name ?? "",
      product?.unit ?? "",
      tx.quantity,
      tx.unit_price_at_sale,
      tx.total_price,
      member?.member_code ?? "",
      staffRef?.member_code ?? "",
      tx.weight_source,
      tx.scale_raw_reading ?? "",
      tx.voided_at ? "yes" : "no",
      tx.void_reason ?? "",
    ];
    return cells
      .map((cell) => {
        const s = String(cell);
        if (s.includes(",") || s.includes('"') || s.includes("\n")) {
          return `"${s.replaceAll('"', '""')}"`;
        }
        return s;
      })
      .join(",");
  });

  const today = new Date().toISOString().split("T")[0];
  return {
    ok: true,
    csv: [header, ...rows].join("\n"),
    filename: `transactions-${today}.csv`,
  };
}

// ---------- voidTransaction (legacy single-line void) ----------
// Kept for legacy product_transactions rows that do NOT have a sale_id.
// The new transactions UI will route to voidSale when sale_id is present.

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
    .select("club_id, sale_id")
    .eq("id", transactionId)
    .single();

  if (!tx) return { error: "Transaction not found" };

  // If this row already belongs to a parent sale (post-backfill), route
  // through voidSale so the parent and any sibling lines are voided too.
  if (tx.sale_id) {
    const result = await voidSale(tx.sale_id, clubSlug, trimmed);
    if ("error" in result) return result;
    return { ok: true };
  }

  let actor: Awaited<ReturnType<typeof requireOpsAccess>>;
  try {
    actor = await requireOpsAccess(tx.club_id, "transactions");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const { error } = await supabase.rpc("void_product_sale", {
    p_transaction_id: transactionId,
    p_club_id: tx.club_id,
    p_staff_id: actor.member_id,
    p_reason: trimmed,
  });

  if (error) return { error: mapRpcError(error.message, "Failed to void transaction") };

  revalidatePath(`/${clubSlug}/staff/operations/transactions`);
  revalidatePath(`/${clubSlug}/staff/operations/products`);
  revalidatePath(`/${clubSlug}/admin/operations/transactions`);
  return { ok: true };
}
