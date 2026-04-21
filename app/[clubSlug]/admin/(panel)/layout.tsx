import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { LogoutButton } from "../logout-button";
import { AdminNav } from "@/components/club/admin-nav";
import { PanicIconButton } from "@/components/club/panic-icon-button";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/lib/i18n/switcher";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}): Promise<Metadata> {
  const { clubSlug } = await params;
  const supabase = createAdminClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("name")
    .eq("slug", clubSlug)
    .single();

  return {
    title: club ? `Admin | ${club.name}` : "Club Admin",
    icons: {
      icon: "/favicon-admin.svg",
      apple: [{ url: `/${clubSlug}/icon.png`, sizes: "180x180" }],
    },
  };
}

export default async function AdminPanelLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, operations_module_enabled, locked_at")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();
  const opsEnabled = club.operations_module_enabled ?? false;
  const isLocked = club.locked_at !== null;

  const { data: branding } = await supabase
    .from("club_branding")
    .select("cover_url")
    .eq("club_id", club.id)
    .single();

  const coverUrl = branding?.cover_url ?? null;
  const locale = await getServerLocale();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div
        className={`relative px-6 pt-10 bg-cover bg-center ${coverUrl ? "pb-6" : "pb-20 bg-gradient-to-br from-gray-800 to-gray-900"}`}
        style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
      >
        {coverUrl && (
          <div className="absolute inset-0 bg-black/60" />
        )}
        <div className="relative flex items-start justify-between max-w-2xl mx-auto">
          <div className="min-w-0 flex items-center gap-3">
            <PanicIconButton
              clubId={club.id}
              clubSlug={clubSlug}
              locked={isLocked}
              actor="owner"
            />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-white truncate">{t(locale, "admin.title")}</h1>
              <p className="mt-1 text-gray-400 text-sm truncate">{club.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <LogoutButton clubSlug={clubSlug} />
          </div>
        </div>
        <div className="relative flex flex-wrap gap-2 mt-5 max-w-2xl mx-auto">
          <a
            href={`/${clubSlug}/staff`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/30 rounded-lg px-4 py-2 transition-colors backdrop-blur-sm"
          >
            {t(locale, "admin.staffConsole")} ↗
          </a>
          <a
            href={`/${clubSlug}/public`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/30 rounded-lg px-4 py-2 transition-colors backdrop-blur-sm"
          >
            {t(locale, "admin.publicPage")} ↗
          </a>
        </div>
      </div>

      <div className={`relative z-10 ${coverUrl ? "mt-4" : "-mt-12 bg-gray-50 rounded-t-3xl pt-6"}`}>
        <div className="px-4 pb-10 max-w-2xl mx-auto space-y-6">
          {isLocked && (
            <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
              <p className="font-semibold">{t(locale, "panic.lockedBanner")}</p>
              <p className="text-xs mt-1">{t(locale, "panic.lockedBannerHint")}</p>
            </div>
          )}
          {children}
        </div>
      </div>

      <AdminNav clubSlug={clubSlug} opsEnabled={opsEnabled} />
    </div>
  );
}
