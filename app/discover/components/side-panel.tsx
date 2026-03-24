"use client";

import Link from "next/link";
import type { ActiveTab } from "../lib/types";

interface ListItem {
  id: string;
  type: "club" | "event" | "offer";
  title: string;
  subtitle?: string | null;
  tags?: string[];
  date?: string | null;
  time?: string | null;
  price?: number | null;
  offer_count?: number;
  location_name?: string | null;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  hasLocation: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function DirectionsLink({ lat, lng }: { lat: number; lng: number }) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[10px] text-white/30 hover:text-white/50 transition-colors flex items-center gap-0.5"
      onClick={(e) => e.stopPropagation()}
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      Directions
    </a>
  );
}

function PanelCard({
  item,
  selected,
  onSelect,
}: {
  item: ListItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`px-4 py-3 flex items-start gap-3 cursor-pointer transition-colors border-b border-white/[0.04] ${
        selected ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
      }`}
    >
      {/* Logo / avatar */}
      <div
        className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-sm font-bold text-white overflow-hidden"
        style={{ backgroundColor: item.logo_url ? undefined : item.primary_color }}
      >
        {item.logo_url ? (
          <img src={item.logo_url} alt="" className="w-full h-full object-cover" />
        ) : (
          item.title.charAt(0).toUpperCase()
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-white truncate">{item.title}</p>
          {!item.hasLocation && (
            <span className="text-[9px] text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded shrink-0">No map</span>
          )}
        </div>

        {item.subtitle && (
          <p className="text-xs text-white/40 truncate mt-0.5">{item.subtitle}</p>
        )}

        {/* Event date/time */}
        {item.type === "event" && item.date && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-white/50 font-medium">{formatDate(item.date)}</span>
            {item.time && <span className="text-[10px] text-white/30">{formatTime(item.time)}</span>}
            {item.price != null && item.price > 0 && (
              <span className="text-[10px] text-white/40 font-medium">€{item.price}</span>
            )}
          </div>
        )}

        {/* Offer count */}
        {item.type === "offer" && item.offer_count != null && (
          <p className="text-[10px] text-white/30 mt-0.5">{item.offer_count} offers</p>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/40">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center gap-3 mt-1.5">
          <Link
            href={`/${item.slug}/public`}
            className="text-[10px] text-primary/60 hover:text-primary/80 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            View club →
          </Link>
          {item.hasLocation && item.latitude != null && item.longitude != null && (
            <DirectionsLink lat={item.latitude} lng={item.longitude} />
          )}
        </div>
      </div>
    </div>
  );
}

export function SidePanel({
  items,
  selectedId,
  onSelect,
  activeTab,
}: {
  items: ListItem[];
  selectedId: string | null;
  onSelect: (id: string, lat?: number | null, lng?: number | null) => void;
  activeTab: ActiveTab;
}) {
  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm text-white/30">No {activeTab} found</p>
          <p className="text-xs text-white/15 mt-1">Try adjusting your filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      {items.map((item) => (
        <PanelCard
          key={item.id}
          item={item}
          selected={selectedId === item.id}
          onSelect={() => onSelect(item.id, item.latitude, item.longitude)}
        />
      ))}
    </div>
  );
}
