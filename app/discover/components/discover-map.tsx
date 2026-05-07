"use client";

import { useRef, useCallback, useEffect } from "react";
import { useTheme } from "next-themes";
import Map, { Marker, Popup } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import useSupercluster from "use-supercluster";
import { MAP_STYLE_DARK, MAP_STYLE_LIGHT } from "../lib/map-styles";
import type { ActiveTab, MapViewport } from "../lib/types";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import Link from "next/link";
import Image from "next/image";
import { WorkingHoursBadge } from "@/components/club/working-hours-badge";
import "maplibre-gl/dist/maplibre-gl.css";

interface FeatureProperties {
  id: string;
  type: "club" | "event" | "offer" | "quest";
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  city?: string | null;
  tags?: string[] | null;
  date?: string | null;
  time?: string | null;
  club_name?: string;
  price?: number | null;
  offer_count?: number;
  reward_spins?: number;
  working_hours?: import("@/lib/working-hours").WorkingHours | null;
  timezone?: string | null;
}

type GeoFeature = GeoJSON.Feature<GeoJSON.Point, FeatureProperties>;

function ClubMarker({ feature, selected, onClick }: { feature: GeoFeature; selected: boolean; onClick: () => void }) {
  const { logo_url, primary_color, name } = feature.properties;
  return (
    <button onClick={onClick} className={`relative group transition-transform ${selected ? "scale-125 z-10" : "hover:scale-110"}`}>
      <div
        className={`w-10 h-10 rounded-full border-2 overflow-hidden shadow-lg flex items-center justify-center text-white text-xs font-bold ${selected ? "border-white ring-2 ring-white/30" : "border-white/60"}`}
        style={{ backgroundColor: logo_url ? undefined : primary_color }}
      >
        {logo_url ? <Image src={logo_url} alt="" width={40} height={40} sizes="40px" className="w-full h-full object-cover" /> : name.charAt(0).toUpperCase()}
      </div>
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <span className="text-[10px] font-medium text-white bg-black/80 px-2 py-0.5 rounded whitespace-nowrap">{name}</span>
      </div>
    </button>
  );
}

function EventMarker({ feature, selected, onClick }: { feature: GeoFeature; selected: boolean; onClick: () => void }) {
  const { date, primary_color } = feature.properties;
  const day = date ? new Date(date + "T00:00:00").getDate() : "?";
  const month = date ? new Date(date + "T00:00:00").toLocaleString("en", { month: "short" }) : "";
  return (
    <button onClick={onClick} className={`relative group transition-transform ${selected ? "scale-125 z-10" : "hover:scale-110"}`}>
      <div className={`w-10 h-12 rounded-lg overflow-hidden shadow-lg flex flex-col items-center justify-center text-white ${selected ? "ring-2 ring-white/30" : ""}`} style={{ backgroundColor: primary_color }}>
        <span className="text-[9px] font-medium uppercase leading-none opacity-80">{month}</span>
        <span className="text-sm font-bold leading-none">{day}</span>
      </div>
    </button>
  );
}

function OfferMarker({ feature, selected, onClick }: { feature: GeoFeature; selected: boolean; onClick: () => void }) {
  const { logo_url, primary_color, name, offer_count } = feature.properties;
  return (
    <button onClick={onClick} className={`relative group transition-transform ${selected ? "scale-125 z-10" : "hover:scale-110"}`}>
      <div className="relative">
        <div className={`w-10 h-10 rounded-full border-2 overflow-hidden shadow-lg flex items-center justify-center text-white text-xs font-bold ${selected ? "border-white ring-2 ring-white/30" : "border-white/60"}`} style={{ backgroundColor: logo_url ? undefined : primary_color }}>
          {logo_url ? <Image src={logo_url} alt="" width={40} height={40} sizes="40px" className="w-full h-full object-cover" /> : name.charAt(0).toUpperCase()}
        </div>
        {offer_count != null && offer_count > 1 && (
          <span className="absolute -top-1 -right-1 bg-white text-gray-900 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">{offer_count}</span>
        )}
      </div>
    </button>
  );
}

function QuestMarker({ feature, selected, onClick }: { feature: GeoFeature; selected: boolean; onClick: () => void }) {
  const { logo_url, primary_color, name, reward_spins } = feature.properties;
  return (
    <button onClick={onClick} className={`relative group transition-transform ${selected ? "scale-125 z-10" : "hover:scale-110"}`}>
      <div className="relative">
        <div className={`w-10 h-10 rounded-full border-2 overflow-hidden shadow-lg flex items-center justify-center text-white text-xs font-bold ${selected ? "border-white ring-2 ring-white/30" : "border-white/60"}`} style={{ backgroundColor: logo_url ? undefined : primary_color }}>
          {logo_url ? <Image src={logo_url} alt="" width={40} height={40} sizes="40px" className="w-full h-full object-cover" /> : name.charAt(0).toUpperCase()}
        </div>
        {reward_spins != null && (
          <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">{reward_spins}</span>
        )}
      </div>
    </button>
  );
}

function ClusterMarker({ count, onClick }: { count: number; onClick: () => void }) {
  const size = count < 10 ? 36 : count < 50 ? 42 : 50;
  return (
    <button onClick={onClick} className="transition-transform hover:scale-110">
      <div className="rounded-full bg-emerald-500 border-2 border-emerald-400/50 shadow-lg shadow-emerald-500/20 flex items-center justify-center text-white font-bold" style={{ width: size, height: size, fontSize: size < 40 ? 12 : 14 }}>
        {count}
      </div>
    </button>
  );
}

function formatPopupDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" });
}

function formatPopupTime(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

function MarkerPopup({ feature, onClose, locale = "en" }: { feature: GeoFeature; onClose: () => void; locale?: Locale }) {
  const [lng, lat] = feature.geometry.coordinates;
  const p = feature.properties;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <Popup latitude={lat} longitude={lng} anchor="bottom" offset={20} closeOnClick={false} onClose={onClose} className="discover-popup">
      <div className="min-w-[180px] max-w-[240px]">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold overflow-hidden" style={{ backgroundColor: p.logo_url ? undefined : p.primary_color }}>
            {p.logo_url ? <Image src={p.logo_url} alt="" width={32} height={32} sizes="32px" className="w-full h-full object-cover" /> : p.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
            {p.city && <p className="text-xs text-gray-500">{p.city}</p>}
            {p.club_name && <p className="text-xs text-gray-500">{p.club_name}</p>}
          </div>
        </div>

        {p.type === "event" && p.date && (
          <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
            <span className="font-medium">{formatPopupDate(p.date)}</span>
            {p.time && <span>{formatPopupTime(p.time)}</span>}
            {p.price != null && p.price > 0 && <span className="font-medium">€{p.price}</span>}
          </div>
        )}

        {p.type === "offer" && p.offer_count != null && (
          <p className="text-xs text-gray-500 mb-2">{p.offer_count} offers available</p>
        )}

        {p.type === "quest" && p.reward_spins != null && (
          <p className="text-xs text-emerald-600 font-medium mb-2">🎡 {p.reward_spins} {p.reward_spins === 1 ? "spin" : "spins"} reward</p>
        )}

        {p.tags && p.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {p.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{tag}</span>
            ))}
          </div>
        )}

        {p.type === "club" && p.working_hours && p.timezone && (
          <div className="mb-2">
            <WorkingHoursBadge
              workingHours={p.working_hours}
              timezone={p.timezone}
              locale={locale}
              className="text-gray-600"
            />
          </div>
        )}

        <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
          <Link href={`/${p.slug}/public`} className="text-xs font-medium text-primary hover:underline">
            {t(locale, "discover.viewClub")} →
          </Link>
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            {t(locale, "discover.directions")}
          </a>
        </div>
      </div>
    </Popup>
  );
}

export default function DiscoverMap({
  features,
  viewport,
  onMove: onMoveCallback,
  flyToTrigger,
  selectedId,
  onSelectMarker,
  onDeselectMarker,
  activeTab,
  scrollZoom = true,
  locale = "en",
}: {
  features: GeoFeature[];
  viewport: MapViewport;
  onMove: (v: MapViewport) => void;
  flyToTrigger: number;
  selectedId: string | null;
  onSelectMarker: (id: string, lat?: number | null, lng?: number | null) => void;
  onDeselectMarker: () => void;
  scrollZoom?: boolean;
  activeTab: ActiveTab;
  locale?: Locale;
}) {
  const { resolvedTheme } = useTheme();
  const mapStyle = resolvedTheme === "dark" ? MAP_STYLE_DARK : MAP_STYLE_LIGHT;
  const mapRef = useRef<MapRef>(null);
  const boundsRef = useRef<[number, number, number, number]>([-180, -85, 180, 85]);
  const zoomRef = useRef(viewport.zoom);

  const onMove = useCallback((evt: { viewState: { latitude: number; longitude: number; zoom: number } }) => {
    const { latitude, longitude, zoom } = evt.viewState;
    zoomRef.current = zoom;
    onMoveCallback({ latitude, longitude, zoom });

    const map = mapRef.current?.getMap();
    if (map) {
      const b = map.getBounds();
      if (b) {
        boundsRef.current = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
      }
    }
  }, [onMoveCallback]);

  // Only fly to viewport on programmatic navigation (flyToTrigger increments)
  const prevTrigger = useRef(flyToTrigger);
  useEffect(() => {
    if (flyToTrigger !== prevTrigger.current) {
      prevTrigger.current = flyToTrigger;
      const map = mapRef.current;
      if (map) {
        map.flyTo({
          center: [viewport.longitude, viewport.latitude],
          zoom: viewport.zoom,
          duration: 1200,
        });
      }
    }
  }, [flyToTrigger, viewport.latitude, viewport.longitude, viewport.zoom]);

  const points = features.map((f) => ({
    ...f,
    properties: { ...f.properties, cluster: false as const },
  }));

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds: boundsRef.current,
    zoom: zoomRef.current,
    options: { radius: 60, maxZoom: 17 },
  });

  const handleClusterClick = useCallback((clusterId: number, lng: number, lat: number) => {
    if (!supercluster) return;
    const zoom = supercluster.getClusterExpansionZoom(clusterId);
    // Cluster click is programmatic — handled via onSelectMarker flow
    onMoveCallback({ latitude: lat, longitude: lng, zoom: Math.min(zoom, 18) });
  }, [supercluster, onMoveCallback]);

  // Find selected feature for popup
  const selectedFeature = selectedId ? features.find((f) => f.properties.id === selectedId) ?? null : null;

  return (
    <Map
      ref={mapRef}
      initialViewState={{ latitude: viewport.latitude, longitude: viewport.longitude, zoom: viewport.zoom }}
      onMove={onMove}
      mapStyle={mapStyle}
      style={{ width: "100%", height: "100%" }}
      attributionControl={false}
      scrollZoom={scrollZoom}
    >
      {clusters.map((cluster) => {
        const [lng, lat] = cluster.geometry.coordinates;
        const props = cluster.properties as FeatureProperties & { cluster?: boolean; cluster_id?: number; point_count?: number };

        if (props.cluster) {
          return (
            <Marker key={`cluster-${props.cluster_id}`} latitude={lat} longitude={lng} anchor="center">
              <ClusterMarker count={props.point_count ?? 0} onClick={() => handleClusterClick(props.cluster_id!, lng, lat)} />
            </Marker>
          );
        }

        const isSelected = selectedId === props.id;

        if (activeTab === "events") {
          return (
            <Marker key={props.id} latitude={lat} longitude={lng} anchor="center">
              <EventMarker feature={cluster as GeoFeature} selected={isSelected} onClick={() => onSelectMarker(props.id, lat, lng)} />
            </Marker>
          );
        }

        if (activeTab === "offers") {
          return (
            <Marker key={props.id} latitude={lat} longitude={lng} anchor="center">
              <OfferMarker feature={cluster as GeoFeature} selected={isSelected} onClick={() => onSelectMarker(props.id, lat, lng)} />
            </Marker>
          );
        }

        if (activeTab === "quests") {
          return (
            <Marker key={props.id} latitude={lat} longitude={lng} anchor="center">
              <QuestMarker feature={cluster as GeoFeature} selected={isSelected} onClick={() => onSelectMarker(props.id, lat, lng)} />
            </Marker>
          );
        }

        return (
          <Marker key={props.id} latitude={lat} longitude={lng} anchor="center">
            <ClubMarker feature={cluster as GeoFeature} selected={isSelected} onClick={() => onSelectMarker(props.id, lat, lng)} />
          </Marker>
        );
      })}

      {/* Popup for selected marker */}
      {selectedFeature && (
        <MarkerPopup feature={selectedFeature} onClose={onDeselectMarker} locale={locale} />
      )}
    </Map>
  );
}
