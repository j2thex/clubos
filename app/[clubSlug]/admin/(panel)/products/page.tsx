import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { ProductsManager, type Category, type Product } from "../../products-manager";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, operations_module_enabled")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();
  if (!club.operations_module_enabled) notFound();

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from("product_categories")
      .select("id, name, name_es, archived, display_order")
      .eq("club_id", club.id)
      .order("display_order", { ascending: true }),
    supabase
      .from("products")
      .select(
        "id, category_id, name, name_es, description, description_es, image_url, unit, unit_price, stock_on_hand, archived, display_order",
      )
      .eq("club_id", club.id)
      .order("display_order", { ascending: true }),
  ]);

  const categoryRows: Category[] = (categories ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    nameEs: c.name_es ?? null,
    archived: c.archived,
    displayOrder: c.display_order,
  }));

  const productRows: Product[] = (products ?? []).map((p) => ({
    id: p.id,
    categoryId: p.category_id,
    name: p.name,
    nameEs: p.name_es ?? null,
    description: p.description ?? null,
    descriptionEs: p.description_es ?? null,
    imageUrl: p.image_url ?? null,
    unit: p.unit as "gram" | "piece",
    unitPrice: Number(p.unit_price),
    stockOnHand: Number(p.stock_on_hand),
    archived: p.archived,
    displayOrder: p.display_order,
  }));

  return (
    <ProductsManager
      clubId={club.id}
      clubSlug={clubSlug}
      categories={categoryRows}
      products={productRows}
    />
  );
}
