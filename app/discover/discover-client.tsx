"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import type { DiscoverClub, DiscoverEvent, DiscoverOffer, ActiveTab, MapViewport } from "./lib/types";
import { DEFAULT_VIEWPORT } from "./lib/types";
import { FilterTabs } from "./components/filter-tabs";
import { FilterControls } from "./components/filter-controls";
import { SidePanel } from "./components/side-panel";
import { LocationSearch } from "./components/location-search";
import { NearMeButton } from "./components/near-me-button";
import { useLanguage } from "@/lib/i18n/provider";
import { getTagLabel } from "@/lib/tags";

const DiscoverMap = dynamic(() => import("./components/discover-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[oklch(0.12_0.02_150)] animate-pulse flex items-center justify-center">
      <span className="text-xs text-white/30 font-mono">Loading map...</span>
    </div>
  ),
});

export function DiscoverClient({
  clubs,
  events,
  offers,
}: {
  clubs: DiscoverClub[];
  events: DiscoverEvent[];
  offers: DiscoverOffer[];
}) {
  const { locale } = useLanguage();
  const [activeTab, setActiveTab] = useState<ActiveTab>("clubs");
  const [viewport, setViewport] = useState<MapViewport>(DEFAULT_VIEWPORT);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([]);
  const [selectedSubtypes, setSelectedSubtypes] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  // Filter clubs by tags
  const filteredClubs = useMemo(() => {
    if (selectedTagFilters.length === 0) return clubs;
    return clubs.filter((c) =>
      c.tags?.some((tag) => selectedTagFilters.includes(tag))
    );
  }, [clubs, selectedTagFilters]);

  // Filter events by date
  const filteredEvents = useMemo(() => {
    if (dateFilter === "all") return events;
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    if (dateFilter === "today") {
      return events.filter((e) => e.date === today);
    }

    const endDate = new Date(now);
    if (dateFilter === "week") endDate.setDate(endDate.getDate() + 7);
    if (dateFilter === "month") endDate.setMonth(endDate.getMonth() + 1);
    const end = endDate.toISOString().split("T")[0];

    return events.filter((e) => e.date >= today && e.date <= end);
  }, [events, dateFilter]);

  // Filter offers by subtype
  const filteredOffers = useMemo(() => {
    if (selectedSubtypes.length === 0) return offers;
    return offers.filter((o) => selectedSubtypes.includes(o.subtype));
  }, [offers, selectedSubtypes]);

  // Build GeoJSON features for current tab
  const geoFeatures = useMemo(() => {
    if (activeTab === "clubs") {
      return filteredClubs
        .filter((c) => c.latitude != null && c.longitude != null)
        .map((c) => ({
          type: "Feature" as const,
          properties: {
            id: c.id,
            type: "club" as const,
            name: c.name,
            slug: c.slug,
            logo_url: c.logo_url,
            primary_color: c.primary_color ?? "#16a34a",
            city: c.city,
            tags: c.tags,
          },
          geometry: {
            type: "Point" as const,
            coordinates: [c.longitude!, c.latitude!],
          },
        }));
    }

    if (activeTab === "events") {
      return filteredEvents
        .filter((e) => {
          const lat = e.latitude ?? e.club_latitude;
          const lng = e.longitude ?? e.club_longitude;
          return lat != null && lng != null;
        })
        .map((e) => {
          const lat = e.latitude ?? e.club_latitude!;
          const lng = e.longitude ?? e.club_longitude!;
          return {
            type: "Feature" as const,
            properties: {
              id: e.id,
              type: "event" as const,
              name: locale === "es" && e.title_es ? e.title_es : e.title,
              slug: e.club_slug,
              logo_url: e.club_logo,
              primary_color: e.club_primary_color ?? "#16a34a",
              date: e.date,
              time: e.time,
              club_name: e.club_name,
              price: e.price,
            },
            geometry: {
              type: "Point" as const,
              coordinates: [lng, lat],
            },
          };
        });
    }

    // offers — group by club location (one marker per club)
    const clubMap = new Map<string, { lat: number; lng: number; club: { name: string; slug: string; logo: string | null; color: string }; offers: typeof filteredOffers }>();

    for (const o of filteredOffers) {
      if (o.club_latitude == null || o.club_longitude == null) continue;
      const key = o.club_slug;
      if (!clubMap.has(key)) {
        clubMap.set(key, {
          lat: o.club_latitude,
          lng: o.club_longitude,
          club: { name: o.club_name, slug: o.club_slug, logo: o.club_logo, color: o.club_primary_color ?? "#16a34a" },
          offers: [],
        });
      }
      clubMap.get(key)!.offers.push(o);
    }

    return Array.from(clubMap.values()).map((entry) => ({
      type: "Feature" as const,
      properties: {
        id: entry.club.slug,
        type: "offer" as const,
        name: entry.club.name,
        slug: entry.club.slug,
        logo_url: entry.club.logo,
        primary_color: entry.club.color,
        offer_count: entry.offers.length,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [entry.lng, entry.lat],
      },
    }));
  }, [activeTab, filteredClubs, filteredEvents, filteredOffers, locale]);

  // Items for the list panel (includes items without location)
  const listItems = useMemo(() => {
    if (activeTab === "clubs") {
      return filteredClubs.map((c) => ({
        id: c.id,
        type: "club" as const,
        title: c.name,
        subtitle: [c.city, c.country].filter(Boolean).join(", ") || null,
        tags: c.tags?.map((tag) => getTagLabel(tag, locale)) ?? [],
        slug: c.slug,
        logo_url: c.logo_url,
        primary_color: c.primary_color ?? "#16a34a",
        hasLocation: c.latitude != null,
        latitude: c.latitude,
        longitude: c.longitude,
      }));
    }

    if (activeTab === "events") {
      return filteredEvents.map((e) => ({
        id: e.id,
        type: "event" as const,
        title: locale === "es" && e.title_es ? e.title_es : e.title,
        subtitle: e.club_name,
        date: e.date,
        time: e.time,
        price: e.price,
        location_name: e.location_name,
        slug: e.club_slug,
        logo_url: e.club_logo,
        primary_color: e.club_primary_color ?? "#16a34a",
        hasLocation: (e.latitude ?? e.club_latitude) != null,
        latitude: e.latitude ?? e.club_latitude,
        longitude: e.longitude ?? e.club_longitude,
      }));
    }

    // Group offers by club for the list
    const byClub = new Map<string, { club_name: string; club_slug: string; logo: string | null; color: string; hasLocation: boolean; lat: number | null; lng: number | null; offers: typeof filteredOffers }>();
    for (const o of filteredOffers) {
      if (!byClub.has(o.club_slug)) {
        byClub.set(o.club_slug, {
          club_name: o.club_name,
          club_slug: o.club_slug,
          logo: o.club_logo,
          color: o.club_primary_color ?? "#16a34a",
          hasLocation: o.club_latitude != null,
          lat: o.club_latitude,
          lng: o.club_longitude,
          offers: [],
        });
      }
      byClub.get(o.club_slug)!.offers.push(o);
    }

    return Array.from(byClub.values()).map((entry) => ({
      id: entry.club_slug,
      type: "offer" as const,
      title: entry.club_name,
      subtitle: entry.offers.map((o) => locale === "es" && o.offer_name_es ? o.offer_name_es : o.offer_name).join(", "),
      offer_count: entry.offers.length,
      slug: entry.club_slug,
      logo_url: entry.logo,
      primary_color: entry.color,
      hasLocation: entry.hasLocation,
      latitude: entry.lat,
      longitude: entry.lng,
    }));
  }, [activeTab, filteredClubs, filteredEvents, filteredOffers, locale]);

  const handleFlyTo = useCallback((lat: number, lng: number) => {
    setViewport({ latitude: lat, longitude: lng, zoom: 15 });
  }, []);

  const handleSelectItem = useCallback((id: string, lat?: number | null, lng?: number | null) => {
    setSelectedId(id);
    if (lat != null && lng != null) {
      handleFlyTo(lat, lng);
    }
  }, [handleFlyTo]);

  const handleLocationFound = useCallback((lat: number, lng: number) => {
    setViewport({ latitude: lat, longitude: lng, zoom: 13 });
  }, []);

  const counts = {
    clubs: filteredClubs.length,
    events: filteredEvents.length,
    offers: filteredOffers.length,
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row relative" style={{ minHeight: "calc(100svh - 120px)" }}>
      {/* Left panel (desktop) / controls bar (mobile) */}
      <div className="md:w-[380px] lg:w-[420px] md:border-r md:border-white/[0.06] flex flex-col z-10 relative">
        {/* Search + near me */}
        <div className="px-4 pt-3 pb-2 flex gap-2">
          <LocationSearch onLocationFound={handleLocationFound} />
          <NearMeButton onLocationFound={handleLocationFound} />
        </div>

        {/* Tabs */}
        <FilterTabs activeTab={activeTab} onChange={setActiveTab} counts={counts} />

        {/* Filters */}
        <FilterControls
          activeTab={activeTab}
          selectedTags={selectedTagFilters}
          onTagsChange={setSelectedTagFilters}
          selectedSubtypes={selectedSubtypes}
          onSubtypesChange={setSelectedSubtypes}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          locale={locale}
        />

        {/* List panel — hidden on mobile (use bottom sheet), visible on desktop */}
        <div className="hidden md:flex flex-1 min-h-0">
          <SidePanel
            items={listItems}
            selectedId={selectedId}
            onSelect={handleSelectItem}
            activeTab={activeTab}
          />
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative min-h-[50svh] md:min-h-0">
        <DiscoverMap
          features={geoFeatures}
          viewport={viewport}
          onViewportChange={setViewport}
          selectedId={selectedId}
          onSelectMarker={handleSelectItem}
          activeTab={activeTab}
        />

        {/* Mobile bottom sheet toggle */}
        <button
          onClick={() => setMobileSheetOpen(!mobileSheetOpen)}
          className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white/95 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-full shadow-lg text-xs font-semibold flex items-center gap-1.5"
        >
          <span>{mobileSheetOpen ? "Show Map" : `View List (${listItems.length})`}</span>
          <svg className={`w-3 h-3 transition-transform ${mobileSheetOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {/* Mobile list overlay */}
        {mobileSheetOpen && (
          <div className="md:hidden absolute inset-0 z-10 bg-[oklch(0.06_0.02_150)]/95 backdrop-blur-sm overflow-auto">
            <SidePanel
              items={listItems}
              selectedId={selectedId}
              onSelect={(id, lat, lng) => {
                handleSelectItem(id, lat, lng);
                setMobileSheetOpen(false);
              }}
              activeTab={activeTab}
            />
          </div>
        )}
      </div>
    </div>
  );
}
