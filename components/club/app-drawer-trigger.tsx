"use client";

import { useState } from "react";
import { LayoutGrid } from "lucide-react";
import { useLanguage } from "@/lib/i18n/provider";
import { AppDrawer } from "./app-drawer";
import {
  ADMIN_TILES,
  STAFF_TILES,
  filterTiles,
  type TileFlags,
} from "@/lib/nav/destinations";

interface AppDrawerTriggerProps {
  portal: "admin" | "staff";
  clubSlug: string;
  flags: TileFlags;
  /** Drives vertical offset so the FAB clears the bottom nav (or sits low in top-nav mode). */
  navPosition: "bottom" | "top";
}

export function AppDrawerTrigger({
  portal,
  clubSlug,
  flags,
  navPosition,
}: AppDrawerTriggerProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const tiles = filterTiles(portal === "admin" ? ADMIN_TILES : STAFF_TILES, flags);
  const basePath = `/${clubSlug}/${portal}`;
  const titleKey =
    portal === "admin" ? "nav.appDrawer.titleAdmin" : "nav.appDrawer.titleStaff";

  // Vertical offset: clear the bottom nav (~80-90px + safe area) in bottom-nav
  // mode; sit just above the safe-area in top-nav mode.
  const bottomOffset =
    navPosition === "bottom"
      ? "calc(5.25rem + env(safe-area-inset-bottom))"
      : "calc(1.25rem + env(safe-area-inset-bottom))";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("nav.appDrawer.openLabel")}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="fixed left-1/2 -translate-x-1/2 z-40 h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500 via-violet-500 to-amber-500 text-white shadow-lg ring-1 ring-black/5 hover:shadow-xl hover:scale-105 active:scale-95 transition flex items-center justify-center"
        style={{ bottom: bottomOffset }}
      >
        <LayoutGrid className="h-6 w-6" strokeWidth={2.25} />
      </button>
      <AppDrawer
        open={open}
        onClose={() => setOpen(false)}
        titleKey={titleKey}
        tiles={tiles}
        basePath={basePath}
      />
    </>
  );
}
