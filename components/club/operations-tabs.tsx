"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/provider";

export interface OperationsTab {
  key: string;
  labelKey: string;
  href: string;
  badge?: number | string;
}

interface OperationsTabsProps {
  portal: "admin" | "staff";
  tabs: OperationsTab[];
  navPosition?: "bottom" | "top";
}

const STORAGE_KEY_PREFIX = "clubos:lastOpsTab";

export function operationsTabsStorageKey(portal: "admin" | "staff") {
  return `${STORAGE_KEY_PREFIX}:${portal}`;
}

export function OperationsTabs({
  portal,
  tabs,
  navPosition = "bottom",
}: OperationsTabsProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const handleClick = (key: string) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(operationsTabsStorageKey(portal), key);
    } catch {
      // localStorage unavailable; ignore.
    }
  };

  // In top-nav mode the AdminTopBar / StaffTopBar is sticky top-0 z-50.
  // Sticking these tabs at top-0 hides them behind the top bar on scroll;
  // offset by the top bar's height so they pin just below it instead.
  const stickyOffsetClass = navPosition === "top" ? "top-14" : "top-0";

  return (
    <nav
      className={`sticky ${stickyOffsetClass} z-30 -mx-4 px-4 py-2 bg-white shadow-sm border-b border-gray-200`}
    >
      <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.key}
              href={tab.href}
              onClick={() => handleClick(tab.key)}
              className={`inline-flex items-center min-h-[40px] whitespace-nowrap px-4 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
              }`}
            >
              <span>{t(tab.labelKey)}</span>
              {tab.badge !== undefined && tab.badge !== null && tab.badge !== "" && (
                <span
                  className={`ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold leading-none ${
                    isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
