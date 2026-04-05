"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { DiscoverClub, MapViewport, ActiveTab } from "../discover/lib/types";
import { DEFAULT_VIEWPORT } from "../discover/lib/types";
import { LocationSearch } from "../discover/components/location-search";
import { useLanguage } from "@/lib/i18n/provider";

const DiscoverMap = dynamic(() => import("../discover/components/discover-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[oklch(0.12_0.02_150)] animate-pulse flex items-center justify-center">
      <span className="text-xs text-white/30 font-mono">Loading map...</span>
    </div>
  ),
});

const TABS: { key: ActiveTab; label: string; labelEs: string; icon: string }[] = [
  { key: "clubs", label: "Clubs", labelEs: "Clubes", icon: "🏠" },
  { key: "events", label: "Events", labelEs: "Eventos", icon: "📅" },
  { key: "offers", label: "Offers", labelEs: "Ofertas", icon: "✨" },
  { key: "quests", label: "Quests", labelEs: "Misiones", icon: "🎯" },
];

export function HomepageMap({
  clubs,
  clubCount,
  eventCount,
  offerCount,
  questCount,
}: {
  clubs: DiscoverClub[];
  clubCount: number;
  eventCount: number;
  offerCount: number;
  questCount: number;
}) {
  const { locale, t } = useLanguage();
  const [viewport, setViewport] = useState<MapViewport>(DEFAULT_VIEWPORT);
  const [flyToTrigger, setFlyToTrigger] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const counts: Record<ActiveTab, number> = { clubs: clubCount, events: eventCount, offers: offerCount, quests: questCount };

  // Always show clubs on homepage map
  const geoFeatures = useMemo(() => {
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
  }, [clubs]);

  function flyTo(lat: number, lng: number, zoom?: number) {
    setViewport({ latitude: lat, longitude: lng, zoom: zoom ?? 14 });
    setFlyToTrigger((prev) => prev + 1);
  }

  return (
    <>
      {/* Map */}
      <div className="relative w-full" style={{ height: "50svh", minHeight: 320 }}>
        <DiscoverMap
          features={geoFeatures}
          activeTab="clubs"
          viewport={viewport}
          onMove={setViewport}
          flyToTrigger={flyToTrigger}
          selectedId={selectedId}
          onSelectMarker={(id) => setSelectedId(id)}
          onDeselectMarker={() => setSelectedId(null)}
          scrollZoom={false}
        />

        {/* Search overlay */}
        <div className="absolute top-3 left-3 right-3 z-10">
          <LocationSearch
            onLocationFound={(lat, lng) => flyTo(lat, lng, 13)}
            locale={locale}
          />
        </div>

        {/* CTA button — centered */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none gap-2">
          <p className="text-xs text-white/60 font-medium">{t("discover.clubsNearYou")}</p>
          <Link
            href="/discover"
            className="pointer-events-auto px-6 py-3 rounded-full bg-white text-gray-900 font-bold text-sm shadow-xl hover:bg-gray-100 transition-colors"
          >
            {t("discover.exploreMap")} →
          </Link>
        </div>
      </div>

      {/* Tab navigation — standalone row below map */}
      <div className="border-b border-white/[0.06] bg-[oklch(0.13_0.02_150)]">
        <p className="text-[10px] uppercase tracking-wider text-white/40 font-medium px-4 pt-2">
          {t("discover.browseby")}
        </p>
      <div className="flex">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/discover#${tab.key}`}
            className="flex-1 flex items-center justify-center gap-2 py-4 text-sm sm:text-base font-medium text-white/60 hover:text-white hover:bg-white/[0.05] transition-all border-r last:border-r-0 border-white/[0.06]"
          >
            <span>{tab.icon}</span>
            <span>{locale === "es" ? tab.labelEs : tab.label}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.08] text-white/50">
              {counts[tab.key]}
            </span>
          </Link>
        ))}
      </div>
      </div>
    </>
  );
}
