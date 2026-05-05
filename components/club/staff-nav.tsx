"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/provider";
import {
  staffNavItems,
  filterStaffNavItems,
  isStaffItemActive,
} from "./staff-nav-items";
import { OperationsNavLink } from "./operations-nav-link";

interface StaffNavProps {
  clubSlug: string;
  spinEnabled: boolean;
  operationsEnabled: boolean;
  qeboEnabled: boolean;
  badges?: Record<string, number>;
}

export function StaffNav({
  clubSlug,
  spinEnabled,
  operationsEnabled,
  qeboEnabled,
  badges,
}: StaffNavProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const basePath = `/${clubSlug}/staff`;

  if (pathname.endsWith("/staff/login")) {
    return null;
  }

  const visibleItems = filterStaffNavItems(staffNavItems, {
    spinEnabled,
    operationsEnabled,
    qeboEnabled,
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
      <div className="overflow-x-auto overscroll-x-contain">
        <div className="mx-auto flex min-w-max max-w-md items-center justify-around pb-2 pt-2">
          {visibleItems.map((item) => {
            const href = `${basePath}${item.path}`;
            const isActive = isStaffItemActive(item, pathname, basePath);

            const badge = badges?.[item.path] ?? 0;
            const linkClass = `flex shrink-0 flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
              isActive ? "text-gray-900 font-semibold" : "text-gray-400 hover:text-gray-600"
            }`;
            const inner = (
              <>
                <span className="relative inline-flex">
                  {item.icon}
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none flex items-center justify-center">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </span>
                <span>{t(item.labelKey)}</span>
              </>
            );

            if (item.path === "/operations") {
              return (
                <OperationsNavLink
                  key={item.labelKey}
                  portal="staff"
                  clubSlug={clubSlug}
                  className={linkClass}
                >
                  {inner}
                </OperationsNavLink>
              );
            }

            return (
              <Link key={item.labelKey} href={href} className={linkClass}>
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="h-safe-area-inset-bottom pb-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
