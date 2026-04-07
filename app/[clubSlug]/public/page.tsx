import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { SocialLinks } from "@/components/club/social-links";
import { PhotoGallery } from "@/components/club/photo-gallery";
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
import { getClubJsonLd } from "@/lib/structured-data";
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
    .select("name, tags, club_branding(logo_url)")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) return { title: "Club" };

  const branding = Array.isArray(club.club_branding)
    ? club.club_branding[0]
    : club.club_branding;
  const tags = (club.tags as string[] | null) ?? [];
  const description = tags.length > 0
    ? `${club.name} on osocios.club — ${tags.join(", ")}`
    : `${club.name} — Member portal on osocios.club`;

  return {
    title: club.name,
    description,
    keywords: tags,
    openGraph: {
      title: club.name,
      description,
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
    .select("id, name, approved, invite_only, invite_mode, login_mode, hide_member_login, preregistration_enabled, tags, working_hours, timezone, club_branding(logo_url, cover_url, primary_color, secondary_color, social_instagram, social_whatsapp, social_telegram, social_google_maps, social_website)")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

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
        .select("id, title, description, title_es, description_es, image_url, link, reward_spins")
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
        .select("id, image_url, caption")
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
  });

  return (
    <div className="min-h-screen club-page-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(clubJsonLd) }}
      />
      {/* Hero */}
      <div
        className="relative px-6 pt-12 pb-16 text-center bg-cover bg-center overflow-hidden"
        style={
          branding?.cover_url
            ? { backgroundImage: `url(${branding.cover_url})` }
            : undefined
        }
      >
        {/* Language Switcher */}
        <div className="absolute top-3 right-3 z-20">
          <LanguageSwitcher variant="light" />
        </div>
        {branding?.cover_url && (
          <div className="absolute inset-0 bg-black/50" />
        )}
        {!branding?.cover_url && (
          <div className="absolute inset-0 club-hero" />
        )}

        <div className="relative z-10">
          {branding?.logo_url && (
            <img
              src={branding.logo_url}
              alt={club.name}
              className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 shadow-lg border-2 border-white/20"
            />
          )}
          <h1 className="text-2xl font-bold text-white">{club.name}</h1>
          {club.tags && club.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              {club.tags.map((tag: string) => (
                <span key={tag} className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-white/20 text-white/90">
                  {getTagLabel(tag, locale)}
                </span>
              ))}
            </div>
          )}
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

      <div className="max-w-lg mx-auto px-4 -mt-6 relative z-10 space-y-6 pb-12">
        {/* Gallery */}
        {galleryImages && galleryImages.length > 0 && (
          <PhotoGallery
            images={galleryImages.map((g) => ({
              id: g.id,
              image_url: g.image_url,
              caption: g.caption,
            }))}
          />
        )}

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
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
            <p className="text-sm font-medium text-amber-800">
              {localized(
                `Mention referral code ${referrerCode} when you sign up!`,
                `¡Menciona el código de referencia ${referrerCode} al registrarte!`,
                locale
              )}
            </p>
          </div>
        )}

        {/* Member Login — inline form */}
        {!(club.invite_only && club.hide_member_login) && (
          <div className="bg-white rounded-2xl shadow-lg p-5 ring-2 ring-[var(--club-primary,#16a34a)]/20">
            <p className="text-sm font-semibold text-gray-700 mb-1 text-center">{localized("Have a member code?", "¿Tienes un código de socio?", locale)}</p>
            <p className="text-xs text-gray-400 mb-3 text-center">{localized("Enter it below to access your portal", "Ingrésalo abajo para acceder a tu portal", locale)}</p>
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
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">
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
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                  <p className="text-sm font-medium text-amber-800">
                    {localized(
                      `Mention referral code ${referrerCode} when you sign up!`,
                      `¡Menciona el código de referencia ${referrerCode} al registrarte!`,
                      locale
                    )}
                  </p>
                </div>
              )}
              {(quests ?? []).map((q) => (
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
              <MembersOnlyTeaser count={hiddenQuestsCount ?? 0} locale={locale} />
            </div>
          </div>
        )}

        {/* Events */}
        {hasEvents && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">
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
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">
              {localized("Offers", "Ofertas", locale)}
            </h2>
            <div className="space-y-4">
              {Object.entries(offersBySubtype).map(([subtype, items]) => (
                <div key={subtype}>
                  <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider px-1 mb-1.5">
                    {subtype}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {items.map((item) => {
                      const displayIcon = item.club_icon || item.icon;
                      return (
                        <div key={item.id} className="bg-white rounded-xl shadow p-3 flex flex-col items-center text-center">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover mb-1.5"
                            />
                          ) : displayIcon ? (
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-1.5">
                              <DynamicIcon name={displayIcon} className="w-5 h-5 text-gray-500" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-1.5">
                              <span className="text-gray-300 text-lg">+</span>
                            </div>
                          )}
                          <span className="text-xs font-medium text-gray-900 leading-tight">{localized(item.name, item.name_es, locale)}</span>
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
        <div className="text-center text-xs text-gray-300 pt-4 space-y-1">
          <p>© {new Date().getFullYear()} {club.name} · Powered by osocios</p>
          <p>
            <a href="/privacy" className="underline hover:text-gray-500 transition-colors">{localized("Privacy Policy", "Pol\u00edtica de Privacidad", locale)}</a>
            {" · "}
            <a href="/terms" className="underline hover:text-gray-500 transition-colors">{localized("Terms of Use", "Condiciones de Uso", locale)}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
