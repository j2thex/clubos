"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X, Search } from "lucide-react";
import { useLanguage } from "@/lib/i18n/provider";
import {
  SECTION_GRADIENT,
  SECTION_LABEL_KEY,
  SECTION_ORDER,
  type SectionKey,
} from "@/lib/nav/tile-colors";
import type { TileDef } from "@/lib/nav/destinations";

interface AppDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Portal label key, e.g. 'nav.appDrawer.titleAdmin'. */
  titleKey: string;
  /** Pre-filtered tiles (caller applies flag gating). */
  tiles: TileDef[];
  /** Base path the tile paths are appended to, e.g. `/${slug}/admin`. */
  basePath: string;
}

export function AppDrawer({ open, onClose, titleKey, tiles, basePath }: AppDrawerProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const lastPathnameRef = useRef(pathname);

  // Close on route change.
  useEffect(() => {
    if (open && pathname !== lastPathnameRef.current) {
      onClose();
    }
    lastPathnameRef.current = pathname;
  }, [pathname, open, onClose]);

  // Esc to close + body scroll lock.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (tile: TileDef) => {
      if (!q) return true;
      const label = t(tile.labelKey).toLowerCase();
      const sectionLabel = t(SECTION_LABEL_KEY[tile.section]).toLowerCase();
      return label.includes(q) || sectionLabel.includes(q);
    };

    const bySection = new Map<SectionKey, TileDef[]>();
    for (const tile of tiles) {
      if (!matches(tile)) continue;
      const arr = bySection.get(tile.section) ?? [];
      arr.push(tile);
      bySection.set(tile.section, arr);
    }
    return SECTION_ORDER.map((section) => ({
      section,
      tiles: bySection.get(section) ?? [],
    })).filter((g) => g.tiles.length > 0);
  }, [tiles, query, t]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t(titleKey)}
      className="fixed inset-0 z-[60] flex items-start justify-end"
    >
      <button
        type="button"
        aria-label={t("nav.appDrawer.close")}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        className="relative h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 sm:my-2 sm:mr-2 sm:h-[calc(100vh-1rem)] sm:rounded-2xl sm:max-h-[760px]"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <h2 className="flex-1 text-base font-semibold text-gray-900 truncate">
            {t(titleKey)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("nav.appDrawer.close")}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("nav.appDrawer.search")}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:bg-white transition"
              autoFocus
            />
          </div>
        </div>

        {/* Tiles */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-2">
          {groups.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              {t("nav.appDrawer.noResults")}
            </p>
          ) : (
            groups.map(({ section, tiles: sectionTiles }) => (
              <div key={section} className="mt-4 first:mt-0">
                <h3 className="text-[11px] font-bold tracking-widest uppercase text-gray-500 mb-2 px-1">
                  {t(SECTION_LABEL_KEY[section])}
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {sectionTiles.map((tile) => {
                    const Icon = tile.icon;
                    const href = `${basePath}${tile.path}`;
                    return (
                      <button
                        key={tile.key}
                        type="button"
                        onClick={() => {
                          onClose();
                          router.push(href);
                        }}
                        className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br ${SECTION_GRADIENT[tile.section]} p-3 min-h-[88px] text-white shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all`}
                      >
                        <Icon className="h-7 w-7" strokeWidth={2} />
                        <span className="text-[11px] font-semibold leading-tight text-center break-words">
                          {t(tile.labelKey)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
