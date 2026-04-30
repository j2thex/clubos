import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { ProductsManager, type Category, type Product } from "../../../products-manager";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  const { clubSlug } = await params;
  const { kind: kindRaw } = await searchParams;
  const kind: "genetics" | "drinks_accessories" =
    kindRaw === "drinks_accessories" ? "drinks_accessories" : "genetics";
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, operations_module_enabled")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();
  if (!club.operations_module_enabled) notFound();

  const { data: categories } = await supabase
    .from("product_categories")
    .select("id, name, name_es, kind, archived, display_order")
    .eq("club_id", club.id)
    .eq("kind", kind)
    .order("display_order", { ascending: true });

  const categoryIds = (categories ?? []).map((c) => c.id);

  // For genetics (the default kind), include products without a category as a
  // fallback so they don't get hidden during the rollout. drinks_accessories
  // only shows products that are explicitly categorized into it.
  const productsBase = supabase
    .from("products")
    .select(
      "id, category_id, name, name_es, description, description_es, image_url, unit, unit_price, cost_price, stock_on_hand, archived, display_order",
    )
    .eq("club_id", club.id);
  let productsQuery;
  if (kind === "genetics") {
    productsQuery =
      categoryIds.length > 0
        ? productsBase.or(
            `category_id.in.(${categoryIds.join(",")}),category_id.is.null`,
          )
        : productsBase.is("category_id", null);
  } else {
    productsQuery =
      categoryIds.length > 0
        ? productsBase.in("category_id", categoryIds)
        : productsBase.in("category_id", ["00000000-0000-0000-0000-000000000000"]);
  }
  const { data: products } = await productsQuery.order("display_order", {
    ascending: true,
  });

  const categoryRows: Category[] = (categories ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    nameEs: c.name_es ?? null,
    kind: (c.kind as "genetics" | "drinks_accessories") ?? "genetics",
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
    costPrice: Number(p.cost_price ?? 0),
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
      kind={kind}
    />
  );
}
