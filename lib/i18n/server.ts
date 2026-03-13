import "server-only";
import { headers } from "next/headers";
import { type Locale, DEFAULT_LOCALE } from "./index";

/**
 * Get the current locale in Server Components via the x-lang header.
 */
export async function getServerLocale(): Promise<Locale> {
  const h = await headers();
  const lang = h.get("x-lang");
  if (lang === "es") return "es";
  return DEFAULT_LOCALE;
}
