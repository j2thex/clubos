import en from "./dictionaries/en.json";
import es from "./dictionaries/es.json";

export type Locale = "en" | "es";
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "clubos-lang";

const dictionaries: Record<Locale, Record<string, string>> = { en, es };

/**
 * Translate a key with optional parameter interpolation.
 * Falls back to English if key is missing in target locale.
 */
export function t(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>,
): string {
  let value = dictionaries[locale]?.[key] ?? dictionaries.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(`{${k}}`, String(v));
    }
  }
  return value;
}

/**
 * Detect locale from cookie value and Accept-Language header.
 * Cookie takes priority over browser detection.
 */
export function detectLocale(
  cookieValue: string | null | undefined,
  acceptLanguage: string | null | undefined,
): Locale {
  if (cookieValue === "es" || cookieValue === "en") return cookieValue;
  if (acceptLanguage) {
    const langs = acceptLanguage.toLowerCase();
    if (langs.startsWith("es") || langs.includes(",es")) return "es";
  }
  return DEFAULT_LOCALE;
}

/**
 * Get the date locale string for toLocaleDateString/toLocaleTimeString.
 */
export function getDateLocale(locale: Locale): string {
  return locale === "es" ? "es-ES" : "en-US";
}

/**
 * Pick the translated content field based on locale.
 * Falls back to the default (EN) value when the ES translation is empty/null.
 */
export function localized(
  en: string,
  es: string | null | undefined,
  locale: Locale,
): string {
  return locale === "es" && es ? es : en;
}
