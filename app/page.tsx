import type { Metadata } from "next";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrganizationJsonLd, getWebSiteJsonLd } from "@/lib/structured-data";
import { LanguageSwitcher } from "@/lib/i18n/switcher";
import { HomepageMap } from "./_landing/homepage-client";
import { MembershipExplorer } from "./_landing/membership-explorer";
import { ClubDirectory } from "./_landing/club-directory";
import { LandingFooter } from "./_landing/landing-footer";
import type { DiscoverClub, DiscoverEvent, DiscoverOffer, DiscoverQuest } from "./discover/lib/types";
import { localized } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "osocios.club — Discover clubs, events & offers near you",
  description:
    "Find private clubs, upcoming events, exclusive offers, and quests near you. Join a community and start earning rewards.",
  alternates: {
    canonical: "/",
    languages: { en: "/", es: "/", "x-default": "/" },
  },
};

export const revalidate = 300;

async function getClubs(): Promise<DiscoverClub[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("clubs")
      .select("id, name, slug, latitude, longitude, address, city, country, tags, club_branding(logo_url, cover_url, primary_color)")
      .eq("active", true).eq("approved", true)
      .order("created_at", { ascending: false });

    return (data ?? []).map((c) => {
      const branding = Array.isArray(c.club_branding) ? c.club_branding[0] : c.club_branding;
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        latitude: c.latitude,
        longitude: c.longitude,
        address: c.address,
        city: c.city,
        country: c.country,
        tags: c.tags,
        logo_url: branding?.logo_url ?? null,
        primary_color: branding?.primary_color ?? null,
      };
    });
  } catch {
    return [];
  }
}

async function getEvents(): Promise<DiscoverEvent[]> {
  try {
    const supabase = createAdminClient();
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("events")
      .select("id, title, title_es, description, description_es, date, time, price, image_url, icon, location_name, latitude, longitude, clubs(name, slug, latitude, longitude, club_branding(logo_url, primary_color))")
      .eq("active", true).eq("is_public", true)
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(50);

    return (data ?? []).map((e) => {
      const club = Array.isArray(e.clubs) ? e.clubs[0] : e.clubs;
      const branding = club ? (Array.isArray(club.club_branding) ? club.club_branding[0] : club.club_branding) : null;
      return {
        id: e.id, title: e.title, title_es: e.title_es,
        description: e.description, description_es: e.description_es,
        date: e.date, time: e.time,
        price: e.price != null ? Number(e.price) : null,
        image_url: e.image_url, icon: e.icon,
        location_name: e.location_name,
        latitude: e.latitude, longitude: e.longitude,
        club_name: club?.name ?? "", club_slug: club?.slug ?? "",
        club_logo: branding?.logo_url ?? null,
        club_primary_color: branding?.primary_color ?? null,
        club_latitude: club?.latitude ?? null,
        club_longitude: club?.longitude ?? null,
      };
    });
  } catch {
    return [];
  }
}

async function getOffers(): Promise<DiscoverOffer[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("club_offers")
      .select("id, description, description_es, price, image_url, icon, offer_catalog(name, name_es, subtype), clubs(name, slug, latitude, longitude, club_branding(logo_url, primary_color))")
      .eq("is_public", true).neq("archived", true)
      .limit(100);

    return (data ?? []).map((o) => {
      const catalog = Array.isArray(o.offer_catalog) ? o.offer_catalog[0] : o.offer_catalog;
      const club = Array.isArray(o.clubs) ? o.clubs[0] : o.clubs;
      const branding = club ? (Array.isArray(club.club_branding) ? club.club_branding[0] : club.club_branding) : null;
      return {
        id: o.id,
        offer_name: catalog?.name ?? "Offer",
        offer_name_es: catalog?.name_es ?? null,
        subtype: catalog?.subtype ?? "service",
        icon: o.icon, description: o.description, description_es: o.description_es,
        price: o.price != null ? Number(o.price) : null,
        image_url: o.image_url,
        club_name: club?.name ?? "", club_slug: club?.slug ?? "",
        club_logo: branding?.logo_url ?? null,
        club_primary_color: branding?.primary_color ?? null,
        club_latitude: club?.latitude ?? null,
        club_longitude: club?.longitude ?? null,
      };
    });
  } catch {
    return [];
  }
}

async function getQuests(): Promise<DiscoverQuest[]> {
  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("quests")
      .select("id, title, title_es, description, description_es, reward_spins, icon, image_url, deadline, clubs(name, slug, latitude, longitude, club_branding(logo_url, primary_color))")
      .eq("active", true).eq("is_public", true)
      .or(`deadline.is.null,deadline.gt.${now}`)
      .order("reward_spins", { ascending: false })
      .limit(100);

    return (data ?? []).map((q) => {
      const club = Array.isArray(q.clubs) ? q.clubs[0] : q.clubs;
      const branding = club ? (Array.isArray(club.club_branding) ? club.club_branding[0] : club.club_branding) : null;
      return {
        id: q.id, title: q.title, title_es: q.title_es,
        description: q.description, description_es: q.description_es,
        reward_spins: Number(q.reward_spins),
        icon: q.icon, image_url: q.image_url, deadline: q.deadline,
        club_name: club?.name ?? "", club_slug: club?.slug ?? "",
        club_logo: branding?.logo_url ?? null,
        club_primary_color: branding?.primary_color ?? null,
        club_latitude: club?.latitude ?? null,
        club_longitude: club?.longitude ?? null,
      };
    });
  } catch {
    return [];
  }
}

async function getMembershipDeals() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("membership_periods")
      .select("id, name, duration_months, price, clubs(name, slug, club_branding(logo_url, primary_color))")
      .eq("active", true).eq("approved", true)
      .not("price", "is", null)
      .order("price", { ascending: true })
      .limit(30);
    return (data ?? []).map((d) => {
      const club = Array.isArray(d.clubs) ? d.clubs[0] : d.clubs;
      const branding = club ? (Array.isArray(club.club_branding) ? club.club_branding[0] : club.club_branding) : null;
      return {
        id: d.id, name: d.name, duration_months: d.duration_months,
        price: d.price as number,
        club_name: club?.name ?? "", club_slug: club?.slug ?? "",
        club_logo: branding?.logo_url ?? null, club_color: branding?.primary_color ?? null,
      };
    });
  } catch {
    return [];
  }
}

export default async function Home() {
  const locale = await getServerLocale();
  const [clubs, events, offers, quests, deals] = await Promise.all([
    getClubs(),
    getEvents(),
    getOffers(),
    getQuests(),
    getMembershipDeals(),
  ]);

  const tr = (key: string, params?: Record<string, string | number>) =>
    t(locale, key, params);

  // Curated data for sections
  const upcomingEvents = events.slice(0, 8);
  const clubsForDirectory = clubs.slice(0, 12).map((c) => ({
    name: c.name,
    slug: c.slug,
    logo_url: c.logo_url,
    cover_url: null as string | null,
    primary_color: c.primary_color,
  }));

  // Group offers by name, count clubs per offer
  const offerGroups = new Map<string, { name: string; name_es: string | null; count: number; icon: string | null }>();
  for (const o of offers) {
    const existing = offerGroups.get(o.offer_name);
    if (existing) {
      existing.count++;
    } else {
      offerGroups.set(o.offer_name, { name: o.offer_name, name_es: o.offer_name_es, count: 1, icon: o.icon });
    }
  }
  const popularOffers = [...offerGroups.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  return (
    <div className="min-h-screen landing-dark">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getOrganizationJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getWebSiteJsonLd()) }}
      />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/" className="text-xs font-mono tracking-widest uppercase opacity-80 hover:opacity-100 transition-opacity">
          {tr("landing.brandName")}
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/for-clubs"
            className="text-xs opacity-60 hover:opacity-100 transition-opacity"
          >
            {localized("For Clubs", "Para Clubes", locale)}
          </Link>
          <Link
            href="/discover"
            className="text-xs opacity-60 hover:opacity-100 transition-opacity hidden sm:inline"
          >
            Discover
          </Link>
          <LanguageSwitcher variant="dark" />
        </div>
      </header>

      {/* Map Hero */}
      <HomepageMap clubs={clubs} events={events} offers={offers} quests={quests} />

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <section className="px-6 py-12 border-t border-white/[0.04]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-lg font-bold text-white mb-1">
              {localized("Upcoming Events", "Próximos Eventos", locale)}
            </h2>
            <p className="text-xs text-white/40 mb-6">
              {localized("Don't miss what's happening near you", "No te pierdas lo que pasa cerca de ti", locale)}
            </p>
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
              {upcomingEvents.map((ev) => {
                const dateObj = new Date(ev.date + "T00:00:00");
                const month = dateObj.toLocaleDateString(locale === "es" ? "es-ES" : "en-US", { month: "short" });
                const day = dateObj.getDate();
                return (
                  <Link
                    key={ev.id}
                    href={`/${ev.club_slug}/public`}
                    className="flex-shrink-0 w-56 snap-start bg-white/[0.04] rounded-xl overflow-hidden hover:bg-white/[0.07] transition-colors group"
                  >
                    {ev.image_url ? (
                      <img src={ev.image_url} alt="" className="w-full h-28 object-cover" />
                    ) : (
                      <div className="w-full h-28 flex items-center justify-center bg-white/[0.03]">
                        <span className="text-2xl opacity-30">📅</span>
                      </div>
                    )}
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase text-white/50">{month} {day}</span>
                        {ev.time && <span className="text-[10px] text-white/30">{ev.time}</span>}
                      </div>
                      <p className="text-sm font-semibold text-white truncate">
                        {localized(ev.title, ev.title_es, locale)}
                      </p>
                      <p className="text-[10px] text-white/40 mt-0.5 truncate">{ev.club_name}</p>
                      {ev.price != null && ev.price > 0 && (
                        <span className="inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                          €{ev.price}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Popular Offers */}
      {popularOffers.length > 0 && (
        <section className="px-6 py-12 border-t border-white/[0.04]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-lg font-bold text-white mb-1">
              {localized("Popular Offers", "Ofertas Populares", locale)}
            </h2>
            <p className="text-xs text-white/40 mb-6">
              {localized("What clubs are offering", "Lo que ofrecen los clubes", locale)}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {popularOffers.map((offer) => (
                <Link
                  key={offer.name}
                  href={`/discover#offers`}
                  className="bg-white/[0.04] rounded-xl p-4 hover:bg-white/[0.07] transition-colors text-center"
                >
                  <p className="text-sm font-semibold text-white">
                    {localized(offer.name, offer.name_es, locale)}
                  </p>
                  <p className="text-[10px] text-white/40 mt-1">
                    {offer.count} {offer.count === 1
                      ? localized("club", "club", locale)
                      : localized("clubs", "clubes", locale)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Clubs */}
      <ClubDirectory t={tr} clubs={clubsForDirectory} />

      {/* Membership Deals */}
      {deals.length > 0 && (
        <MembershipExplorer
          deals={deals}
          labels={{
            title: tr("landing.membershipTitle"),
            subtitle: tr("landing.membershipSubtitle"),
            duration: tr("landing.membershipDuration"),
            viewClub: tr("landing.directoryViewClub"),
          }}
        />
      )}

      <LandingFooter t={tr} />
    </div>
  );
}
