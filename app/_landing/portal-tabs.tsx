"use client";

import { useState } from "react";

interface PortalTabsProps {
  tabs: { label: string; content: React.ReactNode }[];
}

export function PortalTabs({ tabs }: PortalTabsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="sm:hidden">
      <div className="flex rounded-xl bg-landing-surface-hover p-1 gap-1">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg text-center transition-colors ${
              index === activeIndex
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-landing-text-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-4">
        {tabs[activeIndex].content}
      </div>
    </div>
  );
}
