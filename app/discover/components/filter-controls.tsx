"use client";

import type { ActiveTab } from "../lib/types";
import type { Locale } from "@/lib/i18n";
import { PREDEFINED_TAGS, getTagLabel } from "@/lib/tags";

const DATE_OPTIONS = [
  { value: "all", en: "All dates", es: "Todas las fechas" },
  { value: "today", en: "Today", es: "Hoy" },
  { value: "week", en: "This week", es: "Esta semana" },
  { value: "month", en: "This month", es: "Este mes" },
] as const;

export function FilterControls({
  activeTab,
  selectedTags,
  onTagsChange,
  popularOffers,
  selectedOfferNames,
  onOfferNamesChange,
  offerSearch,
  onOfferSearchChange,
  dateFilter,
  onDateFilterChange,
  locale,
}: {
  activeTab: ActiveTab;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  popularOffers: string[];
  selectedOfferNames: string[];
  onOfferNamesChange: (names: string[]) => void;
  offerSearch: string;
  onOfferSearchChange: (q: string) => void;
  dateFilter: "all" | "today" | "week" | "month";
  onDateFilterChange: (f: "all" | "today" | "week" | "month") => void;
  locale: Locale;
}) {
  if (activeTab === "clubs") {
    return (
      <div className="px-4 py-2 flex flex-wrap gap-1.5 border-b border-white/[0.06]">
        {PREDEFINED_TAGS.slice(0, 10).map((tag) => {
          const active = selectedTags.includes(tag.value);
          return (
            <button
              key={tag.value}
              onClick={() => {
                if (active) {
                  onTagsChange(selectedTags.filter((t) => t !== tag.value));
                } else {
                  onTagsChange([...selectedTags, tag.value]);
                }
              }}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                active
                  ? "bg-white/15 text-white"
                  : "bg-white/[0.04] text-white/40 hover:text-white/60 hover:bg-white/[0.08]"
              }`}
            >
              {getTagLabel(tag.value, locale)}
            </button>
          );
        })}
        {selectedTags.length > 0 && (
          <button
            onClick={() => onTagsChange([])}
            className="px-2 py-1 text-[10px] text-white/30 hover:text-white/50 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    );
  }

  if (activeTab === "events") {
    return (
      <div className="px-4 py-2 flex gap-1.5 border-b border-white/[0.06]">
        {DATE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onDateFilterChange(opt.value)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
              dateFilter === opt.value
                ? "bg-white/15 text-white"
                : "bg-white/[0.04] text-white/40 hover:text-white/60 hover:bg-white/[0.08]"
            }`}
          >
            {locale === "es" ? opt.es : opt.en}
          </button>
        ))}
      </div>
    );
  }

  // Offers — search + specific offer name pills
  const hasFilters = selectedOfferNames.length > 0 || offerSearch.length > 0;

  return (
    <div className="px-4 py-2 space-y-2 border-b border-white/[0.06]">
      {/* Search input */}
      <div className="relative">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={offerSearch}
          onChange={(e) => onOfferSearchChange(e.target.value)}
          placeholder={locale === "es" ? "Buscar oferta..." : "Search offers..."}
          className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-white/15 transition"
        />
      </div>

      {/* Popular offer pills */}
      {popularOffers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {popularOffers.map((name) => {
            const active = selectedOfferNames.includes(name);
            return (
              <button
                key={name}
                onClick={() => {
                  if (active) {
                    onOfferNamesChange(selectedOfferNames.filter((n) => n !== name));
                  } else {
                    onOfferNamesChange([...selectedOfferNames, name]);
                  }
                }}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                  active
                    ? "bg-white/15 text-white"
                    : "bg-white/[0.04] text-white/40 hover:text-white/60 hover:bg-white/[0.08]"
                }`}
              >
                {name}
              </button>
            );
          })}
          {hasFilters && (
            <button
              onClick={() => { onOfferNamesChange([]); onOfferSearchChange(""); }}
              className="px-2 py-1 text-[10px] text-white/30 hover:text-white/50 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
