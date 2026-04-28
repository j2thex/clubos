import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const rand = () => randomUUID().slice(0, 6);

export type ClubFixture = {
  clubId: string;
  staffId: string;
  memberId: string;
  organizationId: string;
};

export async function setupClub(
  db: SupabaseClient,
  opts: { operationsModule?: boolean } = {},
): Promise<ClubFixture> {
  const slug = `test-${rand()}`;
  const orgName = `Test Org ${rand()}`;

  const { data: org, error: orgErr } = await db
    .from("organizations")
    .insert({ name: orgName })
    .select("id")
    .single();
  if (orgErr) throw new Error(`org insert: ${orgErr.message}`);

  const { data: club, error: clubErr } = await db
    .from("clubs")
    .insert({
      organization_id: org.id,
      name: `Test Club ${rand()}`,
      slug,
      operations_module_enabled: opts.operationsModule ?? true,
    })
    .select("id")
    .single();
  if (clubErr) throw new Error(`club insert: ${clubErr.message}`);

  const { data: staff, error: staffErr } = await db
    .from("members")
    .insert({
      club_id: club.id,
      member_code: `S${rand().toUpperCase()}`,
      full_name: "Test Staff",
      status: "active",
      is_staff: true,
    })
    .select("id")
    .single();
  if (staffErr) throw new Error(`staff insert: ${staffErr.message}`);

  const { data: member, error: memberErr } = await db
    .from("members")
    .insert({
      club_id: club.id,
      member_code: `M${rand().toUpperCase()}`,
      full_name: "Test Member",
      status: "active",
    })
    .select("id")
    .single();
  if (memberErr) throw new Error(`member insert: ${memberErr.message}`);

  return {
    clubId: club.id,
    staffId: staff.id,
    memberId: member.id,
    organizationId: org.id,
  };
}

export type ProductFixture = {
  productId: string;
  categoryId: string;
};

export async function setupProduct(
  db: SupabaseClient,
  clubId: string,
  opts: {
    stockOnHand?: number;
    unitPrice?: number;
    unit?: "gram" | "piece";
    active?: boolean;
    archived?: boolean;
  } = {},
): Promise<ProductFixture> {
  const { data: cat, error: catErr } = await db
    .from("product_categories")
    .insert({
      club_id: clubId,
      name: `Cat ${rand()}`,
      display_order: 0,
    })
    .select("id")
    .single();
  if (catErr) throw new Error(`category insert: ${catErr.message}`);

  const { data: product, error: prodErr } = await db
    .from("products")
    .insert({
      club_id: clubId,
      category_id: cat.id,
      name: `Product ${rand()}`,
      unit: opts.unit ?? "gram",
      unit_price: opts.unitPrice ?? 10,
      stock_on_hand: opts.stockOnHand ?? 100,
      active: opts.active ?? true,
      archived: opts.archived ?? false,
      display_order: 0,
    })
    .select("id")
    .single();
  if (prodErr) throw new Error(`product insert: ${prodErr.message}`);

  return { productId: product.id, categoryId: cat.id };
}

export async function cleanupClub(
  db: SupabaseClient,
  clubId: string,
): Promise<void> {
  const { data: club } = await db
    .from("clubs")
    .select("organization_id")
    .eq("id", clubId)
    .single();

  await db.from("clubs").delete().eq("id", clubId);
  if (club?.organization_id) {
    await db.from("organizations").delete().eq("id", club.organization_id);
  }
}
