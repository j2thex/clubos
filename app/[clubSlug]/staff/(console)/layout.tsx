import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/lib/i18n/switcher";
import { StaffLogoutButton } from "@/components/club/staff-logout-button";
import { PanicIconButton } from "@/components/club/panic-icon-button";

export default async function StaffConsoleLayout({
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
    .select("id, name")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();
  const locale = await getServerLocale();

  const { data: branding } = await supabase
    .from("club_branding")
    .select("cover_url")
    .eq("club_id", club.id)
    .single();

  const coverUrl = branding?.cover_url ?? null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className={`relative px-6 pt-10 bg-cover bg-center ${coverUrl ? "pb-6" : "pb-20 bg-gradient-to-br from-gray-800 to-gray-900"}`}
        style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
      >
        {coverUrl && (
          <div className="absolute inset-0 bg-black/60" />
        )}
        <div className="relative max-w-2xl mx-auto">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex items-center gap-3">
              <PanicIconButton
                clubId={club.id}
                clubSlug={clubSlug}
                actor="staff"
              />
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-white truncate">{t(locale, "staff.consoleTitle")}</h1>
                <p className="mt-1 text-gray-400 text-sm truncate">{club.name}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <a
              href={`/${clubSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-white border border-gray-600 rounded-lg px-3 py-1.5 transition-colors"
            >
              {t(locale, "staff.memberPortal")}
            </a>
            <a
              href={`/${clubSlug}/public`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-white border border-gray-600 rounded-lg px-3 py-1.5 transition-colors"
            >
              {t(locale, "staff.publicPage")}
            </a>
            <LanguageSwitcher variant="light" />
            <StaffLogoutButton clubSlug={clubSlug} />
          </div>
        </div>
      </div>
      <div className={`relative z-10 ${coverUrl ? "mt-4" : "-mt-12 bg-gray-50 rounded-t-3xl pt-6"}`}>
        <div className="px-4 pb-10 max-w-2xl mx-auto space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}
