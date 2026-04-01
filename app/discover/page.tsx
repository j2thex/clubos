import { createAdminClient } from "@/lib/supabase/admin";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { LandingFooter } from "../_landing/landing-footer";
import { LanguageSwitcher } from "@/lib/i18n/switcher";
import Link from "next/link";
import { DiscoverClient } from "./discover-client";
import type { DiscoverClub, DiscoverEvent, DiscoverOffer } from "./lib/types";
import type { Metadata } from "next";
import { getItemListJsonLd } from "@/lib/structured-data";

export const revalidate = 300; // 5-minute ISR

export const metadata: Metadata = {
  title: "Discover",
  description:
    "Find clubs, events, and services near you on osocios.club. Browse the map, explore upcoming events, and discover offers from private clubs.",
  alternates: {
    canonical: "/discover",
    languages: {
      en: "/discover",
      es: "/discover",
      "x-default": "/discover",
    },
  },
};

async function getClubs(): Promise<DiscoverClub[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("clubs")
      .select("id, name, slug, latitude, longitude, address, city, country, tags, club_branding(logo_url, primary_color)")
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
      .eq("active", true)
      .eq("is_public", true)
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(200);

    return (data ?? []).map((e) => {
      const club = Array.isArray(e.clubs) ? e.clubs[0] : e.clubs;
      const branding = club ? (Array.isArray(club.club_branding) ? club.club_branding[0] : club.club_branding) : null;
      return {
        id: e.id,
        title: e.title,
        title_es: e.title_es,
        description: e.description,
        description_es: e.description_es,
        date: e.date,
        time: e.time,
        price: e.price != null ? Number(e.price) : null,
        image_url: e.image_url,
        icon: e.icon,
        location_name: e.location_name,
        latitude: e.latitude,
        longitude: e.longitude,
        club_name: club?.name ?? "",
        club_slug: club?.slug ?? "",
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
      .eq("is_public", true)
      .neq("archived", true)
      .limit(300);

    return (data ?? []).map((o) => {
      const catalog = Array.isArray(o.offer_catalog) ? o.offer_catalog[0] : o.offer_catalog;
      const club = Array.isArray(o.clubs) ? o.clubs[0] : o.clubs;
      const branding = club ? (Array.isArray(club.club_branding) ? club.club_branding[0] : club.club_branding) : null;
      return {
        id: o.id,
        offer_name: catalog?.name ?? "Offer",
        offer_name_es: catalog?.name_es ?? null,
        subtype: catalog?.subtype ?? "service",
        icon: o.icon,
        description: o.description,
        description_es: o.description_es,
        price: o.price != null ? Number(o.price) : null,
        image_url: o.image_url,
        club_name: club?.name ?? "",
        club_slug: club?.slug ?? "",
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

export default async function DiscoverPage() {
  const locale = await getServerLocale();
  const tr = (key: string, params?: Record<string, string | number>) => t(locale, key, params);

  const [clubs, events, offers] = await Promise.all([
    getClubs(),
    getEvents(),
    getOffers(),
  ]);

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://osocios.club";
  const clubListJsonLd = getItemListJsonLd(
    clubs.map((c) => ({ name: c.name, url: `${SITE_URL}/${c.slug}/public` }))
  );

  return (
    <div className="min-h-svh flex flex-col landing-dark">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(clubListJsonLd) }}
      />
      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/" className="text-xs font-mono tracking-widest uppercase opacity-80 hover:opacity-100 transition-opacity">
          {tr("landing.brandName")}
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/onboarding"
            className="text-xs opacity-70 hover:opacity-100 transition-opacity hidden sm:inline"
          >
            {tr("landing.heroPrimaryCta")}
          </Link>
          <LanguageSwitcher variant="dark" />
        </div>
      </header>

      {/* Page orientation */}
      <section className="px-6 py-5 border-b border-white/10">
        <h1 className="text-xl sm:text-2xl font-bold text-white">{tr("discover.title")}</h1>
        <p className="text-sm text-white/60 mt-1">{tr("discover.subtitle")}</p>
      </section>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        <DiscoverClient clubs={clubs} events={events} offers={offers} />
      </main>

      {/* Footer */}
      <LandingFooter t={tr} />
    </div>
  );
}
