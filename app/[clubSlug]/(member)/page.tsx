import { redirect } from "next/navigation";
import { getMemberFromCookie } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { QuestList } from "./quest-list";
import { MediaGallery } from "@/components/club/media-gallery";
import { MemberHero } from "@/components/club/member-hero";
import { BentoStatTile } from "@/components/club/bento-stat-tile";
import { AddToHomescreen } from "@/components/club/add-to-homescreen";
import { t, type Locale } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

function pickGreeting(locale: Locale, hasName: boolean): string {
  const hour = new Date().getHours();
  const slot =
    hour < 5 ? "Night" : hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : hour < 22 ? "Evening" : "Night";
  const key = `dashboard.greeting${slot}${hasName ? "" : "Anon"}`;
  return t(locale, key);
}

function daysUntil(dateStr: string): number {
  const target = new Date(`${dateStr}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatNextEventCaption(days: number, locale: Locale): string {
  if (days <= 0) return t(locale, "dashboard.today");
  if (days === 1) return t(locale, "dashboard.inDay");
  return t(locale, "dashboard.inDays", { days });
}

function formatValidity(
  validTill: string | null,
  locale: Locale,
): { label: string; className: string } {
  if (!validTill) {
    return {
      label: t(locale, "dashboard.validUnlimited"),
      className: "text-[color:var(--m-ink)]",
    };
  }
  const days = daysUntil(validTill);
  if (days < 0) {
    return {
      label: t(locale, "dashboard.expired"),
      className: "text-red-600",
    };
  }
  if (days === 0) {
    return {
      label: t(locale, "dashboard.today"),
      className: "text-amber-600",
    };
  }
  return {
    label: t(locale, "dashboard.validDays", { days }),
    className: days <= 14 ? "text-amber-600" : "text-[color:var(--m-ink)]",
  };
}

export default async function QuestsLanding({
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
  const todayIso = new Date().toISOString().slice(0, 10);

  const [
    { data: member },
    { data: club },
    { data: quests },
    { data: completedQuests },
    { data: galleryImages },
    { data: upcomingEvents },
  ] = await Promise.all([
    supabase
      .from("members")
      .select("full_name, member_code, valid_till, created_at")
      .eq("id", session.member_id)
      .single(),
    supabase
      .from("clubs")
      .select(
        "id, name, club_branding(logo_url, cover_url, social_instagram, social_whatsapp, social_telegram, social_google_maps, social_website)",
      )
      .eq("id", session.club_id)
      .single(),
    supabase
      .from("quests")
      .select(
        "id, title, description, title_es, description_es, link, image_url, icon, reward_spins, multi_use, quest_type, proof_mode, proof_placeholder, tutorial_steps, deadline, category",
      )
      .eq("club_id", session.club_id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("member_quests")
      .select("quest_id, status")
      .eq("member_id", session.member_id),
    supabase
      .from("club_gallery")
      .select("id, media_url, media_type, mime_type, caption")
      .eq("club_id", session.club_id)
      .order("display_order", { ascending: true }),
    supabase
      .from("events")
      .select("id, title, title_es, date, image_url")
      .eq("club_id", session.club_id)
      .eq("active", true)
      .gte("date", todayIso)
      .order("date", { ascending: true })
      .limit(1),
  ]);

  const locale = await getServerLocale();
  const firstName = member?.full_name ? member.full_name.split(" ")[0] : null;
  const clubName = club?.name ?? "";
  const branding = Array.isArray(club?.club_branding)
    ? club.club_branding[0]
    : club?.club_branding;

  const logoUrl = branding?.logo_url ?? null;
  const coverUrl = branding?.cover_url ?? null;
  const memberSinceYear = member?.created_at
    ? new Date(member.created_at).getFullYear()
    : new Date().getFullYear();
  const heroCaption = t(locale, "dashboard.memberSince", { year: memberSinceYear }) +
    (clubName ? ` · ${clubName.toUpperCase()}` : "");

  // Quest progress
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
  const totalQuests = activeQuests.length;
  const doneQuests = activeQuests.filter((q) => (questCompletionCounts[q.id] ?? 0) > 0).length;

  // Next event
  const nextEvent = upcomingEvents?.[0] ?? null;
  const nextEventTitle = nextEvent
    ? (locale === "es" && nextEvent.title_es ? nextEvent.title_es : nextEvent.title)
    : null;
  const nextEventDays = nextEvent ? daysUntil(nextEvent.date) : null;

  // Validity
  const validity = formatValidity(member?.valid_till ?? null, locale);

  return (
    <div className="min-h-screen" style={{ background: "var(--m-surface-sunken)" }}>
      <MemberHero
        displayName={firstName}
        greeting={pickGreeting(locale, !!firstName)}
        caption={heroCaption}
        coverUrl={coverUrl}
        logoUrl={logoUrl}
        clubName={clubName}
        social={{
          instagram: branding?.social_instagram,
          whatsapp: branding?.social_whatsapp,
          telegram: branding?.social_telegram,
          googleMaps: branding?.social_google_maps,
          website: branding?.social_website,
        }}
      />

      <div className="relative z-10 mx-auto -mt-6 max-w-md px-5">
        <div className="mb-4">
          <AddToHomescreen clubSlug={clubSlug} />
        </div>
        {/* Bento stat strip — two equal tiles to keep captions on one line */}
        <div className="grid grid-cols-2 gap-3">
          <BentoStatTile
            caption={t(locale, "dashboard.nextEvent")}
            value={
              nextEvent ? (
                <div className="flex flex-col gap-1">
                  <span className="m-headline line-clamp-2 text-[color:var(--m-ink)]">
                    {nextEventTitle}
                  </span>
                  {nextEventDays !== null && (
                    <span className="m-caption text-[color:var(--club-primary,#16a34a)]">
                      {formatNextEventCaption(nextEventDays, locale)}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-sm text-[color:var(--m-ink-muted)]">
                  {t(locale, "dashboard.noNextEvent")}
                </span>
              )
            }
            href={nextEvent ? `/${clubSlug}/events/${nextEvent.id}` : `/${clubSlug}/events`}
            imageUrl={nextEvent?.image_url ?? null}
            imageAlt={nextEventTitle ?? undefined}
          />
          <BentoStatTile
            caption={t(locale, "dashboard.membership")}
            value={
              <span className={`text-[13px] font-semibold leading-tight ${validity.className}`}>
                {validity.label}
              </span>
            }
            href={`/${clubSlug}/profile`}
          />
        </div>

        {/* Quests board — gamified zone, starts here */}
        {activeQuests.length > 0 && (
          <div className="mt-8">
            <div className="mb-3 flex items-baseline justify-between px-1">
              <h2 className="m-caption">{t(locale, "dashboard.yourQuests")}</h2>
              {totalQuests > 0 && (
                <span className="m-caption">
                  {t(locale, "dashboard.questProgress", {
                    done: doneQuests,
                    total: totalQuests,
                  })}
                </span>
              )}
            </div>
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

        {/* Gallery — split by media type */}
        {galleryImages && galleryImages.length > 0 && (() => {
          const photos = galleryImages.filter((g) => g.media_type === "image");
          const videos = galleryImages.filter((g) => g.media_type === "video");
          const audios = galleryImages.filter((g) => g.media_type === "audio");
          const sections: Array<{ key: string; label: string; items: typeof galleryImages }> = [
            { key: "photos", label: t(locale, "dashboard.photos"), items: photos },
            { key: "videos", label: t(locale, "dashboard.videos"), items: videos },
            { key: "audio", label: t(locale, "dashboard.audio"), items: audios },
          ];
          return (
            <div className="mt-8 pb-12 space-y-6">
              {sections
                .filter((s) => s.items.length > 0)
                .map((s) => (
                  <div key={s.key}>
                    <h2 className="m-caption mb-3 px-1">{s.label}</h2>
                    <MediaGallery
                      items={s.items.map((g) => ({
                        id: g.id,
                        media_url: g.media_url,
                        media_type: g.media_type,
                        mime_type: g.mime_type ?? null,
                        caption: g.caption,
                      }))}
                    />
                  </div>
                ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
