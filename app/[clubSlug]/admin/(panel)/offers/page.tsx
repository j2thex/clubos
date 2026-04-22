import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { OfferManager } from "../../offer-manager";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

export default async function OffersPage({
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
  const locale = await getServerLocale();
  const opsEnabled = !!club.operations_module_enabled;

  const [{ data: catalog }, { data: clubOffers }, { data: products }] = await Promise.all([
    supabase
      .from("offer_catalog")
      .select("id, name, name_es, subtype, icon")
      .eq("is_approved", true)
      .order("name", { ascending: true }),
    supabase
      .from("club_offers")
      .select("id, offer_id, orderable, price, description, description_es, image_url, icon, link, is_public, archived, product_id, product_quantity")
      .eq("club_id", club.id),
    opsEnabled
      ? supabase
          .from("products")
          .select("id, name, name_es, unit, unit_price, stock_on_hand, category_id")
          .eq("club_id", club.id)
          .eq("active", true)
          .eq("archived", false)
          .order("display_order", { ascending: true })
      : Promise.resolve({ data: [] as Array<{
          id: string;
          name: string;
          name_es: string | null;
          unit: string;
          unit_price: number;
          stock_on_hand: number;
          category_id: string | null;
        }> }),
  ]);

  return (
    <div className="space-y-4">
      <Link
        href={`/${clubSlug}/admin/content`}
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {t(locale, "admin.backToContent")}
      </Link>
      <OfferManager
        catalog={(catalog ?? []).map((a) => ({
          id: a.id,
          name: a.name,
          name_es: a.name_es,
          subtype: a.subtype,
          icon: a.icon ?? null,
        }))}
        clubOffers={(clubOffers ?? []).map((ca) => ({
          id: ca.id,
          offer_id: ca.offer_id,
          orderable: ca.orderable ?? false,
          price: ca.price != null ? Number(ca.price) : null,
          description: ca.description ?? null,
          description_es: ca.description_es ?? null,
          image_url: ca.image_url ?? null,
          icon: ca.icon ?? null,
          link: ca.link ?? null,
          is_public: ca.is_public ?? false,
          archived: ca.archived ?? false,
          product_id: ca.product_id ?? null,
          product_quantity: ca.product_quantity != null ? Number(ca.product_quantity) : null,
        }))}
        opsEnabled={opsEnabled}
        products={(products ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          name_es: p.name_es,
          unit: p.unit,
          unit_price: Number(p.unit_price),
          stock_on_hand: Number(p.stock_on_hand),
        }))}
        clubId={club.id}
        clubSlug={clubSlug}
      />
    </div>
  );
}
