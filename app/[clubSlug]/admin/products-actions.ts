"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireOwnerForClub } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { uploadClubImage, deleteClubImage } from "@/lib/supabase/storage";
import { revalidatePath } from "next/cache";

// ---------------------------- Categories ----------------------------

export async function addProductCategory(
  clubId: string,
  clubSlug: string,
  name: string,
  nameEs?: string | null,
): Promise<{ error: string } | { ok: true }> {
  try { await requireOwnerForClub(clubId); } catch (err) {
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

  try { await requireOwnerForClub(current.club_id); } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const { error } = await supabase
    .from("product_categories")
    .update({ name: trimmed, name_es: nameEs?.trim() || null })
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

  try { await requireOwnerForClub(current.club_id); } catch (err) {
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

  try { await requireOwnerForClub(clubId); } catch (err) {
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
  try { await requireOwnerForClub(clubId); } catch (err) {
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

  const { error } = await supabase.from("products").insert({
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
  });

  if (error) return { error: "Failed to add product" };

  await logActivity({
    clubId,
    action: "product_created",
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

  try { await requireOwnerForClub(current.club_id); } catch (err) {
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

  try { await requireOwnerForClub(current.club_id); } catch (err) {
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
    details: `${current.name}: ${before} → ${after} (Δ${delta > 0 ? "+" : ""}${delta})${
      reason ? ` — ${reason}` : ""
    }`,
  });

  revalidatePath(`/${clubSlug}/admin/products`);
  revalidatePath(`/${clubSlug}/staff/operations/products`);
  return { ok: true, newStock: after };
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

  try { await requireOwnerForClub(current.club_id); } catch (err) {
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
    details: current.name,
  });

  revalidatePath(`/${clubSlug}/admin/products`);
  revalidatePath(`/${clubSlug}/staff/operations/products`);
  return { ok: true };
}
