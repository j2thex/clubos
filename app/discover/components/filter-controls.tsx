"use client";

import type { ActiveTab } from "../lib/types";
import type { Locale } from "@/lib/i18n";
import { PREDEFINED_TAGS, getTagLabel } from "@/lib/tags";

const SUBTYPES = [
  { value: "activity", en: "Activities", es: "Actividades" },
  { value: "experience", en: "Experiences", es: "Experiencias" },
  { value: "service", en: "Services", es: "Servicios" },
  { value: "product", en: "Products", es: "Productos" },
];

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
  selectedSubtypes,
  onSubtypesChange,
  dateFilter,
  onDateFilterChange,
  locale,
}: {
  activeTab: ActiveTab;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  selectedSubtypes: string[];
  onSubtypesChange: (subtypes: string[]) => void;
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

  // Offers
  return (
    <div className="px-4 py-2 flex flex-wrap gap-1.5 border-b border-white/[0.06]">
      {SUBTYPES.map((st) => {
        const active = selectedSubtypes.includes(st.value);
        return (
          <button
            key={st.value}
            onClick={() => {
              if (active) {
                onSubtypesChange(selectedSubtypes.filter((s) => s !== st.value));
              } else {
                onSubtypesChange([...selectedSubtypes, st.value]);
              }
            }}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
              active
                ? "bg-white/15 text-white"
                : "bg-white/[0.04] text-white/40 hover:text-white/60 hover:bg-white/[0.08]"
            }`}
          >
            {locale === "es" ? st.es : st.en}
          </button>
        );
      })}
      {selectedSubtypes.length > 0 && (
        <button
          onClick={() => onSubtypesChange([])}
          className="px-2 py-1 text-[10px] text-white/30 hover:text-white/50 transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );
}
