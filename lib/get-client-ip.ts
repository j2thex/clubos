import { headers } from "next/headers";

export async function getClientIp(): Promise<string> {
  const h = await headers();
  // Vercel sets x-forwarded-for as a comma-separated chain; the leftmost
  // entry is the real client. Fall back to x-real-ip and finally a literal
  // "unknown" so an attacker behind a stripped proxy still hits the same
  // bucket and gets rate-limited as a single identity.
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}
