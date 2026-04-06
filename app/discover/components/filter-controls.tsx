"use client";

import type { ActiveTab } from "../lib/types";
import { t } from "@/lib/i18n";
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
  popularOffers: { name: string; clubCount: number }[];
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
      <div className="px-4 py-2 border-b border-landing-border">
        <p className="text-[10px] uppercase tracking-wider text-landing-text-tertiary font-medium mb-1.5">{t(locale, "discover.filterByType")}</p>
        <div className="flex flex-wrap gap-1.5">
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
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                active
                  ? "bg-landing-surface-hover text-landing-text"
                  : "bg-landing-surface text-landing-text-secondary hover:text-landing-text hover:bg-landing-surface-hover"
              }`}
            >
              {getTagLabel(tag.value, locale)}
            </button>
          );
        })}
        {selectedTags.length > 0 && (
          <button
            onClick={() => onTagsChange([])}
            className="px-2 py-1 text-xs text-landing-text-secondary hover:text-landing-text transition-colors"
          >
            Clear
          </button>
        )}
        </div>
      </div>
    );
  }

  if (activeTab === "events") {
    return (
      <div className="px-4 py-2 border-b border-landing-border">
        <p className="text-[10px] uppercase tracking-wider text-landing-text-tertiary font-medium mb-1.5">{t(locale, "discover.filterByDate")}</p>
        <div className="flex gap-1.5">
        {DATE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onDateFilterChange(opt.value)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              dateFilter === opt.value
                ? "bg-landing-surface-hover text-landing-text"
                : "bg-landing-surface text-landing-text-secondary hover:text-landing-text hover:bg-landing-surface-hover"
            }`}
          >
            {locale === "es" ? opt.es : opt.en}
          </button>
        ))}
        </div>
      </div>
    );
  }

  // Quests — no filters for now
  if (activeTab === "quests") return null;

  // Offers — search + specific offer name pills
  const hasFilters = selectedOfferNames.length > 0 || offerSearch.length > 0;

  return (
    <div className="px-4 py-2 space-y-2 border-b border-landing-border">
      <p className="text-[10px] uppercase tracking-wider text-landing-text-tertiary font-medium">{t(locale, "discover.filterOffers")}</p>
      {/* Search input */}
      <div className="relative">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-landing-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={offerSearch}
          onChange={(e) => onOfferSearchChange(e.target.value)}
          placeholder={t(locale, "discover.searchOffers")}
          className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-landing-surface-hover border border-landing-border text-xs text-landing-text placeholder:text-landing-text-tertiary focus:outline-none focus:border-landing-border transition"
        />
      </div>

      {/* Popular offer pills */}
      {popularOffers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {popularOffers.map((offer) => {
            const active = selectedOfferNames.includes(offer.name);
            return (
              <button
                key={offer.name}
                onClick={() => {
                  if (active) {
                    onOfferNamesChange(selectedOfferNames.filter((n) => n !== offer.name));
                  } else {
                    onOfferNamesChange([...selectedOfferNames, offer.name]);
                  }
                }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  active
                    ? "bg-landing-surface-hover text-landing-text"
                    : "bg-landing-surface text-landing-text-secondary hover:text-landing-text hover:bg-landing-surface-hover"
                }`}
              >
                {offer.name} <span className="opacity-60">({offer.clubCount})</span>
              </button>
            );
          })}
          {hasFilters && (
            <button
              onClick={() => { onOfferNamesChange([]); onOfferSearchChange(""); }}
              className="px-2 py-1 text-xs text-landing-text-secondary hover:text-landing-text transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
