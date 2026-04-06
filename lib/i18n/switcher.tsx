"use client";

import { useLanguage } from "./provider";

interface LanguageSwitcherProps {
  /** "light" for dark backgrounds (staff/admin headers), "dark" for light backgrounds, "auto" for theme-aware */
  variant?: "light" | "dark" | "auto";
}

export function LanguageSwitcher({ variant = "light" }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLanguage();

  const baseStyles = "text-xs font-medium px-2 py-1 rounded-md transition-colors";
  const activeLight = "bg-white/20 text-white";
  const inactiveLight = "text-gray-400 hover:text-white";
  const activeDark = "bg-gray-200 text-gray-900";
  const inactiveDark = "text-gray-400 hover:text-gray-600";
  const activeAuto = "bg-landing-surface-hover text-landing-text";
  const inactiveAuto = "text-landing-text-tertiary hover:text-landing-text";

  const active = variant === "auto" ? activeAuto : variant === "light" ? activeLight : activeDark;
  const inactive = variant === "auto" ? inactiveAuto : variant === "light" ? inactiveLight : inactiveDark;

  return (
    <div className={`flex items-center gap-0.5 rounded-lg border p-0.5 ${variant === "auto" ? "border-landing-border-subtle" : "border-gray-600/30"}`}>
      <button
        onClick={() => setLocale("en")}
        className={`${baseStyles} ${locale === "en" ? active : inactive}`}
      >
        EN
      </button>
      <button
        onClick={() => setLocale("es")}
        className={`${baseStyles} ${locale === "es" ? active : inactive}`}
      >
        ES
      </button>
    </div>
  );
}
