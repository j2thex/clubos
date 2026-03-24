// Server-side geocoding using OpenStreetMap Nominatim (free, no API key)
// Rate limit: 1 request/second, User-Agent required
export async function geocodeAddress(
  query: string
): Promise<{ lat: number; lng: number; display_name: string } | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "osocios.club/1.0" },
  });

  if (!res.ok) return null;
  const data = await res.json();
  if (!data.length) return null;

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    display_name: data[0].display_name,
  };
}
