"use client";

import type { ActiveTab } from "../lib/types";

const TABS: { key: ActiveTab; label: string; icon: string }[] = [
  { key: "clubs", label: "Clubs", icon: "🏠" },
  { key: "events", label: "Events", icon: "📅" },
  { key: "offers", label: "Offers", icon: "✨" },
  { key: "quests", label: "Quests", icon: "🎯" },
];

export function FilterTabs({
  activeTab,
  onChange,
  counts,
}: {
  activeTab: ActiveTab;
  onChange: (tab: ActiveTab) => void;
  counts: Record<ActiveTab, number>;
}) {
  return (
    <div className="flex gap-1 px-4 py-2 border-b border-white/10">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === tab.key
              ? "bg-white/15 text-white"
              : "text-white/70 hover:text-white/90 hover:bg-white/[0.08]"
          }`}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
            activeTab === tab.key ? "bg-white/20 text-white/80" : "bg-white/[0.08] text-white/60"
          }`}>
            {counts[tab.key]}
          </span>
        </button>
      ))}
    </div>
  );
}
