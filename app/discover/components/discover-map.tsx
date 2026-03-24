"use client";

import { useRef, useCallback, useEffect } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import Supercluster from "supercluster";
import useSupercluster from "use-supercluster";
import { DEFAULT_MAP_STYLE } from "../lib/map-styles";
import type { ActiveTab, MapViewport } from "../lib/types";
import "maplibre-gl/dist/maplibre-gl.css";

interface FeatureProperties {
  id: string;
  type: "club" | "event" | "offer";
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
}

type GeoFeature = GeoJSON.Feature<GeoJSON.Point, FeatureProperties>;

function ClubMarker({ feature, selected, onClick }: { feature: GeoFeature; selected: boolean; onClick: () => void }) {
  const { logo_url, primary_color, name } = feature.properties;
  return (
    <button
      onClick={onClick}
      className={`relative group transition-transform ${selected ? "scale-125 z-10" : "hover:scale-110"}`}
    >
      <div
        className={`w-10 h-10 rounded-full border-2 overflow-hidden shadow-lg flex items-center justify-center text-white text-xs font-bold ${
          selected ? "border-white ring-2 ring-white/30" : "border-white/60"
        }`}
        style={{ backgroundColor: logo_url ? undefined : primary_color }}
      >
        {logo_url ? (
          <img src={logo_url} alt="" className="w-full h-full object-cover" />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </div>
      {/* Name tooltip on hover */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <span className="text-[10px] font-medium text-white bg-black/80 px-2 py-0.5 rounded whitespace-nowrap">
          {name}
        </span>
      </div>
    </button>
  );
}

function EventMarker({ feature, selected, onClick }: { feature: GeoFeature; selected: boolean; onClick: () => void }) {
  const { name, date, primary_color } = feature.properties;
  const day = date ? new Date(date + "T00:00:00").getDate() : "?";
  const month = date ? new Date(date + "T00:00:00").toLocaleString("en", { month: "short" }) : "";

  return (
    <button
      onClick={onClick}
      className={`relative group transition-transform ${selected ? "scale-125 z-10" : "hover:scale-110"}`}
    >
      <div
        className={`w-10 h-12 rounded-lg overflow-hidden shadow-lg flex flex-col items-center justify-center text-white ${
          selected ? "ring-2 ring-white/30" : ""
        }`}
        style={{ backgroundColor: primary_color }}
      >
        <span className="text-[9px] font-medium uppercase leading-none opacity-80">{month}</span>
        <span className="text-sm font-bold leading-none">{day}</span>
      </div>
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <span className="text-[10px] font-medium text-white bg-black/80 px-2 py-0.5 rounded whitespace-nowrap max-w-[150px] truncate block">
          {name}
        </span>
      </div>
    </button>
  );
}

function OfferMarker({ feature, selected, onClick }: { feature: GeoFeature; selected: boolean; onClick: () => void }) {
  const { logo_url, primary_color, name, offer_count } = feature.properties;
  return (
    <button
      onClick={onClick}
      className={`relative group transition-transform ${selected ? "scale-125 z-10" : "hover:scale-110"}`}
    >
      <div className="relative">
        <div
          className={`w-10 h-10 rounded-full border-2 overflow-hidden shadow-lg flex items-center justify-center text-white text-xs font-bold ${
            selected ? "border-white ring-2 ring-white/30" : "border-white/60"
          }`}
          style={{ backgroundColor: logo_url ? undefined : primary_color }}
        >
          {logo_url ? (
            <img src={logo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            name.charAt(0).toUpperCase()
          )}
        </div>
        {offer_count != null && offer_count > 1 && (
          <span className="absolute -top-1 -right-1 bg-white text-gray-900 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
            {offer_count}
          </span>
        )}
      </div>
    </button>
  );
}

function ClusterMarker({ count, onClick }: { count: number; onClick: () => void }) {
  const size = count < 10 ? 36 : count < 50 ? 42 : 50;
  return (
    <button
      onClick={onClick}
      className="transition-transform hover:scale-110"
    >
      <div
        className="rounded-full bg-primary/80 border-2 border-primary/40 shadow-lg flex items-center justify-center text-white font-bold"
        style={{ width: size, height: size, fontSize: size < 40 ? 12 : 14 }}
      >
        {count}
      </div>
    </button>
  );
}

export default function DiscoverMap({
  features,
  viewport,
  onViewportChange,
  selectedId,
  onSelectMarker,
  activeTab,
}: {
  features: GeoFeature[];
  viewport: MapViewport;
  onViewportChange: (v: MapViewport) => void;
  selectedId: string | null;
  onSelectMarker: (id: string, lat?: number | null, lng?: number | null) => void;
  activeTab: ActiveTab;
}) {
  const mapRef = useRef<MapRef>(null);
  const boundsRef = useRef<[number, number, number, number]>([-180, -85, 180, 85]);
  const zoomRef = useRef(viewport.zoom);

  const onMove = useCallback((evt: { viewState: { latitude: number; longitude: number; zoom: number } }) => {
    const { latitude, longitude, zoom } = evt.viewState;
    zoomRef.current = zoom;
    onViewportChange({ latitude, longitude, zoom });

    const map = mapRef.current?.getMap();
    if (map) {
      const b = map.getBounds();
      if (b) {
        boundsRef.current = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
      }
    }
  }, [onViewportChange]);

  // Fly to viewport when it changes externally
  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      map.flyTo({
        center: [viewport.longitude, viewport.latitude],
        zoom: viewport.zoom,
        duration: 1200,
      });
    }
  }, [viewport.latitude, viewport.longitude, viewport.zoom]);

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
    onViewportChange({ latitude: lat, longitude: lng, zoom: Math.min(zoom, 18) });
  }, [supercluster, onViewportChange]);

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        latitude: viewport.latitude,
        longitude: viewport.longitude,
        zoom: viewport.zoom,
      }}
      onMove={onMove}
      mapStyle={DEFAULT_MAP_STYLE}
      style={{ width: "100%", height: "100%" }}
      attributionControl={false}
    >
      <NavigationControl position="bottom-right" showCompass={false} />

      {clusters.map((cluster) => {
        const [lng, lat] = cluster.geometry.coordinates;
        const props = cluster.properties as FeatureProperties & { cluster?: boolean; cluster_id?: number; point_count?: number };

        if (props.cluster) {
          return (
            <Marker key={`cluster-${props.cluster_id}`} latitude={lat} longitude={lng} anchor="center">
              <ClusterMarker
                count={props.point_count ?? 0}
                onClick={() => handleClusterClick(props.cluster_id!, lng, lat)}
              />
            </Marker>
          );
        }

        const isSelected = selectedId === props.id;

        if (activeTab === "events") {
          return (
            <Marker key={props.id} latitude={lat} longitude={lng} anchor="center">
              <EventMarker
                feature={cluster as GeoFeature}
                selected={isSelected}
                onClick={() => onSelectMarker(props.id, lat, lng)}
              />
            </Marker>
          );
        }

        if (activeTab === "offers") {
          return (
            <Marker key={props.id} latitude={lat} longitude={lng} anchor="center">
              <OfferMarker
                feature={cluster as GeoFeature}
                selected={isSelected}
                onClick={() => onSelectMarker(props.id, lat, lng)}
              />
            </Marker>
          );
        }

        // Default: club marker
        return (
          <Marker key={props.id} latitude={lat} longitude={lng} anchor="center">
            <ClubMarker
              feature={cluster as GeoFeature}
              selected={isSelected}
              onClick={() => onSelectMarker(props.id, lat, lng)}
            />
          </Marker>
        );
      })}
    </Map>
  );
}
