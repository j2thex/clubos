import { redirect } from "next/navigation";
import { getMemberFromCookie } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { QuestList } from "./quest-list";
import { SocialLinks } from "@/components/club/social-links";
import { PhotoGallery } from "@/components/club/photo-gallery";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

export default async function MemberDashboard({
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

  const [{ data: member }, { data: club }, { data: quests }, { data: completedQuests }, { data: galleryImages }] = await Promise.all([
    supabase
      .from("members")
      .select("full_name, spin_balance, member_code")
      .eq("id", session.member_id)
      .single(),
    supabase
      .from("clubs")
      .select("id, name, club_branding(logo_url, cover_url, hero_content, social_instagram, social_whatsapp, social_telegram, social_google_maps, social_website)")
      .eq("id", session.club_id)
      .single(),
    supabase
      .from("quests")
      .select("id, title, description, title_es, description_es, link, image_url, icon, reward_spins, multi_use, quest_type, proof_mode, proof_placeholder, tutorial_steps, deadline, category")
      .eq("club_id", session.club_id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("member_quests")
      .select("quest_id, status")
      .eq("member_id", session.member_id),
    supabase
      .from("club_gallery")
      .select("id, image_url, caption")
      .eq("club_id", session.club_id)
      .order("display_order", { ascending: true }),
  ]);

  const locale = await getServerLocale();
  const displayName = member?.full_name || "Member";
  const clubName = club?.name ?? "";
  const branding = Array.isArray(club?.club_branding)
    ? club.club_branding[0]
    : club?.club_branding;
  const logoUrl = branding?.logo_url ?? null;
  const coverUrl = branding?.cover_url ?? null;
  const heroContent = branding?.hero_content ?? null;

  // Count verified completions per quest, track pending ones
  const questCompletionCounts: Record<string, number> = {};
  const pendingQuestIds: string[] = [];
  for (const c of completedQuests ?? []) {
    if (c.status === "pending") {
      if (!pendingQuestIds.includes(c.quest_id)) pendingQuestIds.push(c.quest_id);
    } else {
      questCompletionCounts[c.quest_id] = (questCompletionCounts[c.quest_id] ?? 0) + 1;
    }
  }
  const activeQuests = quests ?? [];

  return (
    <div className="min-h-screen club-page-bg">
      {/* Hero area */}
      <div
        className="relative px-6 pt-10 pb-16 text-center bg-cover bg-center overflow-hidden"
        style={
          coverUrl
            ? { backgroundImage: `url(${coverUrl})` }
            : undefined
        }
      >
        {/* Gradient overlay — always present for text readability */}
        <div className={`absolute inset-0 ${coverUrl ? "bg-black/50" : "club-hero"}`} />
        <div className="relative">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={`${clubName} logo`}
              className="w-14 h-14 rounded-xl object-cover mx-auto mb-3 shadow-lg ring-2 ring-white/20"
            />
          )}
          {clubName && (
            <p className={`text-sm font-medium tracking-wide uppercase mb-2 ${coverUrl ? "text-white/70" : "club-light-text"}`}>
              {clubName}
            </p>
          )}
          <h1 className="text-2xl font-bold text-white">
            {heroContent ? heroContent.replace("{name}", displayName) : `Welcome back, ${displayName}`}
          </h1>
          {(branding?.social_instagram || branding?.social_whatsapp || branding?.social_telegram || branding?.social_google_maps || branding?.social_website) && (
            <div className="mt-4 flex justify-center">
              <SocialLinks
                instagram={branding?.social_instagram}
                whatsapp={branding?.social_whatsapp}
                telegram={branding?.social_telegram}
                googleMaps={branding?.social_google_maps}
                website={branding?.social_website}
                variant="light"
              />
            </div>
          )}
        </div>
      </div>

      {/* Content cards */}
      <div className="relative z-10 px-4 -mt-8 pb-10 max-w-md mx-auto space-y-4">
        {/* Quests */}
        {activeQuests.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide px-1">
              {t(locale, "dashboard.quests")}
            </h2>
            <QuestList
              quests={activeQuests}
              completionCounts={questCompletionCounts}
              pendingQuestIds={pendingQuestIds}
              memberId={session.member_id}
              memberCode={member?.member_code ?? ""}
              clubId={session.club_id}
              clubName={clubName}
              clubSlug={clubSlug}
              locale={locale}
            />
          </div>
        )}

        {/* Gallery */}
        {galleryImages && galleryImages.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide px-1">
              {t(locale, "dashboard.gallery")}
            </h2>
            <PhotoGallery
              images={galleryImages.map((g) => ({
                id: g.id,
                image_url: g.image_url,
                caption: g.caption,
              }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
