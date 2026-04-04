"use client";

import { useState, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import type { DiscoverClub, DiscoverEvent, DiscoverOffer, DiscoverQuest, ActiveTab, MapViewport } from "../discover/lib/types";
import { DEFAULT_VIEWPORT } from "../discover/lib/types";
import { FilterTabs } from "../discover/components/filter-tabs";
import { LocationSearch } from "../discover/components/location-search";
import { NearMeButton } from "../discover/components/near-me-button";
import { useLanguage } from "@/lib/i18n/provider";

const DiscoverMap = dynamic(() => import("../discover/components/discover-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[oklch(0.12_0.02_150)] animate-pulse flex items-center justify-center">
      <span className="text-xs text-white/30 font-mono">Loading map...</span>
    </div>
  ),
});

export function HomepageMap({
  clubs,
  events,
  offers,
  quests,
}: {
  clubs: DiscoverClub[];
  events: DiscoverEvent[];
  offers: DiscoverOffer[];
  quests: DiscoverQuest[];
}) {
  const { locale } = useLanguage();
  const [activeTab, setActiveTab] = useState<ActiveTab>("clubs");
  const [viewport, setViewport] = useState<MapViewport>(DEFAULT_VIEWPORT);
  const [flyToTrigger, setFlyToTrigger] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapSectionRef = useRef<HTMLDivElement>(null);

  // Build GeoJSON features for map (same pattern as discover-client)
  const geoFeatures = useMemo(() => {
    if (activeTab === "clubs") {
      return clubs
        .filter((c) => c.latitude != null && c.longitude != null)
        .map((c) => ({
          type: "Feature" as const,
          properties: {
            id: c.id, type: "club" as const, name: c.name, slug: c.slug,
            logo_url: c.logo_url, primary_color: c.primary_color ?? "#16a34a",
            city: c.city, tags: c.tags,
          },
          geometry: { type: "Point" as const, coordinates: [c.longitude!, c.latitude!] },
        }));
    }

    if (activeTab === "events") {
      return events
        .filter((e) => (e.latitude ?? e.club_latitude) != null && (e.longitude ?? e.club_longitude) != null)
        .map((e) => ({
          type: "Feature" as const,
          properties: {
            id: e.id, type: "event" as const,
            name: locale === "es" && e.title_es ? e.title_es : e.title,
            slug: e.club_slug, logo_url: e.club_logo,
            primary_color: e.club_primary_color ?? "#16a34a",
            date: e.date, time: e.time, club_name: e.club_name, price: e.price,
          },
          geometry: { type: "Point" as const, coordinates: [e.longitude ?? e.club_longitude!, e.latitude ?? e.club_latitude!] },
        }));
    }

    if (activeTab === "quests") {
      return quests
        .filter((q) => q.club_latitude != null && q.club_longitude != null)
        .map((q) => ({
          type: "Feature" as const,
          properties: {
            id: q.id, type: "quest" as const,
            name: locale === "es" && q.title_es ? q.title_es : q.title,
            slug: q.club_slug, logo_url: q.club_logo,
            primary_color: q.club_primary_color ?? "#16a34a",
            club_name: q.club_name, reward_spins: q.reward_spins,
          },
          geometry: { type: "Point" as const, coordinates: [q.club_longitude!, q.club_latitude!] },
        }));
    }

    // offers — group by club
    const clubMap = new Map<string, { lat: number; lng: number; club: { name: string; slug: string; logo: string | null; color: string }; count: number }>();
    for (const o of offers) {
      if (o.club_latitude == null || o.club_longitude == null) continue;
      if (!clubMap.has(o.club_slug)) {
        clubMap.set(o.club_slug, { lat: o.club_latitude, lng: o.club_longitude, club: { name: o.club_name, slug: o.club_slug, logo: o.club_logo, color: o.club_primary_color ?? "#16a34a" }, count: 0 });
      }
      clubMap.get(o.club_slug)!.count++;
    }
    return Array.from(clubMap.values()).map((entry) => ({
      type: "Feature" as const,
      properties: { id: entry.club.slug, type: "offer" as const, name: entry.club.name, slug: entry.club.slug, logo_url: entry.club.logo, primary_color: entry.club.color, offer_count: entry.count },
      geometry: { type: "Point" as const, coordinates: [entry.lng, entry.lat] },
    }));
  }, [activeTab, clubs, events, offers, quests, locale]);

  function flyTo(lat: number, lng: number, zoom?: number) {
    setViewport({ latitude: lat, longitude: lng, zoom: zoom ?? 14 });
    setFlyToTrigger((t) => t + 1);
  }

  return (
    <div ref={mapSectionRef} className="relative w-full" style={{ height: "50svh", minHeight: 320 }}>
      <DiscoverMap
        features={geoFeatures}
        activeTab={activeTab}
        viewport={viewport}
        onMove={setViewport}
        flyToTrigger={flyToTrigger}
        selectedId={selectedId}
        onSelectMarker={(id) => setSelectedId(id)}
        onDeselectMarker={() => setSelectedId(null)}
      />

      {/* Overlays */}
      <div className="absolute top-3 left-3 right-3 z-10 flex gap-2">
        <div className="flex-1">
          <LocationSearch
            onLocationFound={(lat, lng) => flyTo(lat, lng, 13)}
          />
        </div>
        <NearMeButton
          clubs={clubs}
          onLocationFound={(lat, lng) => {
            flyTo(lat, lng, 13);
            setActiveTab("clubs");
          }}
        />
      </div>

      {/* Filter tabs at bottom */}
      <div className="absolute bottom-3 left-3 right-3 z-10">
        <FilterTabs
          activeTab={activeTab}
          onChange={(tab) => { setActiveTab(tab); setSelectedId(null); }}
          counts={{
            clubs: clubs.length,
            events: events.length,
            offers: offers.length,
            quests: quests.length,
          }}
        />
      </div>
    </div>
  );
}
