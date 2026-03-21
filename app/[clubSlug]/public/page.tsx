import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { SocialLinks } from "@/components/club/social-links";
import { PhotoGallery } from "@/components/club/photo-gallery";
import { InviteForm } from "./invite-form";
import { InviteSocialButtons } from "./invite-social-buttons";
import { PublicLoginForm } from "./public-login-form";
import { localized } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { DynamicIcon } from "@/components/dynamic-icon";
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
    .eq("active", true)
    .single();

  return {
    title: club ? club.name : "Club",
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, invite_only, invite_mode, login_mode, hide_member_login, club_branding(logo_url, cover_url, primary_color, secondary_color, social_instagram, social_whatsapp, social_telegram, social_google_maps, social_website)")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  const locale = await getServerLocale();

  const branding = Array.isArray(club.club_branding)
    ? club.club_branding[0]
    : club.club_branding;

  const today = new Date().toISOString().split("T")[0];

  const [{ data: events }, { data: quests }, { data: offers }, { data: galleryImages }, { data: inviteButtons }] =
    await Promise.all([
      supabase
        .from("events")
        .select("id, title, description, title_es, description_es, date, time, price, image_url, link, reward_spins")
        .eq("club_id", club.id)
        .eq("active", true)
        .eq("is_public", true)
        .gte("date", today)
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

  function formatDate(d: string) {
    return new Date(d + "T00:00:00").toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  function formatTime(t: string) {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }

  return (
    <div className="min-h-screen club-page-bg">
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

        {/* Member Login — inline form */}
        {!(club.invite_only && club.hide_member_login) && (
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <p className="text-sm text-gray-500 mb-3 text-center">{localized("Already a member?", "¿Ya eres socio?", locale)}</p>
            <PublicLoginForm loginMode={club.login_mode ?? "code_only"} clubSlug={clubSlug} />
          </div>
        )}

        {/* Events */}
        {hasEvents && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">
              {localized("Upcoming Events", "Próximos Eventos", locale)}
            </h2>
            <div className="space-y-3">
              {events.map((ev) => (
                <div key={ev.id} className="bg-white rounded-2xl shadow overflow-hidden">
                  {ev.image_url && (
                    <img
                      src={ev.image_url}
                      alt=""
                      className="w-full h-36 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{localized(ev.title, ev.title_es, locale)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(ev.date)}
                          {ev.time && ` ${localized("at", "a las", locale)} ${formatTime(ev.time)}`}
                        </p>
                        {ev.description && (
                          <p className="text-xs text-gray-400 mt-1">{localized(ev.description, ev.description_es, locale)}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        {ev.price != null ? (
                          <span className="text-sm font-bold text-gray-900">${Number(ev.price).toFixed(2)}</span>
                        ) : (
                          <span className="text-sm font-bold text-green-600">{localized("Free", "Gratis", locale)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {ev.reward_spins > 0 && (
                        <span className="text-xs club-tint-text font-medium px-2 py-0.5 club-tint-bg rounded-full">
                          +{ev.reward_spins} {ev.reward_spins === 1 ? "spin" : "spins"}
                        </span>
                      )}
                      {ev.link && (
                        <a
                          href={ev.link.match(/^https?:\/\//) ? ev.link : `https://${ev.link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium club-primary underline"
                        >
                          {localized("Learn more", "Más info", locale)}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
                <InviteForm clubId={club.id} clubName={club.name} />
              ))}
              {(quests ?? []).map((q) => (
                <div key={q.id} className="bg-white rounded-2xl shadow p-4">
                  <div className="flex items-center gap-4">
                    {q.image_url ? (
                      <img src={q.image_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-gray-100 text-gray-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{localized(q.title, q.title_es, locale)}</p>
                      {q.description && (
                        <p className="text-xs text-gray-400">{localized(q.description, q.description_es, locale)}</p>
                      )}
                      {q.link && (() => {
                        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q.link!);
                        const href = isEmail
                          ? `mailto:${q.link}`
                          : q.link!.match(/^https?:\/\//) ? q.link! : `https://${q.link}`;
                        const display = isEmail
                          ? q.link!
                          : q.link!.replace(/^https?:\/\//, "").replace(/\/$/, "");
                        return (
                          <a
                            href={href}
                            target={isEmail ? undefined : "_blank"}
                            rel={isEmail ? undefined : "noopener noreferrer"}
                            className="inline-block mt-1 text-xs font-medium club-primary underline truncate max-w-[200px]"
                          >
                            {display.length > 40 ? `${display.slice(0, 37)}...` : display}
                          </a>
                        );
                      })()}
                    </div>
                    {q.reward_spins > 0 && (
                      <span className="shrink-0 text-xs club-tint-text font-medium px-2 py-0.5 club-tint-bg rounded-full">
                        +{q.reward_spins} spin{q.reward_spins === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
                  <div className="bg-white rounded-2xl shadow divide-y divide-gray-50">
                    {items.map((item) => {
                      const displayIcon = item.club_icon || item.icon;
                      return (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover shrink-0"
                            />
                          ) : displayIcon ? (
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                              <DynamicIcon name={displayIcon} className="w-4 h-4 text-gray-500" />
                            </div>
                          ) : (
                            <span className="text-base shrink-0">+</span>
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-gray-900">{localized(item.name, item.name_es, locale)}</span>
                            {(item.description || item.description_es) && (
                              <p className="text-xs text-gray-400 mt-0.5">{localized(item.description ?? "", item.description_es, locale)}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
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
