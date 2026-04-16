import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

export default async function ContentPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();
  const locale = await getServerLocale();

  const [{ count: eventCount }, { count: questCount }, { count: offerCount }] =
    await Promise.all([
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("club_id", club.id)
        .eq("active", true),
      supabase
        .from("quests")
        .select("id", { count: "exact", head: true })
        .eq("club_id", club.id)
        .eq("active", true),
      supabase
        .from("club_offers")
        .select("id", { count: "exact", head: true })
        .eq("club_id", club.id),
    ]);

  const items = [
    {
      label: t(locale, "admin.contentQuests"),
      href: `/${clubSlug}/admin/quests`,
      count: questCount ?? 0,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
    },
    {
      label: t(locale, "admin.contentEvents"),
      href: `/${clubSlug}/admin/events`,
      count: eventCount ?? 0,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: t(locale, "admin.contentOffers"),
      href: `/${clubSlug}/admin/offers`,
      count: offerCount ?? 0,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
  ];

  const isEmpty = (questCount ?? 0) + (eventCount ?? 0) + (offerCount ?? 0) === 0;

  return (
    <div className="space-y-3">
      {/* AI setup wizard — prominent when content is empty, compact otherwise */}
      <Link
        href={`/${clubSlug}/admin/setup`}
        className={`flex items-center gap-4 rounded-2xl shadow-lg px-5 py-4 transition-colors ${
          isEmpty
            ? "bg-gradient-to-r from-emerald-50 via-sky-50 to-indigo-50 hover:from-emerald-100 hover:via-sky-100 hover:to-indigo-100 border border-emerald-100"
            : "bg-white hover:bg-gray-50"
        }`}
      >
        <div className="text-2xl">✨</div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">AI setup wizard</p>
          <p className="text-xs text-gray-500">
            {isEmpty
              ? "Describe your club and we'll draft a starter kit of quests and events in seconds"
              : "Generate more quests and events from a single prompt"}
          </p>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>

      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="flex items-center gap-4 bg-white rounded-2xl shadow-lg px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="text-gray-400">{item.icon}</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{item.label}</p>
            <p className="text-xs text-gray-400">
              {t(locale, "admin.activeCount", { count: item.count })}
            </p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      ))}
    </div>
  );
}
