"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireOpsAccess } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { uploadClubImage, deleteClubImage } from "@/lib/supabase/storage";
import { revalidatePath } from "next/cache";

// ---------------------------- Categories ----------------------------

export type CategoryKind = "genetics" | "drinks_accessories";

export async function addProductCategory(
  clubId: string,
  clubSlug: string,
  name: string,
  nameEs?: string | null,
  kind: CategoryKind = "genetics",
): Promise<{ error: string } | { ok: true }> {
  try { await requireOpsAccess(clubId, "manage_products"); } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required" };

  const supabase = createAdminClient();

  const { data: last } = await supabase
    .from("product_categories")
    .select("display_order")
    .eq("club_id", clubId)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("product_categories").insert({
    club_id: clubId,
    name: trimmed,
    name_es: nameEs?.trim() || null,
    kind,
    display_order: (last?.display_order ?? -1) + 1,
  });

  if (error) return { error: "Failed to add category" };

  await logActivity({
    clubId,
    action: "product_category_created",
    details: trimmed,
  });

  revalidatePath(`/${clubSlug}/admin/products`);
  revalidatePath(`/${clubSlug}/staff/operations/products`);
  return { ok: true };
}

export async function updateProductCategory(
  categoryId: string,
  clubSlug: string,
  name: string,
  nameEs?: string | null,
  kind?: CategoryKind,
): Promise<{ error: string } | { ok: true }> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required" };

  const supabase = createAdminClient();

  const { data: current } = await supabase
    .from("product_categories")
    .select("club_id")
    .eq("id", categoryId)
    .single();

  if (!current) return { error: "Category not found" };

  try { await requireOpsAccess(current.club_id, "manage_products"); } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const update: { name: string; name_es: string | null; kind?: CategoryKind } = {
    name: trimmed,
    name_es: nameEs?.trim() || null,
  };
  if (kind) update.kind = kind;
  const { error } = await supabase
    .from("product_categories")
    .update(update)
    .eq("id", categoryId);

  if (error) return { error: "Failed to update category" };

  await logActivity({
    clubId: current.club_id,
    action: "product_category_updated",
    details: trimmed,
  });

  revalidatePath(`/${clubSlug}/admin/products`);
  revalidatePath(`/${clubSlug}/staff/operations/products`);
  return { ok: true };
}

export async function reorderProductCategory(
  categoryId: string,
  clubSlug: string,
  direction: "up" | "down",
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { data: current } = await supabase
    .from("product_categories")
    .select("club_id, display_order, archived")
    .eq("id", categoryId)
    .single();

  if (!current) return { error: "Category not found" };

  try { await requireOpsAccess(current.club_id, "manage_products"); } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  let q = supabase
    .from("product_categories")
    .select("id, display_order")
    .eq("club_id", current.club_id)
    .eq("archived", current.archived)
    .neq("id", categoryId);
  q = direction === "down"
    ? q.gt("display_order", current.display_order).order("display_order", { ascending: true })
    : q.lt("display_order", current.display_order).order("display_order", { ascending: false });
  const { data: neighbor } = await q.limit(1).maybeSingle();

  if (!neighbor) return { ok: true };

  // Swap display_order. Use a temporary high value to avoid any unique-ish constraint.
  const tmp = 2_000_000_000;
  const { error: e1 } = await supabase
    .from("product_categories")
    .update({ display_order: tmp })
    .eq("id", categoryId);
  if (e1) return { error: "Failed to reorder" };

  const { error: e2 } = await supabase
    .from("product_categories")
    .update({ display_order: current.display_order })
    .eq("id", neighbor.id);
  if (e2) return { error: "Failed to reorder" };

  const { error: e3 } = await supabase
    .from("product_categories")
    .update({ display_order: neighbor.display_order })
    .eq("id", categoryId);
  if (e3) return { error: "Failed to reorder" };

  revalidatePath(`/${clubSlug}/admin/products`);
  revalidatePath(`/${clubSlug}/staff/operations/products`);
  return { ok: true };
}

export async function archiveProductCategory(
  categoryId: string,
  clubSlug: string,
  archived: boolean,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { data: current } = await supabase
    .from("product_categories")
    .select("club_id, name")
    .eq("id", categoryId)
    .single();

  if (!current) return { error: "Category not found" };

  try { await requireOpsAccess(current.club_id, "manage_products"); } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const { error } = await supabase
    .from("product_categories")
    .update({ archived })
    .eq("id", categoryId);

  if (error) return { error: "Failed to archive category" };

  await logActivity({
    clubId: current.club_id,
    action: archived ? "product_category_archived" : "product_category_restored",
    details: current.name,
  });

  revalidatePath(`/${clubSlug}/admin/products`);
  revalidatePath(`/${clubSlug}/staff/operations/products`);
  return { ok: true };
}

// ----------------------------- Products -----------------------------

export async function uploadProductImageAction(
  formData: FormData,
): Promise<{ url: string } | { error: string }> {
  const clubId = formData.get("clubId");
  if (typeof clubId !== "string" || !clubId) return { error: "Missing club" };

  try { await requireOpsAccess(clubId, "manage_products"); } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No file" };
  if (file.size > 5 * 1024 * 1024) return { error: "File too large (max 5 MB)" };

  return uploadClubImage(clubId, file);
}

type ProductInput = {
  categoryId: string | null;
  name: string;
  nameEs?: string | null;
  description?: string | null;
  descriptionEs?: string | null;
  imageUrl?: string | null;
  unit: "gram" | "piece";
  unitPrice: number;
  costPrice?: number;
  stockOnHand: number;
};

function validateProductInput(input: ProductInput): string | null {
  if (!input.name.trim()) return "Name is required";
  if (input.unit !== "gram" && input.unit !== "piece") return "Invalid unit";
  if (!Number.isFinite(input.unitPrice) || input.unitPrice < 0)
    return "Unit price must be ≥ 0";
  if (
    input.costPrice !== undefined &&
    (!Number.isFinite(input.costPrice) || input.costPrice < 0)
  )
    return "Cost price must be ≥ 0";
  if (!Number.isFinite(input.stockOnHand) || input.stockOnHand < 0)
    return "Stock must be ≥ 0";
  return null;
}

export async function addProduct(
  clubId: string,
  clubSlug: string,
  input: ProductInput,
): Promise<{ error: string } | { ok: true }> {
  try { await requireOpsAccess(clubId, "manage_products"); } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const validation = validateProductInput(input);
  if (validation) return { error: validation };

  const supabase = createAdminClient();

  const { data: last } = await supabase
    .from("products")
    .select("display_order")
    .eq("club_id", clubId)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: inserted, error } = await supabase
    .from("products")
    .insert({
      club_id: clubId,
      category_id: input.categoryId,
      name: input.name.trim(),
      name_es: input.nameEs?.trim() || null,
      description: input.description?.trim() || null,
      description_es: input.descriptionEs?.trim() || null,
      image_url: input.imageUrl || null,
      unit: input.unit,
      unit_price: input.unitPrice,
      cost_price: input.costPrice ?? 0,
      stock_on_hand: input.stockOnHand,
      display_order: (last?.display_order ?? -1) + 1,
    })
    .select("id")
    .single();

  if (error || !inserted) return { error: "Failed to add product" };

  await logActivity({
    clubId,
    action: "product_created",
    targetProductId: inserted.id,
    details: `${input.name} @ ${input.unitPrice}/${input.unit}, stock ${input.stockOnHand}`,
  });

  revalidatePath(`/${clubSlug}/admin/products`);
  revalidatePath(`/${clubSlug}/staff/operations/products`);
  return { ok: true };
}

export async function updateProduct(
  productId: string,
  clubSlug: string,
  input: ProductInput,
): Promise<{ error: string } | { ok: true }> {
  const validation = validateProductInput(input);
  if (validation) return { error: validation };

  const supabase = createAdminClient();

  const { data: current } = await supabase
    .from("products")
    .select("club_id, name, image_url")
    .eq("id", productId)
    .single();

  if (!current) return { error: "Product not found" };

  try { await requireOpsAccess(current.club_id, "manage_products"); } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  // If image was replaced, clean up the old blob.
  if (current.image_url && input.imageUrl && current.image_url !== input.imageUrl) {
    await deleteClubImage(current.image_url).catch(() => {});
  }

  const { error } = await supabase
    .from("products")
    .update({
      category_id: input.categoryId,
      name: input.name.trim(),
      name_es: input.nameEs?.trim() || null,
      description: input.description?.trim() || null,
      description_es: input.descriptionEs?.trim() || null,
      image_url: input.imageUrl || null,
      unit: input.unit,
      unit_price: input.unitPrice,
      cost_price: input.costPrice ?? 0,
      stock_on_hand: input.stockOnHand,
    })
    .eq("id", productId);

  if (error) return { error: "Failed to update product" };

  await logActivity({
    clubId: current.club_id,
    action: "product_updated",
    targetProductId: productId,
    details: `${input.name} @ ${input.unitPrice}/${input.unit}, stock ${input.stockOnHand}`,
  });

  revalidatePath(`/${clubSlug}/admin/products`);
  revalidatePath(`/${clubSlug}/staff/operations/products`);
  return { ok: true };
}

export async function adjustProductStock(
  productId: string,
  clubSlug: string,
  delta: number,
  reason?: string,
): Promise<{ error: string } | { ok: true; newStock: number }> {
  if (!Number.isFinite(delta)) return { error: "Invalid delta" };
  const supabase = createAdminClient();

  const { data: current } = await supabase
    .from("products")
    .select("club_id, name, stock_on_hand")
    .eq("id", productId)
    .single();

  if (!current) return { error: "Product not found" };

  try { await requireOpsAccess(current.club_id, "manage_products"); } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const before = Number(current.stock_on_hand);
  const after = Math.max(0, before + delta);

  const { error } = await supabase
    .from("products")
    .update({ stock_on_hand: after })
    .eq("id", productId);

  if (error) return { error: "Failed to adjust stock" };

  await logActivity({
    clubId: current.club_id,
    action: "product_stock_adjusted",
    targetProductId: productId,
    details: `${current.name}: ${before} → ${after} (Δ${delta > 0 ? "+" : ""}${delta})${
      reason ? ` — ${reason}` : ""
    }`,
  });

  revalidatePath(`/${clubSlug}/admin/products`);
  revalidatePath(`/${clubSlug}/staff/operations/products`);
  return { ok: true, newStock: after };
}

export async function bulkSetProductsUnit(
  clubId: string,
  clubSlug: string,
  unit: "gram" | "piece",
): Promise<{ error: string } | { ok: true; updated: number }> {
  try { await requireOpsAccess(clubId, "manage_products"); } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .update({ unit })
    .eq("club_id", clubId)
    .eq("archived", false)
    .neq("unit", unit)
    .select("id");

  if (error) return { error: "Failed to update products" };

  const updated = data?.length ?? 0;

  if (updated > 0) {
    await logActivity({
      clubId,
      action: "products_bulk_unit_updated",
      details: `${updated} product(s) set to ${unit}`,
    });
  }

  revalidatePath(`/${clubSlug}/admin/products`);
  revalidatePath(`/${clubSlug}/staff/operations/products`);
  return { ok: true, updated };
}

export type ProductActivityEntry = {
  id: string;
  at: string;
  kind: "sale" | "log";
  action: string;
  details: string;
  memberCode: string | null;
  voided: boolean;
};

export async function getProductActivity(
  productId: string,
): Promise<{ error: string } | { ok: true; entries: ProductActivityEntry[] }> {
  const supabase = createAdminClient();

  const { data: product } = await supabase
    .from("products")
    .select("club_id")
    .eq("id", productId)
    .single();

  if (!product) return { error: "Product not found" };

  try { await requireOpsAccess(product.club_id, "manage_products"); } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const [{ data: txRows }, { data: logRows }] = await Promise.all([
    supabase
      .from("product_transactions")
      .select(
        "id, quantity, unit_price_at_sale, total_price, created_at, voided_at, sale:sales(id, total, voided_at, members(member_code))",
      )
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("activity_log")
      .select("id, action, details, created_at")
      .eq("target_product_id", productId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const sales: ProductActivityEntry[] = (txRows ?? []).map((row) => {
    const sale = Array.isArray(row.sale) ? row.sale[0] : row.sale;
    const memberRaw = sale?.members;
    const member = Array.isArray(memberRaw) ? memberRaw[0] : memberRaw;
    const memberCode: string | null = member?.member_code ?? null;
    const voided = !!(row.voided_at || sale?.voided_at);
    const qty = Number(row.quantity);
    const unitPrice = Number(row.unit_price_at_sale);
    const total = Number(row.total_price);
    return {
      id: `sale:${row.id}`,
      at: row.created_at,
      kind: "sale" as const,
      action: voided ? "sale_voided" : "sale",
      details: `${qty} × ${unitPrice.toFixed(2)} € = ${total.toFixed(2)} €`,
      memberCode,
      voided,
    };
  });

  const logs: ProductActivityEntry[] = (logRows ?? []).map((row) => ({
    id: `log:${row.id}`,
    at: row.created_at,
    kind: "log" as const,
    action: row.action,
    details: row.details ?? "",
    memberCode: null,
    voided: false,
  }));

  const entries = [...sales, ...logs].sort((a, b) =>
    a.at < b.at ? 1 : a.at > b.at ? -1 : 0,
  );

  return { ok: true, entries };
}

export async function archiveProduct(
  productId: string,
  clubSlug: string,
  archived: boolean,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { data: current } = await supabase
    .from("products")
    .select("club_id, name")
    .eq("id", productId)
    .single();

  if (!current) return { error: "Product not found" };

  try { await requireOpsAccess(current.club_id, "manage_products"); } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const { error } = await supabase
    .from("products")
    .update({ archived })
    .eq("id", productId);

  if (error) return { error: "Failed to archive product" };

  await logActivity({
    clubId: current.club_id,
    action: archived ? "product_archived" : "product_restored",
    targetProductId: productId,
    details: current.name,
  });

  revalidatePath(`/${clubSlug}/admin/products`);
  revalidatePath(`/${clubSlug}/staff/operations/products`);
  return { ok: true };
}
