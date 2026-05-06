"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/provider";
import { useScrollDirection } from "@/lib/hooks/use-scroll-direction";
import { LanguageSwitcher } from "@/lib/i18n/switcher";
import { PanicIconButton } from "./panic-icon-button";
import { StaffLogoutButton } from "./staff-logout-button";
import {
  staffNavItems,
  filterStaffNavItems,
  isStaffItemActive,
} from "./staff-nav-items";
import { OperationsNavLink } from "./operations-nav-link";

interface StaffTopBarProps {
  clubId: string;
  clubName: string;
  clubSlug: string;
  coverUrl: string | null;
  spinEnabled: boolean;
  operationsEnabled: boolean;
  qeboEnabled: boolean;
  badges?: Record<string, number>;
  autoHideEnabled?: boolean;
}

export function StaffTopBar({
  clubId,
  clubName,
  clubSlug,
  coverUrl,
  spinEnabled,
  operationsEnabled,
  qeboEnabled,
  badges,
  autoHideEnabled = true,
}: StaffTopBarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const basePath = `/${clubSlug}/staff`;
  const hidden = useScrollDirection({ disabled: !autoHideEnabled });

  if (pathname.endsWith("/staff/login")) return null;

  const visibleItems = filterStaffNavItems(staffNavItems, {
    spinEnabled,
    operationsEnabled,
    qeboEnabled,
  });

  return (
    <div
      className={`sticky top-0 z-50 bg-cover bg-center transition-transform duration-200 will-change-transform ${
        coverUrl ? "" : "bg-gradient-to-br from-gray-800 to-gray-900"
      } ${hidden ? "-translate-y-full" : "translate-y-0"}`}
      style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
    >
      {coverUrl && <div className="absolute inset-0 bg-black/70" />}
      <div className="relative max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <PanicIconButton clubId={clubId} clubSlug={clubSlug} actor="staff" />
          <div className="min-w-0 hidden sm:block">
            <p className="text-sm font-bold text-white truncate leading-tight">
              {t("staff.consoleTitle")}
            </p>
            <p className="text-[11px] text-gray-300 truncate leading-tight">{clubName}</p>
          </div>
        </div>

        <nav className="flex-1 min-w-0 overflow-x-auto overscroll-x-contain">
          <ul className="flex items-center gap-1 min-w-max">
            {visibleItems.map((item) => {
              const href = `${basePath}${item.path}`;
              const isActive = isStaffItemActive(item, pathname, basePath);
              const badge = badges?.[item.path] ?? 0;
              const linkClass = `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? "bg-white text-gray-900"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`;
              const inner = (
                <>
                  <span className="relative inline-flex">
                    <span className="h-4 w-4 [&_svg]:h-4 [&_svg]:w-4">{item.icon}</span>
                    {badge > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[14px] h-3.5 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold leading-none flex items-center justify-center">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </span>
                  <span className="whitespace-nowrap">{t(item.labelKey)}</span>
                </>
              );

              return (
                <li key={item.labelKey} className="shrink-0">
                  {item.path === "/operations" ? (
                    <OperationsNavLink
                      portal="staff"
                      clubSlug={clubSlug}
                      className={linkClass}
                    >
                      {inner}
                    </OperationsNavLink>
                  ) : (
                    <Link href={href} className={linkClass}>
                      {inner}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`/${clubSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-block text-[11px] text-gray-300 hover:text-white border border-gray-500/50 rounded-lg px-2 py-1 transition-colors whitespace-nowrap"
          >
            {t("staff.memberPortal")}
          </a>
          <a
            href={`/${clubSlug}/public`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-block text-[11px] text-gray-300 hover:text-white border border-gray-500/50 rounded-lg px-2 py-1 transition-colors whitespace-nowrap"
          >
            {t("staff.publicPage")}
          </a>
          <LanguageSwitcher variant="light" />
          <StaffLogoutButton clubSlug={clubSlug} />
        </div>
      </div>
    </div>
  );
}
