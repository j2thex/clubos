"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import type { DiscoverClub, DiscoverEvent, DiscoverOffer, ActiveTab, MapViewport } from "./lib/types";
import { DEFAULT_VIEWPORT } from "./lib/types";
import { FilterTabs } from "./components/filter-tabs";
import { FilterControls } from "./components/filter-controls";
import { ResultsGrid } from "./components/results-grid";
import { LocationSearch } from "./components/location-search";
import { NearMeButton } from "./components/near-me-button";
import { AgeGate } from "./components/age-gate";
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
  const [flyToTrigger, setFlyToTrigger] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([]);
  const [selectedOfferNames, setSelectedOfferNames] = useState<string[]>([]);
  const [offerSearch, setOfferSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const mapSectionRef = useRef<HTMLDivElement>(null);

  // Filter clubs by tags
  const filteredClubs = useMemo(() => {
    if (selectedTagFilters.length === 0) return clubs;
    return clubs.filter((c) => c.tags?.some((tag) => selectedTagFilters.includes(tag)));
  }, [clubs, selectedTagFilters]);

  // Filter events by date
  const filteredEvents = useMemo(() => {
    if (dateFilter === "all") return events;
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    if (dateFilter === "today") return events.filter((e) => e.date === today);
    const endDate = new Date(now);
    if (dateFilter === "week") endDate.setDate(endDate.getDate() + 7);
    if (dateFilter === "month") endDate.setMonth(endDate.getMonth() + 1);
    const end = endDate.toISOString().split("T")[0];
    return events.filter((e) => e.date >= today && e.date <= end);
  }, [events, dateFilter]);

  // Filter offers by specific offer name (AND logic) + search
  const filteredOffers = useMemo(() => {
    if (selectedOfferNames.length === 0) {
      if (!offerSearch) return offers;
      return offers.filter((o) => {
        const name = (locale === "es" && o.offer_name_es) ? o.offer_name_es : o.offer_name;
        return name.toLowerCase().includes(offerSearch.toLowerCase());
      });
    }
    // AND logic: find clubs that have ALL selected offer names
    const clubOfferNames = new Map<string, Set<string>>();
    for (const o of offers) {
      if (!clubOfferNames.has(o.club_slug)) clubOfferNames.set(o.club_slug, new Set());
      clubOfferNames.get(o.club_slug)!.add(o.offer_name);
    }
    const qualifyingSlugs = new Set(
      [...clubOfferNames.entries()]
        .filter(([, names]) => selectedOfferNames.every((n) => names.has(n)))
        .map(([slug]) => slug)
    );
    return offers.filter((o) => {
      if (!qualifyingSlugs.has(o.club_slug)) return false;
      if (offerSearch) {
        const name = (locale === "es" && o.offer_name_es) ? o.offer_name_es : o.offer_name;
        if (!name.toLowerCase().includes(offerSearch.toLowerCase())) return false;
      }
      return true;
    });
  }, [offers, selectedOfferNames, offerSearch, locale]);

  // Popular offer names with unique club count for filter pills
  const popularOffers = useMemo(() => {
    const clubSets = new Map<string, Set<string>>();
    for (const o of offers) {
      if (!clubSets.has(o.offer_name)) clubSets.set(o.offer_name, new Set());
      clubSets.get(o.offer_name)!.add(o.club_slug);
    }
    return [...clubSets.entries()]
      .sort((a, b) => b[1].size - a[1].size)
      .slice(0, 15)
      .map(([name, clubs]) => ({ name, clubCount: clubs.size }));
  }, [offers]);

  // Build GeoJSON features for current tab
  const geoFeatures = useMemo(() => {
    if (activeTab === "clubs") {
      return filteredClubs
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
      return filteredEvents
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

    // offers — group by club
    const clubMap = new Map<string, { lat: number; lng: number; club: { name: string; slug: string; logo: string | null; color: string }; offers: typeof filteredOffers }>();
    for (const o of filteredOffers) {
      if (o.club_latitude == null || o.club_longitude == null) continue;
      if (!clubMap.has(o.club_slug)) {
        clubMap.set(o.club_slug, { lat: o.club_latitude, lng: o.club_longitude, club: { name: o.club_name, slug: o.club_slug, logo: o.club_logo, color: o.club_primary_color ?? "#16a34a" }, offers: [] });
      }
      clubMap.get(o.club_slug)!.offers.push(o);
    }
    return Array.from(clubMap.values()).map((entry) => ({
      type: "Feature" as const,
      properties: { id: entry.club.slug, type: "offer" as const, name: entry.club.name, slug: entry.club.slug, logo_url: entry.club.logo, primary_color: entry.club.color, offer_count: entry.offers.length },
      geometry: { type: "Point" as const, coordinates: [entry.lng, entry.lat] },
    }));
  }, [activeTab, filteredClubs, filteredEvents, filteredOffers, locale]);

  // Items for the results grid (includes items without location)
  const listItems = useMemo(() => {
    if (activeTab === "clubs") {
      return filteredClubs.map((c) => ({
        id: c.id, type: "club" as const, title: c.name,
        subtitle: [c.city, c.country].filter(Boolean).join(", ") || null,
        tags: c.tags?.map((tag) => getTagLabel(tag, locale)) ?? [],
        slug: c.slug, logo_url: c.logo_url, primary_color: c.primary_color ?? "#16a34a",
        hasLocation: c.latitude != null, latitude: c.latitude, longitude: c.longitude,
      }));
    }
    if (activeTab === "events") {
      return filteredEvents.map((e) => ({
        id: e.id, type: "event" as const,
        title: locale === "es" && e.title_es ? e.title_es : e.title,
        subtitle: e.club_name, date: e.date, time: e.time, price: e.price,
        image_url: e.image_url, location_name: e.location_name, slug: e.club_slug, logo_url: e.club_logo,
        primary_color: e.club_primary_color ?? "#16a34a",
        hasLocation: (e.latitude ?? e.club_latitude) != null,
        latitude: e.latitude ?? e.club_latitude, longitude: e.longitude ?? e.club_longitude,
      }));
    }
    const byClub = new Map<string, { club_name: string; club_slug: string; logo: string | null; color: string; hasLocation: boolean; lat: number | null; lng: number | null; offers: typeof filteredOffers }>();
    for (const o of filteredOffers) {
      if (!byClub.has(o.club_slug)) {
        byClub.set(o.club_slug, { club_name: o.club_name, club_slug: o.club_slug, logo: o.club_logo, color: o.club_primary_color ?? "#16a34a", hasLocation: o.club_latitude != null, lat: o.club_latitude, lng: o.club_longitude, offers: [] });
      }
      byClub.get(o.club_slug)!.offers.push(o);
    }
    return Array.from(byClub.values()).map((entry) => ({
      id: entry.club_slug, type: "offer" as const, title: entry.club_name,
      subtitle: entry.offers.map((o) => locale === "es" && o.offer_name_es ? o.offer_name_es : o.offer_name).join(", "),
      offer_count: entry.offers.length, slug: entry.club_slug, logo_url: entry.logo,
      primary_color: entry.color, hasLocation: entry.hasLocation, latitude: entry.lat, longitude: entry.lng,
    }));
  }, [activeTab, filteredClubs, filteredEvents, filteredOffers, locale]);

  // Programmatic fly-to (from card click, search, near-me)
  const flyTo = useCallback((lat: number, lng: number, zoom = 15) => {
    setViewport({ latitude: lat, longitude: lng, zoom });
    setFlyToTrigger((t) => t + 1);
  }, []);

  // User drag — update viewport without triggering flyTo
  const handleMapMove = useCallback((v: MapViewport) => {
    setViewport(v);
  }, []);

  const handleSelectItem = useCallback((id: string, lat?: number | null, lng?: number | null) => {
    setSelectedId(id);
    if (lat != null && lng != null) {
      flyTo(lat, lng);
      // Scroll to map section
      mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [flyTo]);

  const handleDeselectItem = useCallback(() => {
    setSelectedId(null);
  }, []);

  const handleLocationFound = useCallback((lat: number, lng: number) => {
    flyTo(lat, lng, 13);
  }, [flyTo]);

  const handleNavigateToClub = useCallback((id: string, lat: number, lng: number) => {
    setActiveTab("clubs");
    handleSelectItem(id, lat, lng);
  }, [handleSelectItem]);

  const counts = {
    clubs: filteredClubs.length,
    events: filteredEvents.length,
    offers: filteredOffers.length,
  };

  return (
    <div className="flex flex-col">
      <AgeGate />
      {/* Filter controls — above the map for clubs/events */}
      {activeTab !== "offers" && (
        <FilterControls
          activeTab={activeTab}
          selectedTags={selectedTagFilters}
          onTagsChange={setSelectedTagFilters}
          popularOffers={popularOffers}
          selectedOfferNames={selectedOfferNames}
          onOfferNamesChange={setSelectedOfferNames}
          offerSearch={offerSearch}
          onOfferSearchChange={setOfferSearch}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          locale={locale}
        />
      )}

      {/* Section 1: Map */}
      <section ref={mapSectionRef} className="relative h-[60svh] md:h-[50vh]">
        {/* Search + near-me overlay */}
        <div className="absolute top-3 left-3 right-3 z-10 flex gap-2">
          <LocationSearch onLocationFound={handleLocationFound} />
          <NearMeButton
            onLocationFound={handleLocationFound}
            clubs={clubs}
            onNavigateToClub={handleNavigateToClub}
          />
        </div>

        {/* Tab selector overlay at bottom of map */}
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div className="bg-black/70 backdrop-blur-lg rounded-xl border border-white/10">
            <FilterTabs activeTab={activeTab} onChange={setActiveTab} counts={counts} />
          </div>
        </div>

        <DiscoverMap
          features={geoFeatures}
          viewport={viewport}
          onMove={handleMapMove}
          flyToTrigger={flyToTrigger}
          selectedId={selectedId}
          onSelectMarker={handleSelectItem}
          onDeselectMarker={handleDeselectItem}
          activeTab={activeTab}
        />
      </section>

      {/* Offer filters — below the map */}
      {activeTab === "offers" && (
        <FilterControls
          activeTab={activeTab}
          selectedTags={selectedTagFilters}
          onTagsChange={setSelectedTagFilters}
          popularOffers={popularOffers}
          selectedOfferNames={selectedOfferNames}
          onOfferNamesChange={setSelectedOfferNames}
          offerSearch={offerSearch}
          onOfferSearchChange={setOfferSearch}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          locale={locale}
        />
      )}

      {/* Section 2: Results */}
      <section className="landing-dark border-t border-white/10">

        {/* Results grid */}
        <ResultsGrid
          items={listItems}
          selectedId={selectedId}
          onSelect={handleSelectItem}
          activeTab={activeTab}
        />
      </section>
    </div>
  );
}
