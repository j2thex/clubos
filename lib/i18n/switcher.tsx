"use client";

import { useLanguage } from "./provider";

interface LanguageSwitcherProps {
  /** "light" for dark backgrounds (staff/admin headers), "dark" for light backgrounds, "auto" for theme-aware */
  variant?: "light" | "dark" | "auto";
}

export function LanguageSwitcher({ variant = "light" }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLanguage();

  const containerStyles =
    variant === "auto"
      ? "bg-white/90 dark:bg-white/10 border border-gray-200 dark:border-white/15 shadow-sm backdrop-blur"
      : variant === "light"
      ? "bg-white/95 border border-gray-200 shadow-sm backdrop-blur"
      : "bg-white border border-gray-200 shadow-sm";

  const activeStyles =
    variant === "auto"
      ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm"
      : "bg-gray-900 text-white shadow-sm";

  const inactiveStyles =
    variant === "auto"
      ? "text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
      : "text-gray-500 hover:text-gray-900";

  const buttonBase =
    "min-w-[2.25rem] px-3 py-1 text-xs font-semibold tracking-wide rounded-full transition-colors";

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full p-1 ${containerStyles}`}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        aria-pressed={locale === "en"}
        onClick={() => setLocale("en")}
        className={`${buttonBase} ${locale === "en" ? activeStyles : inactiveStyles}`}
      >
        EN
      </button>
      <button
        type="button"
        aria-pressed={locale === "es"}
        onClick={() => setLocale("es")}
        className={`${buttonBase} ${locale === "es" ? activeStyles : inactiveStyles}`}
      >
        ES
      </button>
    </div>
  );
}
