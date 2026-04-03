"use client";

import Link from "next/link";
import type { ActiveTab } from "../lib/types";

interface ListItem {
  id: string;
  type: "club" | "event" | "offer" | "quest";
  title: string;
  subtitle?: string | null;
  tags?: string[];
  date?: string | null;
  time?: string | null;
  price?: number | null;
  offer_count?: number;
  reward_spins?: number;
  location_name?: string | null;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  hasLocation: boolean;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string | null;
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" });
}

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

function ResultCard({
  item,
  selected,
  onSelect,
}: {
  item: ListItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const directionsUrl = item.hasLocation && item.latitude != null && item.longitude != null
    ? `https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}`
    : null;

  return (
    <div
      onClick={onSelect}
      className={`rounded-xl border cursor-pointer transition-all hover:border-white/25 hover:bg-white/[0.06] ${
        selected ? "border-white/25 bg-white/[0.08] ring-1 ring-primary/30" : "border-white/10 bg-white/[0.04]"
      }`}
    >
      {/* Event image tile */}
      {item.type === "event" && item.image_url && (
        <div className="relative h-36 overflow-hidden rounded-t-xl">
          <img src={item.image_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold text-white overflow-hidden"
            style={{ backgroundColor: item.logo_url ? undefined : item.primary_color }}
          >
            {item.logo_url ? (
              <img src={item.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              item.title.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-white truncate">{item.title}</p>
            {item.subtitle && (
              <p className="text-sm text-white/60 truncate mt-0.5">{item.subtitle}</p>
            )}
          </div>
          {item.hasLocation && (
            <div className="shrink-0 w-2 h-2 rounded-full bg-primary/80 mt-2" title="On map" />
          )}
        </div>

        {/* Event date/time */}
        {item.type === "event" && item.date && (
          <div className="flex items-center gap-2 mt-3 text-sm">
            <span className="text-white/70 font-medium">{formatDate(item.date)}</span>
            {item.time && <span className="text-white/50">{formatTime(item.time)}</span>}
            {item.price != null && item.price > 0 && (
              <span className="ml-auto text-white/60 font-semibold">&euro;{item.price}</span>
            )}
            {(item.price == null || item.price === 0) && (
              <span className="ml-auto text-primary/80 text-xs font-medium">Free</span>
            )}
          </div>
        )}

        {/* Offer count */}
        {item.type === "offer" && item.offer_count != null && (
          <p className="text-xs text-white/50 mt-2">{item.offer_count} offers available</p>
        )}

        {/* Quest reward */}
        {item.type === "quest" && item.reward_spins != null && (
          <p className="text-xs text-primary/80 mt-2 font-medium">🎡 {item.reward_spins} {item.reward_spins === 1 ? "spin" : "spins"}</p>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {item.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/[0.08] text-white/60">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.08]">
          <Link
            href={`/${item.slug}/public`}
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            View club
          </Link>
          {directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/[0.08] text-white/60 hover:bg-white/[0.12] hover:text-white/80 transition-colors flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Directions
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function ResultsGrid({
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
      <div className="flex items-center justify-center py-16 px-6">
        <div className="text-center">
          <p className="text-sm text-white/50">No {activeTab} found</p>
          <p className="text-xs text-white/30 mt-1">Try adjusting your filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <p className="text-sm text-white/50 mb-4 font-mono">{items.length} {activeTab}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => (
          <ResultCard
            key={item.id}
            item={item}
            selected={selectedId === item.id}
            onSelect={() => onSelect(item.id, item.latitude, item.longitude)}
          />
        ))}
      </div>
    </div>
  );
}
