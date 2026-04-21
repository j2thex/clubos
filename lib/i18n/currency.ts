import type { Locale } from "./index";

export type Currency = "EUR" | "USD";

const FRACTION_DIGITS: Record<Currency, number> = { EUR: 2, USD: 2 };

function intlLocale(locale: Locale): string {
  return locale === "es" ? "es-ES" : "en-US";
}

/**
 * Format a numeric amount as currency. Accepts decimals (e.g. 12.5 for €12.50),
 * matching product_transactions.total_price numeric(10,2).
 */
export function formatMoney(
  amount: number,
  currency: Currency = "EUR",
  locale: Locale = "en",
): string {
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency,
    minimumFractionDigits: FRACTION_DIGITS[currency],
    maximumFractionDigits: FRACTION_DIGITS[currency],
  }).format(amount);
}

/**
 * Percentage delta with explicit sign, e.g. "+12.4%" / "−3.1%" / "—" when the
 * previous value is 0 or undefined.
 */
export function formatDelta(
  current: number,
  previous: number | undefined,
  locale: Locale = "en",
): string {
  if (previous === undefined || previous === 0 || !Number.isFinite(previous)) return "—";
  const pct = ((current - previous) / previous) * 100;
  if (!Number.isFinite(pct)) return "—";
  const fmt = new Intl.NumberFormat(intlLocale(locale), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: "always",
  }).format(pct);
  return `${fmt}%`;
}

/** Signed money delta like "+€42.10" — blank when previous is not comparable. */
export function formatMoneyDelta(
  current: number,
  previous: number | undefined,
  currency: Currency = "EUR",
  locale: Locale = "en",
): string {
  if (previous === undefined || !Number.isFinite(previous)) return "—";
  const diff = current - previous;
  if (!Number.isFinite(diff)) return "—";
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency,
    minimumFractionDigits: FRACTION_DIGITS[currency],
    maximumFractionDigits: FRACTION_DIGITS[currency],
    signDisplay: "always",
  }).format(diff);
}
