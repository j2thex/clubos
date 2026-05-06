import type { LucideIcon } from "lucide-react";
import {
  Users,
  Target,
  CalendarDays,
  Gift,
  Package,
  LineChart,
  Wrench,
  DoorOpen,
  UsersRound,
  ShoppingCart,
  Receipt,
  BellRing,
  ScrollText,
  Settings,
  ListChecks,
  Sparkles,
  UserPlus,
  Mail,
  LayoutGrid,
} from "lucide-react";
import type { SectionKey } from "./tile-colors";

export type TileRequires = "ops" | "qebo" | "spin";

export interface TileDef {
  /** Stable key, e.g. 'admin.people'. Used for React keys and i18n fallbacks. */
  key: string;
  /** Path relative to the portal base (`/${slug}/admin` or `/${slug}/staff`). */
  path: string;
  /** Lucide icon component (rendered ~28px white). */
  icon: LucideIcon;
  /** Section drives color + grouping. */
  section: SectionKey;
  /** Gating flag — must match the layout's flags to render. */
  requires?: TileRequires;
  /** i18n key for the tile label. */
  labelKey: string;
}

export const ADMIN_TILES: TileDef[] = [
  { key: "admin.people", path: "", icon: Users, section: "people", labelKey: "nav.tiles.people" },
  { key: "admin.content", path: "/content", icon: LayoutGrid, section: "content", labelKey: "nav.tiles.content" },
  { key: "admin.quests", path: "/quests", icon: Target, section: "content", labelKey: "nav.tiles.quests" },
  { key: "admin.events", path: "/events", icon: CalendarDays, section: "content", labelKey: "nav.tiles.events" },
  { key: "admin.offers", path: "/offers", icon: Gift, section: "content", labelKey: "nav.tiles.offers" },
  { key: "admin.operations", path: "/operations", icon: Wrench, section: "ops", requires: "ops", labelKey: "nav.tiles.operations" },
  { key: "admin.products", path: "/products", icon: Package, section: "ops", requires: "ops", labelKey: "nav.tiles.products" },
  { key: "admin.finance", path: "/finance", icon: LineChart, section: "ops", requires: "ops", labelKey: "nav.tiles.finance" },
  { key: "admin.push", path: "/push", icon: BellRing, section: "comms", labelKey: "nav.tiles.push" },
  { key: "admin.email", path: "/settings#email", icon: Mail, section: "comms", labelKey: "nav.tiles.email" },
  { key: "admin.logs", path: "/logs", icon: ScrollText, section: "system", labelKey: "nav.tiles.logs" },
  { key: "admin.settings", path: "/settings", icon: Settings, section: "system", labelKey: "nav.tiles.settings" },
  { key: "admin.setup", path: "/setup", icon: ListChecks, section: "system", labelKey: "nav.tiles.setup" },
];

export const STAFF_TILES: TileDef[] = [
  { key: "staff.members", path: "/members", icon: Users, section: "people", labelKey: "nav.tiles.members" },
  { key: "staff.preregistrations", path: "/preregistrations", icon: UserPlus, section: "people", labelKey: "nav.tiles.preregistrations" },
  { key: "staff.bonuses", path: "/bonuses", icon: Sparkles, section: "content", requires: "spin", labelKey: "nav.tiles.bonuses" },
  { key: "staff.quests", path: "/quests", icon: Target, section: "content", requires: "qebo", labelKey: "nav.tiles.quests" },
  { key: "staff.events", path: "/events", icon: CalendarDays, section: "content", requires: "qebo", labelKey: "nav.tiles.events" },
  { key: "staff.offers", path: "/offers", icon: Gift, section: "content", requires: "qebo", labelKey: "nav.tiles.offers" },
  { key: "staff.operations", path: "/operations", icon: Wrench, section: "ops", requires: "ops", labelKey: "nav.tiles.operations" },
  { key: "staff.entry", path: "/operations/entry", icon: DoorOpen, section: "ops", requires: "ops", labelKey: "nav.tiles.entry" },
  { key: "staff.capacity", path: "/operations/capacity", icon: UsersRound, section: "ops", requires: "ops", labelKey: "nav.tiles.capacity" },
  { key: "staff.products", path: "/operations/products", icon: Package, section: "ops", requires: "ops", labelKey: "nav.tiles.products" },
  { key: "staff.sell", path: "/operations/sell", icon: ShoppingCart, section: "ops", requires: "ops", labelKey: "nav.tiles.sell" },
  { key: "staff.transactions", path: "/operations/transactions", icon: Receipt, section: "ops", requires: "ops", labelKey: "nav.tiles.transactions" },
];

export interface TileFlags {
  ops?: boolean;
  qebo?: boolean;
  spin?: boolean;
}

export function filterTiles(tiles: TileDef[], flags: TileFlags): TileDef[] {
  return tiles.filter((t) => {
    if (!t.requires) return true;
    if (t.requires === "ops") return !!flags.ops;
    if (t.requires === "qebo") return !!flags.qebo;
    if (t.requires === "spin") return !!flags.spin;
    return true;
  });
}
