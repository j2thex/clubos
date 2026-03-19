/**
 * Extract a Google Place ID from various Google Maps URL formats.
 *
 * Supported formats:
 * - Direct Place ID: "ChIJxxxxxxx"
 * - Hex Place ID: "0x12a4a2f979277f3d:0x286b3f84e2e7712d"
 * - Full URL with ChIJ: "https://www.google.com/maps/place/...!1sChIJ..."
 * - Full URL with hex: "https://www.google.com/maps/place/...!1s0x..."
 * - Short link: "https://maps.app.goo.gl/xxx" (follows redirect server-side)
 */

export async function extractPlaceId(
  input: string,
): Promise<string | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Direct Place ID (ChIJ format)
  if (/^ChIJ[A-Za-z0-9_-]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  // Direct hex format (0x....:0x....)
  if (/^0x[a-f0-9]+:0x[a-f0-9]+$/i.test(trimmed)) {
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
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; bot)",
        },
      });
      url = response.url;
    } catch {
      // If redirect fails, try to parse as-is
    }
  }

  // Extract hex Place ID: "!1s0x..." pattern (most common in Google Maps URLs)
  const hexMatch = url.match(/!1s(0x[a-f0-9]+:0x[a-f0-9]+)/i);
  if (hexMatch) {
    return hexMatch[1];
  }

  // Extract ChIJ Place ID: "!1sChIJ..." pattern
  const chijMatch = url.match(/!1s(ChIJ[A-Za-z0-9_-]+)/);
  if (chijMatch) {
    return chijMatch[1];
  }

  // Query param: place_id=...
  const urlObj = safeParseUrl(url);
  if (urlObj) {
    const pid = urlObj.searchParams.get("place_id");
    if (pid) return pid;
  }

  return null;
}

/**
 * Generate the direct Google review URL from a Place ID.
 * Works with both ChIJ and hex formats.
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
