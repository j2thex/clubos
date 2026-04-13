import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffFromCookie } from "@/lib/auth";
import { notFound } from "next/navigation";
import { StaffOfferClient } from "../../offers/staff-offer-client";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

export default async function StaffOffersPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();
  const session = await getStaffFromCookie();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  // Get orderable offers for this club
  const { data: offers } = await supabase
    .from("club_offers")
    .select(
      "id, orderable, price, description, description_es, image_url, icon, offer_catalog(id, name, name_es, subtype, icon)",
    )
    .eq("club_id", club.id)
    .eq("orderable", true)
    .eq("archived", false)
    .order("display_order", { ascending: true });

  const offerList = (offers ?? []).map((a) => {
    const catalog = Array.isArray(a.offer_catalog) ? a.offer_catalog[0] : a.offer_catalog;
    return {
      id: a.id,
      title: catalog?.name ?? "",
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
    };
  });

  const locale = await getServerLocale();

  if (offerList.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-900">{t(locale, "staff.noOffers")}</p>
        <p className="text-xs text-gray-400 mt-1">{t(locale, "staff.offersFromAdmin")}</p>
      </div>
    );
  }

  // Fetch all orders across all offers
  const offerIds = offerList.map((a) => a.id);
  const { data: allOrders } = await supabase
    .from("offer_orders")
    .select("id, status, created_at, fulfilled_at, member_id, fulfilled_by, club_offer_id")
    .in("club_offer_id", offerIds)
    .order("created_at", { ascending: false })
    .limit(100);

  // Build offer title map
  const offerTitleMap = new Map(offerList.map((a) => [a.id, a.title]));

  // Fetch member info
  const memberIds = [
    ...new Set([
      ...(allOrders ?? []).map((o) => o.member_id),
      ...(allOrders ?? []).filter((o) => o.fulfilled_by).map((o) => o.fulfilled_by!),
    ]),
  ];

  const { data: members } = await supabase
    .from("members")
    .select("id, member_code, full_name")
    .in("id", memberIds.length > 0 ? memberIds : ["__none__"]);

  const memberMap = new Map(
    (members ?? []).map((m) => [m.id, { code: m.member_code, name: m.full_name }]),
  );

  const enrichedOrders = (allOrders ?? []).map((o) => ({
    id: o.id,
    status: o.status,
    created_at: o.created_at,
    fulfilled_at: o.fulfilled_at,
    member_code: memberMap.get(o.member_id)?.code ?? "???",
    member_name: memberMap.get(o.member_id)?.name ?? "",
    fulfilled_by_name: o.fulfilled_by
      ? memberMap.get(o.fulfilled_by)?.name || memberMap.get(o.fulfilled_by)?.code || ""
      : null,
    offer_title: offerTitleMap.get(o.club_offer_id) ?? "",
  }));

  return (
    <StaffOfferClient
      offers={offerList}
      initialOrders={enrichedOrders}
      clubId={club.id}
      clubSlug={clubSlug}
      staffMemberId={session?.member_id ?? ""}
    />
  );
}
