"use client";

import type { ActiveTab } from "../lib/types";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { Building2, CalendarDays, Gift, Target } from "lucide-react";
import type { ReactNode } from "react";

const TABS: { key: ActiveTab; label: string; labelEs: string; icon: ReactNode }[] = [
  { key: "clubs", label: "Clubs", labelEs: "Clubes", icon: <Building2 className="w-4 h-4" /> },
  { key: "events", label: "Events", labelEs: "Eventos", icon: <CalendarDays className="w-4 h-4" /> },
  { key: "offers", label: "Offers", labelEs: "Ofertas", icon: <Gift className="w-4 h-4" /> },
  { key: "quests", label: "Quests", labelEs: "Misiones", icon: <Target className="w-4 h-4" /> },
];

export function FilterTabs({
  activeTab,
  onChange,
  counts,
  locale = "en",
}: {
  activeTab: ActiveTab;
  onChange: (tab: ActiveTab) => void;
  counts: Record<ActiveTab, number>;
  locale?: Locale;
}) {
  return (
    <div className="px-2 sm:px-4 py-1.5">
      <div className="flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex-1 min-w-0 flex items-center justify-center gap-1 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-landing-surface-hover text-landing-text"
                : "text-landing-text-secondary hover:text-landing-text hover:bg-landing-surface-hover"
            }`}
          >
            <span className="shrink-0">{tab.icon}</span>
            <span className="truncate">{locale === "es" ? tab.labelEs : tab.label}</span>
            <span className={`shrink-0 text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key ? "bg-landing-surface-hover text-landing-text" : "bg-landing-surface-hover text-landing-text-secondary"
            }`}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
