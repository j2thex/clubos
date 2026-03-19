import { redirect } from "next/navigation";
import { getMemberFromCookie } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { OfferListClient } from "./offer-list-client";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

export default async function OffersPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const session = await getMemberFromCookie();

  if (!session) {
    redirect(`/${clubSlug}/login`);
  }

  const supabase = createAdminClient();
  const locale = await getServerLocale();

  // Get club's enabled offers with catalog info
  const { data: offers } = await supabase
    .from("club_offers")
    .select("id, offer_id, orderable, price, display_order, description, description_es, image_url, icon, offer_catalog(id, name, name_es, subtype, icon)")
    .eq("club_id", session.club_id)
    .order("display_order", { ascending: true });

  // Get member's pending orders
  const { data: orders } = await supabase
    .from("offer_orders")
    .select("id, club_offer_id, status")
    .eq("member_id", session.member_id)
    .eq("status", "pending");

  const offerList = (offers ?? []).map((a) => {
    const catalog = Array.isArray(a.offer_catalog) ? a.offer_catalog[0] : a.offer_catalog;
    return {
      id: a.id,
      name: catalog?.name ?? "",
      name_es: catalog?.name_es ?? null,
      subtype: catalog?.subtype ?? "service",
      icon: catalog?.icon ?? null,
      club_icon: a.icon ?? null,
      description: a.description ?? null,
      description_es: a.description_es ?? null,
      image_url: a.image_url ?? null,
      orderable: a.orderable ?? false,
      price: a.price != null ? Number(a.price) : null,
      order: (orders ?? []).find((o) => o.club_offer_id === a.id) ?? null,
    };
  });

  return (
    <div className="min-h-screen club-page-bg">
      <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
        <h1 className="text-lg font-bold text-white mb-4">{t(locale, "nav.offers")}</h1>
        <OfferListClient offers={offerList} memberId={session.member_id} clubSlug={clubSlug} />
      </div>
    </div>
  );
}
