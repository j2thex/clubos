import { createAdminClient } from "@/lib/supabase/admin";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function ClubOfflinePage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("name, club_branding(logo_url)")
    .eq("slug", clubSlug)
    .maybeSingle();

  const locale = await getServerLocale();
  const branding = club ? (Array.isArray(club.club_branding) ? club.club_branding[0] : club.club_branding) : null;
  const logoUrl = branding?.logo_url ?? null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-4">
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="w-16 h-16 mx-auto rounded-xl object-cover"
          />
        )}
        {club?.name && (
          <p className="text-sm text-gray-500">{club.name}</p>
        )}
        <h1 className="text-xl font-semibold text-gray-900">
          {t(locale, "offline.title")}
        </h1>
        <p className="text-sm text-gray-600">{t(locale, "offline.body")}</p>
      </div>
    </div>
  );
}
