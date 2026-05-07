import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { SocialLinks } from "@/components/club/social-links";
import { MediaGallery } from "@/components/club/media-gallery";
import { InviteForm } from "./invite-form";
import { PreregistrationForm } from "./preregistration-form";
import { InviteSocialButtons } from "./invite-social-buttons";
import { PublicLoginForm } from "./public-login-form";
import { getTagLabel } from "@/lib/tags";
import { localized } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { DynamicIcon } from "@/components/dynamic-icon";
import { LanguageSwitcher } from "@/lib/i18n/switcher";
import { PublicEventsClient } from "./public-events-client";
import {
  getClubJsonLd,
  getEventJsonLd,
  getOfferCatalogJsonLd,
  getBreadcrumbListJsonLd,
} from "@/lib/structured-data";
import { MembersOnlyTeaser } from "@/components/club/members-only-teaser";
import { WorkingHoursDisplay } from "@/components/club/working-hours-display";
import { PublicQuestCard } from "./public-quest-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}): Promise<Metadata> {
  const { clubSlug } = await params;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("name, tags, city, country, club_branding(logo_url)")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) return { title: "Club" };

  const branding = Array.isArray(club.club_branding)
    ? club.club_branding[0]
    : club.club_branding;
  const tags = (club.tags as string[] | null) ?? [];
  const cityCountry = [club.city, club.country].filter(Boolean).join(", ");
  const tagPart = tags.length > 0 ? ` ${tags.join(", ")}.` : "";
  const description = cityCountry
    ? `${club.name} — private club in ${cityCountry}.${tagPart} Member portal on osocios.club.`
    : `${club.name} — member portal on osocios.club.${tagPart}`;

  return {
    title: club.name,
    description,
    keywords: tags,
    openGraph: {
      title: club.name,
      description,
      locale: "en_US",
      alternateLocale: ["es_ES"],
      ...(branding?.logo_url && { images: [branding.logo_url] }),
    },
    alternates: {
      canonical: `/${clubSlug}/public`,
      languages: {
        en: `/${clubSlug}/public`,
        es: `/${clubSlug}/public`,
        "x-default": `/${clubSlug}/public`,
      },
    },
    icons: {
      icon: [{ url: `/${clubSlug}/icon.png`, type: "image/png" }],
      apple: [{ url: `/${clubSlug}/icon.png`, sizes: "180x180" }],
    },
  };
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { clubSlug } = await params;
  const { ref: referrerCode } = await searchParams;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, approved, visibility, invite_only, invite_mode, login_mode, hide_member_login, preregistration_enabled, tags, working_hours, timezone, address, city, country, latitude, longitude, club_branding(logo_url, cover_url, primary_color, secondary_color, social_instagram, social_whatsapp, social_telegram, social_google_maps, social_website)")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  if (club.visibility === "private") notFound();

  if (!club.approved) {
    const { PendingApproval } = await import("@/components/pending-approval");
    return <PendingApproval clubName={club.name} clubSlug={clubSlug} />;
  }

  const locale = await getServerLocale();

  const branding = Array.isArray(club.club_branding)
    ? club.club_branding[0]
    : club.club_branding;

  const [{ data: events }, { data: quests }, { data: offers }, { data: galleryImages }, { data: inviteButtons }, { count: hiddenQuestsCount }, { count: hiddenEventsCount }, { count: hiddenOffersCount }] =
    await Promise.all([
      supabase
        .from("events")
        .select("id, title, description, title_es, description_es, date, time, price, image_url, link, reward_spins")
        .eq("club_id", club.id)
        .eq("active", true)
        .eq("is_public", true)
        .order("date", { ascending: true }),
      supabase
        .from("quests")
        .select("id, title, description, title_es, description_es, image_url, link, reward_spins, category")
        .eq("club_id", club.id)
        .eq("active", true)
        .eq("is_public", true)
        .order("display_order", { ascending: true }),
      supabase
        .from("club_offers")
        .select("id, description, description_es, image_url, icon, is_public, offer_catalog(name, name_es, subtype, icon)")
        .eq("club_id", club.id)
        .eq("is_public", true)
        .eq("archived", false)
        .order("created_at", { ascending: true }),
      supabase
        .from("club_gallery")
        .select("id, media_url, media_type, mime_type, caption")
        .eq("club_id", club.id)
        .order("display_order", { ascending: true }),
      supabase
        .from("club_invite_buttons")
        .select("type, label, url, icon_url")
        .eq("club_id", club.id)
        .order("display_order", { ascending: true }),
      // Hidden counts for teaser badges
      supabase
        .from("quests")
        .select("id", { count: "exact", head: true })
        .eq("club_id", club.id)
        .eq("active", true)
        .eq("is_public", false),
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("club_id", club.id)
        .eq("active", true)
        .eq("is_public", false),
      supabase
        .from("club_offers")
        .select("id", { count: "exact", head: true })
        .eq("club_id", club.id)
        .eq("is_public", false)
        .eq("archived", false),
    ]);

  const hasEvents = events && events.length > 0;
  const hasQuests = quests && quests.length > 0;
  const hasOffers = offers && offers.length > 0;

  // Group offers by subtype for display
  const offersBySubtype: Record<string, { id: string; name: string; name_es: string | null; icon: string | null; club_icon: string | null; description: string | null; description_es: string | null; image_url: string | null }[]> = {};
  if (hasOffers) {
    for (const a of offers) {
      const catalog = Array.isArray(a.offer_catalog) ? a.offer_catalog[0] : a.offer_catalog;
      const subtype = catalog?.subtype ?? "other";
      const name = catalog?.name ?? "";
      const nameEs = catalog?.name_es ?? null;
      const icon = catalog?.icon ?? null;
      if (!offersBySubtype[subtype]) offersBySubtype[subtype] = [];
      offersBySubtype[subtype].push({
        id: a.id,
        name,
        name_es: nameEs,
        icon,
        club_icon: a.icon ?? null,
        description: a.description ?? null,
        description_es: a.description_es ?? null,
        image_url: a.image_url ?? null,
      });
    }
  }

  const clubJsonLd = getClubJsonLd({
    name: club.name,
    slug: clubSlug,
    logo_url: branding?.logo_url,
    tags: club.tags as string[] | null,
    address: club.address,
    city: club.city,
    country: club.country,
    latitude: club.latitude,
    longitude: club.longitude,
    working_hours: club.working_hours as Parameters<typeof getClubJsonLd>[0]["working_hours"],
    social_instagram: branding?.social_instagram,
    social_telegram: branding?.social_telegram,
    social_google_maps: branding?.social_google_maps,
    social_website: branding?.social_website,
  });

  const eventClubContext = {
    name: club.name,
    slug: clubSlug,
    timezone: club.timezone,
    address: club.address,
    city: club.city,
    country: club.country,
  };

  const eventJsonLdItems = (events ?? []).map((ev) =>
    getEventJsonLd(
      {
        id: ev.id,
        title: ev.title,
        description: ev.description,
        date: ev.date,
        time: ev.time,
        price: ev.price != null ? Number(ev.price) : null,
        image_url: ev.image_url,
        link: ev.link,
      },
      eventClubContext,
    ),
  );

  const offerCatalogJsonLd = hasOffers
    ? getOfferCatalogJsonLd(
        { name: club.name, slug: clubSlug },
        Object.values(offersBySubtype)
          .flat()
          .map((o) => ({
            id: o.id,
            name: o.name,
            description: o.description,
            image_url: o.image_url,
          })),
      )
    : null;

  const breadcrumbJsonLd = getBreadcrumbListJsonLd([
    { name: "Home", url: "https://osocios.club/" },
    { name: "Discover", url: "https://osocios.club/discover" },
    { name: club.name, url: `https://osocios.club/${clubSlug}/public` },
  ]);

  return (
    <div className="clubos-ui min-h-screen" style={{ background: "var(--m-surface-sunken)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(clubJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {eventJsonLdItems.map((ev, i) => (
        <script
          key={`event-jsonld-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ev) }}
        />
      ))}
      {offerCatalogJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(offerCatalogJsonLd) }}
        />
      )}
      {/* Editorial hero — photo-forward with gradient fallback for clubs without a cover */}
      <section className="relative h-[300px] w-full overflow-hidden">
        {branding?.cover_url ? (
          <Image
            src={branding.cover_url}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 club-hero" aria-hidden />
        )}
        {/* Dark gradient for editorial legibility */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.30) 45%, rgba(0,0,0,0.80) 100%)",
          }}
        />

        {/* Top row — discover back button (left) + language switcher (right) */}
        <div
          className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
        >
          <Link
            href="/discover"
            className="inline-flex min-h-[40px] items-center gap-1 rounded-[var(--m-radius-sm)] bg-black/35 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/50"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Discover
          </Link>
          <div className="flex items-center gap-2">
            {!(club.invite_only && club.hide_member_login) && (
              <a
                href="#member-login"
                className="inline-flex min-h-[40px] items-center gap-1 rounded-[var(--m-radius-sm)] bg-white/95 px-3 py-2 text-xs font-semibold text-gray-900 backdrop-blur-sm transition-colors hover:bg-white"
              >
                {localized("Member Login", "Acceso Socios", locale)}
              </a>
            )}
            <LanguageSwitcher variant="light" />
          </div>
        </div>

        {/* Bottom — logo + caption + display title + tags + social */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-6">
          <div className="flex items-end gap-4">
            {branding?.logo_url && (
              <Image
                src={branding.logo_url}
                alt={club.name}
                width={56}
                height={56}
                sizes="56px"
                className="h-14 w-14 shrink-0 rounded-[var(--m-radius-sm)] border border-white/30 object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <p
                className="text-[11px] font-semibold uppercase leading-none text-white/85"
                style={{ letterSpacing: "0.08em" }}
              >
                CLUB
              </p>
              <h1 className="m-display mt-1.5 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">
                {club.name}
              </h1>
            </div>
          </div>
          {club.tags && club.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {club.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="inline-flex rounded-[var(--m-radius-xs)] bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/95 backdrop-blur-sm"
                >
                  {getTagLabel(tag, locale)}
                </span>
              ))}
            </div>
          )}
          {(branding?.social_instagram ||
            branding?.social_whatsapp ||
            branding?.social_telegram ||
            branding?.social_google_maps ||
            branding?.social_website) && (
            <div className="mt-3">
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
      </section>

      <div className="relative z-10 mx-auto max-w-lg space-y-6 px-5 pb-12 pt-6">
        {/* Gallery — split by media type */}
        {galleryImages && galleryImages.length > 0 && (() => {
          const photos = galleryImages.filter((g) => g.media_type === "image");
          const videos = galleryImages.filter((g) => g.media_type === "video");
          const audios = galleryImages.filter((g) => g.media_type === "audio");
          const sections: Array<{ key: string; label: string; items: typeof galleryImages }> = [
            { key: "photos", label: localized("Photos", "Fotos", locale), items: photos },
            { key: "videos", label: localized("Videos", "Videos", locale), items: videos },
            { key: "audio", label: localized("Audio", "Audio", locale), items: audios },
          ];
          return (
            <div className="space-y-6">
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

        {/* Working Hours */}
        {club.working_hours && (
          <WorkingHoursDisplay
            workingHours={club.working_hours as Record<string, { open: string; close: string } | null>}
            timezone={club.timezone ?? "UTC"}
            locale={locale}
          />
        )}

        {/* Referral banner (non-invite-only clubs) */}
        {referrerCode && !club.invite_only && (
          <div className="m-card border-amber-200 bg-amber-50 p-4 text-center">
            <p className="text-sm font-semibold text-amber-800">
              {localized(
                `Mention referral code ${referrerCode} when you sign up!`,
                `¡Menciona el código de referencia ${referrerCode} al registrarte!`,
                locale,
              )}
            </p>
          </div>
        )}

        {/* Member Login — inline form */}
        {!(club.invite_only && club.hide_member_login) && (
          <div id="member-login" className="m-card p-5 scroll-mt-20">
            <p className="m-caption mb-1 text-center">
              {localized("Have a member code?", "¿Tienes un código de socio?", locale)}
            </p>
            <p className="mb-3 text-center text-xs text-[color:var(--m-ink-muted)]">
              {localized(
                "Enter it below to access your portal",
                "Ingrésalo abajo para acceder a tu portal",
                locale,
              )}
            </p>
            <PublicLoginForm loginMode={club.login_mode ?? "code_only"} clubSlug={clubSlug} />
          </div>
        )}

        {/* Pre-Registration */}
        {club.preregistration_enabled && (
          <PreregistrationForm clubId={club.id} clubName={club.name} />
        )}

        {/* Quests */}
        {(hasQuests || club.invite_only) && (
          <div>
            <h2 className="m-caption mb-3 px-1">
              {localized("Quests", "Misiones", locale)}
            </h2>
            <div className="space-y-3">
              {/* Invite quest card */}
              {club.invite_only && (club.invite_mode === "social" && inviteButtons && inviteButtons.length > 0 ? (
                <InviteSocialButtons buttons={inviteButtons.map((b) => ({
                  type: b.type,
                  label: b.label ?? null,
                  url: b.url,
                  icon_url: b.icon_url ?? null,
                }))} />
              ) : (
                <InviteForm clubId={club.id} clubName={club.name} referrerCode={referrerCode} />
              ))}
              {/* Referral banner for social-mode invite clubs */}
              {club.invite_only && club.invite_mode === "social" && referrerCode && (
                <div className="m-card border-amber-200 bg-amber-50 p-4 text-center">
                  <p className="text-sm font-semibold text-amber-800">
                    {localized(
                      `Mention referral code ${referrerCode} when you sign up!`,
                      `¡Menciona el código de referencia ${referrerCode} al registrarte!`,
                      locale,
                    )}
                  </p>
                </div>
              )}
              {(() => {
                const questList = quests ?? [];
                const catOrder = ["social", "activity", "boost", "level_up"];
                const catLabels: Record<string, { en: string; es: string }> = {
                  social: { en: "Social", es: "Social" },
                  activity: { en: "Activities", es: "Actividades" },
                  boost: { en: "Boost", es: "Boost" },
                  level_up: { en: "Level Up", es: "Sube de Nivel" },
                };
                const groups: Record<string, typeof questList> = {};
                for (const q of questList) {
                  const key = q.category || "social";
                  if (!groups[key]) groups[key] = [];
                  groups[key].push(q);
                }
                const sortedKeys = Object.keys(groups).sort(
                  (a, b) => (catOrder.indexOf(a) === -1 ? 99 : catOrder.indexOf(a)) - (catOrder.indexOf(b) === -1 ? 99 : catOrder.indexOf(b)),
                );
                const multiCat = sortedKeys.length > 1;
                return sortedKeys.map((cat) => (
                  <div key={cat} className="space-y-3">
                    {multiCat && (
                      <h3 className="m-caption px-1">
                        {locale === "es" ? (catLabels[cat]?.es ?? cat) : (catLabels[cat]?.en ?? cat)}
                      </h3>
                    )}
                    {groups[cat].map((q) => (
                      <PublicQuestCard
                        key={q.id}
                        quest={{
                          id: q.id,
                          title: q.title,
                          description: q.description,
                          title_es: q.title_es,
                          description_es: q.description_es,
                          image_url: q.image_url,
                          link: q.link,
                          reward_spins: q.reward_spins,
                        }}
                        clubSlug={clubSlug}
                      />
                    ))}
                  </div>
                ));
              })()}
              <MembersOnlyTeaser count={hiddenQuestsCount ?? 0} locale={locale} />
            </div>
          </div>
        )}

        {/* Events */}
        {hasEvents && (
          <div>
            <h2 className="m-caption mb-3 px-1">
              {localized("Upcoming Events", "Próximos Eventos", locale)}
            </h2>
            <PublicEventsClient
              events={(events ?? []).map((ev) => ({
                id: ev.id,
                title: ev.title,
                description: ev.description,
                title_es: ev.title_es,
                description_es: ev.description_es,
                date: ev.date,
                time: ev.time,
                price: ev.price != null ? Number(ev.price) : null,
                image_url: ev.image_url,
                link: ev.link,
                reward_spins: ev.reward_spins,
              }))}
              clubSlug={clubSlug}
            />
            <MembersOnlyTeaser count={hiddenEventsCount ?? 0} locale={locale} />
          </div>
        )}

        {/* Offers */}
        {hasOffers && (
          <div>
            <h2 className="m-caption mb-3 px-1">
              {localized("Offers", "Ofertas", locale)}
            </h2>
            <div className="space-y-5">
              {Object.entries(offersBySubtype).map(([subtype, items]) => (
                <div key={subtype} className="space-y-2">
                  <p className="m-caption px-1">{subtype}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {items.map((item) => {
                      const displayIcon = item.club_icon || item.icon;
                      return (
                        <div
                          key={item.id}
                          className="m-card relative flex min-h-[112px] flex-col overflow-hidden"
                        >
                          <div
                            className="relative h-16 w-full"
                            style={{ background: "var(--m-surface-sunken)" }}
                          >
                            {item.image_url ? (
                              <Image
                                src={item.image_url}
                                alt=""
                                fill
                                sizes="(max-width: 640px) 50vw, 33vw"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[color:var(--m-ink-muted)]">
                                {displayIcon ? (
                                  <DynamicIcon name={displayIcon} className="h-6 w-6" />
                                ) : (
                                  <span className="text-lg">+</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-1 items-center p-2">
                            <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-[color:var(--m-ink)]">
                              {localized(item.name, item.name_es, locale)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <MembersOnlyTeaser count={hiddenOffersCount ?? 0} locale={locale} />
          </div>
        )}

        {/* Footer */}
        <div className="space-y-1 pt-4 text-center text-xs text-[color:var(--m-ink-muted)]">
          <p>
            © {new Date().getFullYear()} {club.name} · Powered by osocios
          </p>
          <p>
            <a
              href="/privacy"
              className="underline transition-colors hover:text-[color:var(--m-ink)]"
            >
              {localized("Privacy Policy", "Pol\u00edtica de Privacidad", locale)}
            </a>
            {" · "}
            <a
              href="/terms"
              className="underline transition-colors hover:text-[color:var(--m-ink)]"
            >
              {localized("Terms of Use", "Condiciones de Uso", locale)}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
