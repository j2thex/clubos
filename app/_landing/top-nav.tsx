"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/lib/i18n/switcher";
import { useLanguage } from "@/lib/i18n/provider";
import { localized } from "@/lib/i18n";

const NAV_LINKS: { href: string; en: string; es: string; hideOnXs?: boolean }[] = [
  { href: "/for-clubs", en: "For Clubs", es: "Para Clubes", hideOnXs: true },
  { href: "/discover", en: "Discover", es: "Descubrir" },
  { href: "/contact", en: "Contact", es: "Contacto", hideOnXs: true },
];

export function TopNav() {
  const pathname = usePathname();
  const { locale, t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 12);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 transition-[background-color,backdrop-filter,border-color,transform,opacity] duration-500 ease-out ${
        scrolled
          ? "bg-[color:var(--landing-bg)]/70 backdrop-blur-md border-b border-landing-border"
          : "bg-transparent border-b border-transparent"
      } ${mounted ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"}`}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        <Link
          href="/"
          className="text-xs font-mono tracking-widest uppercase opacity-80 hover:opacity-100 transition-opacity shrink-0"
        >
          {t("landing.brandName")}
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs transition-opacity ${
                  active ? "opacity-100" : "opacity-60 hover:opacity-100"
                } ${link.hideOnXs ? "hidden sm:inline" : ""}`}
              >
                {localized(link.en, link.es, locale)}
              </Link>
            );
          })}
          <ThemeToggle />
          <LanguageSwitcher variant="auto" />
        </nav>
      </div>
    </header>
  );
}
