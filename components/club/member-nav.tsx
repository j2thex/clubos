"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Target, CalendarDays, Gift, ShoppingBag, UserCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n/provider";

interface MemberNavProps {
  clubSlug: string;
}

type NavItem = {
  labelKey: string;
  path: string;
  matchPaths: string[];
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
};

const navItems: NavItem[] = [
  {
    labelKey: "nav.quests",
    path: "",
    matchPaths: ["", "/quests"],
    Icon: Target,
  },
  {
    labelKey: "nav.events",
    path: "/events",
    matchPaths: ["/events"],
    Icon: CalendarDays,
  },
  {
    labelKey: "nav.bonuses",
    path: "/bonuses",
    matchPaths: ["/bonuses", "/spin", "/history"],
    Icon: Gift,
  },
  {
    labelKey: "nav.offers",
    path: "/offers",
    matchPaths: ["/offers"],
    Icon: ShoppingBag,
  },
  {
    labelKey: "nav.profile",
    path: "/profile",
    matchPaths: ["/profile"],
    Icon: UserCircle,
  },
];

function isItemActive(item: NavItem, clubSlug: string, pathname: string): boolean {
  const root = `/${clubSlug}`;
  if (item.matchPaths.includes("")) {
    if (pathname === root || pathname === `${root}/`) return true;
  }
  return item.matchPaths.some(
    (p) => p !== "" && (pathname === `${root}${p}` || pathname.startsWith(`${root}${p}/`)),
  );
}

export function MemberNav({ clubSlug }: MemberNavProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  useEffect(() => {
    setPendingPath(null);
  }, [pathname]);

  if (pathname.endsWith("/login")) {
    return null;
  }

  const activePath = pendingPath ?? pathname;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white"
      style={{ borderColor: "var(--m-border)" }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-1">
        {navItems.map((item) => {
          const href = `/${clubSlug}${item.path}`;
          const isActive = isItemActive(item, clubSlug, activePath);
          const Icon = item.Icon;

          return (
            <Link
              key={item.labelKey}
              href={href}
              onClick={() => setPendingPath(href)}
              aria-current={isActive ? "page" : undefined}
              className="relative flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors active:scale-[0.97]"
              style={{ color: isActive ? "var(--club-primary, #16a34a)" : "var(--m-ink-muted)" }}
            >
              {isActive && (
                <span
                  aria-hidden
                  className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full"
                  style={{ backgroundColor: "var(--club-primary, #16a34a)" }}
                />
              )}
              <Icon className="h-6 w-6" strokeWidth={isActive ? 2.25 : 1.75} />
              <span className="leading-none">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
      <div className="pb-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
