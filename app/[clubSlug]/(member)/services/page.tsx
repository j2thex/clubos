import { redirect } from "next/navigation";
import { getMemberFromCookie } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ServiceListClient } from "./service-list-client";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

export default async function ServicesPage({
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

  const [{ data: services }, { data: orders }, { data: branding }] = await Promise.all([
    supabase
      .from("services")
      .select("id, title, description, title_es, description_es, image_url, link, price")
      .eq("club_id", session.club_id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("service_orders")
      .select("id, service_id, status")
      .eq("member_id", session.member_id),
    supabase
      .from("club_branding")
      .select("logo_url")
      .eq("club_id", session.club_id)
      .single(),
  ]);

  const logoUrl = branding?.logo_url ?? null;
  const locale = await getServerLocale();

  const list = (services ?? []).map((s) => ({
    ...s,
    price: s.price != null ? Number(s.price) : null,
    order: (orders ?? []).find(
      (o) => o.service_id === s.id && o.status === "pending",
    ) ?? null,
    fulfilled_count: (orders ?? []).filter(
      (o) => o.service_id === s.id && o.status === "fulfilled",
    ).length,
  }));

  return (
    <div className="min-h-screen club-page-bg">
      <div className="club-hero px-6 pt-10 pb-12 text-center">
        {logoUrl && (
          <img src={logoUrl} alt="Club logo" className="w-10 h-10 rounded-lg object-cover mx-auto mb-2 shadow ring-2 ring-white/20" />
        )}
        <h1 className="text-2xl font-bold text-white">{t(locale, "services.title")}</h1>
        <p className="mt-1 club-light-text text-sm">{t(locale, "services.subtitle")}</p>
      </div>

      <div className="px-4 -mt-6 pb-10 max-w-md mx-auto space-y-3">
        {list.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full club-tint-bg flex items-center justify-center">
              <svg className="w-8 h-8 club-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <p className="text-gray-700 font-semibold text-lg">{t(locale, "services.noServices")}</p>
            <p className="text-gray-400 text-sm mt-1">
              {t(locale, "services.availableSoon")}
            </p>
          </div>
        ) : (
          <ServiceListClient
            services={list}
            memberId={session.member_id}
            clubSlug={clubSlug}
          />
        )}
      </div>
    </div>
  );
}
