/**
 * Extract a Google Place ID from various Google Maps URL formats
 * or accept a raw Place ID string (ChIJ...).
 *
 * Supported formats:
 * - Direct Place ID: "ChIJxxxxxxx"
 * - Full URL: "https://www.google.com/maps/place/...!1sChIJ..."
 * - Short link: "https://maps.app.goo.gl/xxx" (follows redirect)
 * - CID URL: not supported (CID ≠ Place ID, needs API to convert)
 */

export async function extractPlaceId(
  input: string,
): Promise<string | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Direct Place ID (starts with ChIJ, typically 27+ chars)
  if (/^ChIJ[A-Za-z0-9_-]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  let url = trimmed;

  // Follow redirects for short links (maps.app.goo.gl, goo.gl/maps)
  if (
    url.includes("maps.app.goo.gl") ||
    url.includes("goo.gl/maps")
  ) {
    try {
      const response = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
      });
      url = response.url;
    } catch {
      // If redirect fails, try to parse as-is
    }
  }

  // Extract Place ID from full Google Maps URL
  // Pattern: "!1s" followed by the Place ID (ChIJ...)
  const placeIdMatch = url.match(/!1s(ChIJ[A-Za-z0-9_-]+)/);
  if (placeIdMatch) {
    return placeIdMatch[1];
  }

  // Pattern: /place/ URLs sometimes have place_id in query params
  const urlObj = safeParseUrl(url);
  if (urlObj) {
    const pid = urlObj.searchParams.get("place_id");
    if (pid) return pid;
  }

  // Pattern: ftid= parameter (another Google Maps format)
  const ftidMatch = url.match(/ftid=(0x[a-f0-9]+:[a-f0-9]+)/);
  if (ftidMatch) {
    // ftid is not a Place ID but can be used in some contexts
    // For now, return null — requires API to convert
    return null;
  }

  return null;
}

/**
 * Generate the direct Google review URL from a Place ID.
 */
export function getReviewUrl(placeId: string): string {
  return `https://search.google.com/local/writereview?placeid=${placeId}`;
}

function safeParseUrl(str: string): URL | null {
  try {
    return new URL(str);
  } catch {
    return null;
  }
}
