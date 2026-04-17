import "server-only";

import { reverseGeocodeNominatim } from "@/app/discover/lib/geocode";

export type ParsedMapsCoords = { lat: number; lng: number };
export type ReverseGeocodeResult = {
  address: string;
  city: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
};

function extractCoords(url: string): ParsedMapsCoords | null {
  // Patterns observed in the wild:
  //   https://www.google.com/maps/@41.3874,2.1686,15z
  //   https://www.google.com/maps/place/Name/@41.3874,2.1686,15z/data=!3m1...
  //   https://www.google.com/maps/place/Name/data=!3d41.3874!4d2.1686
  //   https://www.google.com/maps?q=41.3874,2.1686
  //   https://www.google.com/maps?ll=41.3874,2.1686
  const patterns: RegExp[] = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
    /[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
  }
  return null;
}

const SHORT_HOSTS = ["maps.app.goo.gl", "goo.gl", "g.co"];

async function expandShortUrl(url: string): Promise<string | null> {
  try {
    const parsed = new URL(url);
    if (!SHORT_HOSTS.includes(parsed.host)) return null;
    const res = await fetch(url, { redirect: "follow" });
    // `res.url` is the final URL after redirects
    return res.url || null;
  } catch {
    return null;
  }
}

export async function parseMapsUrl(input: string): Promise<ParsedMapsCoords | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const direct = extractCoords(trimmed);
  if (direct) return direct;

  const expanded = await expandShortUrl(trimmed);
  if (expanded) {
    const fromExpanded = extractCoords(expanded);
    if (fromExpanded) return fromExpanded;
  }
  return null;
}

async function reverseGeocodeGoogle(
  lat: number,
  lng: number,
): Promise<Omit<ReverseGeocodeResult, "latitude" | "longitude"> | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;
  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("latlng", `${lat},${lng}`);
    url.searchParams.set("key", apiKey);
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status: string;
      results?: Array<{
        formatted_address: string;
        address_components: Array<{ long_name: string; short_name: string; types: string[] }>;
      }>;
    };
    if (data.status !== "OK" || !data.results?.length) return null;
    const top = data.results[0];
    const get = (type: string) =>
      top.address_components.find((c) => c.types.includes(type))?.long_name ?? null;
    const streetNum = get("street_number");
    const route = get("route");
    const city = get("locality") ?? get("postal_town") ?? get("administrative_area_level_2");
    const country = get("country");
    const street = [route, streetNum].filter(Boolean).join(" ").trim();
    const address = street || top.formatted_address;
    return { address, city, country };
  } catch {
    return null;
  }
}

export async function reverseGeocode(
  coords: ParsedMapsCoords,
): Promise<ReverseGeocodeResult | null> {
  const viaGoogle = await reverseGeocodeGoogle(coords.lat, coords.lng);
  if (viaGoogle) return { ...viaGoogle, latitude: coords.lat, longitude: coords.lng };

  const viaNominatim = await reverseGeocodeNominatim(coords.lat, coords.lng);
  if (viaNominatim) return { ...viaNominatim, latitude: coords.lat, longitude: coords.lng };

  return null;
}
