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
  /** Tone of the trigger — match it to the surrounding header. */
  variant?: "light" | "dark";
}

export function AppDrawerTrigger({
  portal,
  clubSlug,
  flags,
  variant = "dark",
}: AppDrawerTriggerProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const tiles = filterTiles(portal === "admin" ? ADMIN_TILES : STAFF_TILES, flags);
  const basePath = `/${clubSlug}/${portal}`;
  const titleKey =
    portal === "admin" ? "nav.appDrawer.titleAdmin" : "nav.appDrawer.titleStaff";

  const buttonClass =
    variant === "light"
      ? "p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 transition-colors"
      : "p-2 rounded-lg text-white hover:bg-white/15 border border-white/30 transition-colors";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("nav.appDrawer.openLabel")}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={buttonClass}
      >
        <LayoutGrid className="h-4 w-4" />
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
