"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/provider";

interface AdminContentSubNavProps {
  clubSlug: string;
  opsEnabled: boolean;
}

interface PillItem {
  labelKey: string;
  path: string;
}

export function AdminContentSubNav({ clubSlug, opsEnabled }: AdminContentSubNavProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const basePath = `/${clubSlug}/admin`;

  const items: PillItem[] = [
    { labelKey: "nav.content", path: "/content" },
    { labelKey: "admin.contentQuests", path: "/quests" },
    { labelKey: "admin.contentEvents", path: "/events" },
    { labelKey: "admin.contentOffers", path: "/offers" },
    ...(opsEnabled ? [{ labelKey: "admin.contentProducts", path: "/products" }] : []),
  ];

  return (
    <nav className="sticky top-0 z-30 -mx-4 px-4 py-2 bg-gray-50/95 backdrop-blur border-b border-gray-200">
      <div
        className="flex gap-2 overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item) => {
          const href = `${basePath}${item.path}`;
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={item.path}
              href={href}
              className={`inline-flex items-center min-h-[40px] whitespace-nowrap px-4 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
              }`}
            >
              {t(item.labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
