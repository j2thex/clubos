import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/lib/i18n/switcher";
import { StaffLogoutButton } from "@/components/club/staff-logout-button";
import { PanicIconButton } from "@/components/club/panic-icon-button";
import { StaffTopBar } from "@/components/club/staff-top-bar";
import { getStaffFromCookie } from "@/lib/auth";

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
    .select("id, name, spin_enabled, operations_module_enabled, nav_position")
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
  const navPosition: "bottom" | "top" = club.nav_position === "top" ? "top" : "bottom";

  if (navPosition === "top") {
    // Pending counts + QEBO permission for the top-bar variant.
    // Same fail-soft semantics as the parent /staff/layout.tsx.
    let pendingBadges: Record<string, number> = {};
    const [{ count: preregCount }, { count: offerCount }, { count: questCount }] =
      await Promise.all([
        supabase
          .from("preregistrations")
          .select("id", { count: "exact", head: true })
          .eq("club_id", club.id)
          .eq("status", "pending"),
        supabase
          .from("offer_orders")
          .select("id, club_offers!inner(club_id)", { count: "exact", head: true })
          .eq("club_offers.club_id", club.id)
          .eq("status", "pending"),
        supabase
          .from("member_quests")
          .select("id, quests!inner(club_id)", { count: "exact", head: true })
          .eq("quests.club_id", club.id)
          .eq("status", "pending"),
      ]);
    pendingBadges = {
      "/preregistrations": preregCount ?? 0,
      "/offers": offerCount ?? 0,
      "/quests": questCount ?? 0,
    };

    let qeboEnabled = true;
    const staffSession = await getStaffFromCookie();
    if (staffSession?.member_id) {
      const { data: staffRow } = await supabase
        .from("members")
        .select("can_do_qebo")
        .eq("id", staffSession.member_id)
        .single();
      qeboEnabled = staffRow?.can_do_qebo ?? true;
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <StaffTopBar
          clubId={club.id}
          clubName={club.name}
          clubSlug={clubSlug}
          coverUrl={coverUrl}
          spinEnabled={club.spin_enabled ?? false}
          operationsEnabled={club.operations_module_enabled ?? false}
          qeboEnabled={qeboEnabled}
          badges={pendingBadges}
        />
        <div className="px-4 pt-6 pb-10 max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className={`relative px-6 pt-10 bg-cover bg-center ${coverUrl ? "pb-6" : "pb-20 bg-gradient-to-br from-gray-800 to-gray-900"}`}
        style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
      >
        {coverUrl && (
          <div className="absolute inset-0 bg-black/60" />
        )}
        <div className="relative max-w-7xl mx-auto">
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
        <div className="px-4 pb-10 max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}
