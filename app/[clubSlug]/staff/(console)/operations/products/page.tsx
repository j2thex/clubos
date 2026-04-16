import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

type Locale = Awaited<ReturnType<typeof getServerLocale>>;

function localize(
  locale: Locale,
  en: string,
  es: string | null | undefined,
): string {
  if (locale === "es" && es && es.trim()) return es;
  return en;
}

export default async function StaffOperationsProductsPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();
  const locale = await getServerLocale();

  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from("product_categories")
      .select("id, name, name_es, display_order")
      .eq("club_id", club.id)
      .eq("archived", false)
      .order("display_order", { ascending: true }),
    supabase
      .from("products")
      .select(
        "id, category_id, name, name_es, description, description_es, image_url, unit, unit_price, stock_on_hand, display_order",
      )
      .eq("club_id", club.id)
      .eq("archived", false)
      .eq("active", true)
      .order("display_order", { ascending: true }),
  ]);

  const uncategorized = (products ?? []).filter((p) => !p.category_id);
  const categorized = new Map<string, typeof products>();
  (products ?? []).forEach((p) => {
    if (!p.category_id) return;
    const existing = categorized.get(p.category_id) ?? [];
    existing.push(p);
    categorized.set(p.category_id, existing);
  });

  const sections = [
    ...(categories ?? []).map((c) => ({
      id: c.id,
      label: localize(locale, c.name, c.name_es),
      items: categorized.get(c.id) ?? [],
    })),
    ...(uncategorized.length > 0
      ? [{ id: "uncat", label: "Uncategorized", items: uncategorized }]
      : []),
  ].filter((s) => s.items.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          {t(locale, "ops.productsTitle")}
        </h1>
        <a
          href={`/${clubSlug}/staff/operations`}
          className="text-xs text-gray-500 hover:text-gray-900"
        >
          ← {t(locale, "ops.title")}
        </a>
      </div>

      {sections.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-gray-400 text-sm">
          {t(locale, "ops.productsEmpty")}
        </div>
      ) : (
        sections.map((section) => (
          <div key={section.id} className="space-y-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
              {section.label}
            </h2>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden divide-y divide-gray-100">
              {section.items.map((p) => {
                const low = Number(p.stock_on_hand) <= 0;
                return (
                  <div
                    key={p.id}
                    className="px-5 py-3 flex items-center gap-3"
                  >
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover bg-gray-100 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {localize(locale, p.name, p.name_es)}
                      </p>
                      {(p.description || p.description_es) && (
                        <p className="text-xs text-gray-500 truncate">
                          {localize(locale, p.description ?? "", p.description_es)}
                        </p>
                      )}
                      <p
                        className={`text-xs mt-0.5 ${
                          low ? "text-red-500 font-semibold" : "text-gray-400"
                        }`}
                      >
                        {Number(p.unit_price).toFixed(2)}€/
                        {p.unit === "gram" ? "g" : "ea"} ·{" "}
                        {low
                          ? t(locale, "ops.outOfStock")
                          : `${Number(p.stock_on_hand).toFixed(p.unit === "gram" ? 1 : 0)}${p.unit === "gram" ? "g" : ""} ${t(locale, "ops.inStock")}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
