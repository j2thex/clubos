import { redirect } from "next/navigation";
import { getMemberFromCookie } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AmenityListClient } from "./amenity-list-client";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

export default async function AmenitiesPage({
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

  // Get club's enabled amenities with catalog info
  const { data: amenities } = await supabase
    .from("club_amenities")
    .select("id, amenity_id, orderable, price, display_order, amenity_catalog(id, name, name_es, subtype, icon)")
    .eq("club_id", session.club_id)
    .order("display_order", { ascending: true });

  // Get member's pending orders
  const { data: orders } = await supabase
    .from("amenity_orders")
    .select("id, club_amenity_id, status")
    .eq("member_id", session.member_id)
    .eq("status", "pending");

  const amenityList = (amenities ?? []).map((a) => {
    const catalog = Array.isArray(a.amenity_catalog) ? a.amenity_catalog[0] : a.amenity_catalog;
    return {
      id: a.id,
      name: catalog?.name ?? "",
      name_es: catalog?.name_es ?? null,
      subtype: catalog?.subtype ?? "service",
      icon: catalog?.icon ?? null,
      orderable: a.orderable ?? false,
      price: a.price != null ? Number(a.price) : null,
      order: (orders ?? []).find((o) => o.club_amenity_id === a.id) ?? null,
    };
  });

  return (
    <div className="min-h-screen club-page-bg">
      <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
        <h1 className="text-lg font-bold text-white mb-4">{t(locale, "nav.amenities")}</h1>
        <AmenityListClient amenities={amenityList} memberId={session.member_id} clubSlug={clubSlug} />
      </div>
    </div>
  );
}
