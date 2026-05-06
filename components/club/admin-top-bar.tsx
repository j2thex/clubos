"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/provider";
import { useScrollDirection } from "@/lib/hooks/use-scroll-direction";
import { LanguageSwitcher } from "@/lib/i18n/switcher";
import { LogoutButton } from "@/app/[clubSlug]/admin/logout-button";
import { PanicIconButton } from "./panic-icon-button";
import {
  adminNavItems,
  filterAdminNavItems,
  isAdminItemActive,
} from "./admin-nav-items";
import { OperationsNavLink } from "./operations-nav-link";

interface AdminTopBarProps {
  clubId: string;
  clubName: string;
  clubSlug: string;
  coverUrl: string | null;
  opsEnabled: boolean;
  autoHideEnabled?: boolean;
}

export function AdminTopBar({
  clubId,
  clubName,
  clubSlug,
  coverUrl,
  opsEnabled,
  autoHideEnabled = true,
}: AdminTopBarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const basePath = `/${clubSlug}/admin`;
  const hidden = useScrollDirection({ disabled: !autoHideEnabled });

  if (pathname.endsWith("/admin/login")) return null;

  const visibleItems = filterAdminNavItems(adminNavItems, { opsEnabled });

  return (
    <div
      className={`sticky top-0 z-50 bg-cover bg-center transition-transform duration-200 will-change-transform ${
        coverUrl ? "" : "bg-gradient-to-br from-gray-800 to-gray-900"
      } ${hidden ? "-translate-y-full" : "translate-y-0"}`}
      style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
    >
      {coverUrl && <div className="absolute inset-0 bg-black/70" />}
      <div className="relative max-w-5xl mx-auto px-4 py-2 flex items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <PanicIconButton clubId={clubId} clubSlug={clubSlug} actor="owner" />
          <div className="min-w-0 hidden sm:block">
            <p className="text-sm font-bold text-white truncate leading-tight">
              {t("admin.title")}
            </p>
            <p className="text-[11px] text-gray-300 truncate leading-tight">{clubName}</p>
          </div>
        </div>

        <nav className="flex-1 min-w-0 overflow-x-auto overscroll-x-contain">
          <ul className="flex items-center gap-1 min-w-max">
            {visibleItems.map((item) => {
              const href = `${basePath}${item.path}`;
              const isActive = isAdminItemActive(item, pathname, basePath);
              const linkClass = `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? "bg-white text-gray-900"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`;
              const inner = (
                <>
                  <span className="h-4 w-4 [&_svg]:h-4 [&_svg]:w-4">{item.icon}</span>
                  <span className="whitespace-nowrap">{t(item.labelKey)}</span>
                </>
              );

              return (
                <li key={item.labelKey} className="shrink-0">
                  {item.path === "/operations" ? (
                    <OperationsNavLink
                      portal="admin"
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
            href={`/${clubSlug}/staff`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-block text-[11px] text-gray-300 hover:text-white border border-gray-500/50 rounded-lg px-2 py-1 transition-colors whitespace-nowrap"
          >
            {t("admin.staffConsole")}
          </a>
          <a
            href={`/${clubSlug}/public`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-block text-[11px] text-gray-300 hover:text-white border border-gray-500/50 rounded-lg px-2 py-1 transition-colors whitespace-nowrap"
          >
            {t("admin.publicPage")}
          </a>
          <LanguageSwitcher />
          <LogoutButton clubSlug={clubSlug} />
        </div>
      </div>
    </div>
  );
}
