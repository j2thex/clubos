"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/provider";
import {
  adminNavItems,
  filterAdminNavItems,
  isAdminItemActive,
} from "./admin-nav-items";

interface AdminNavProps {
  clubSlug: string;
  opsEnabled?: boolean;
}

export function AdminNav({ clubSlug, opsEnabled = false }: AdminNavProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const basePath = `/${clubSlug}/admin`;

  if (pathname.endsWith("/admin/login")) {
    return null;
  }

  const visibleItems = filterAdminNavItems(adminNavItems, { opsEnabled });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-md items-center justify-around pb-2 pt-2">
        {visibleItems.map((item) => {
          const href = `${basePath}${item.path}`;
          const isActive = isAdminItemActive(item, pathname, basePath);

          return (
            <Link
              key={item.labelKey}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-1.5 py-1 text-xs transition-colors ${
                isActive ? "text-gray-900 font-semibold" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {item.icon}
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
      <div className="h-safe-area-inset-bottom pb-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
