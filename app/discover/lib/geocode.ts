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

export async function reverseGeocodeNominatim(
  lat: number,
  lng: number,
): Promise<{ address: string; city: string | null; country: string | null } | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "osocios.club/1.0" },
  });

  if (!res.ok) return null;
  const data = await res.json();
  if (!data || !data.address) return null;

  const a = data.address;
  const streetParts = [a.road, a.house_number].filter(Boolean);
  const address = streetParts.length > 0 ? streetParts.join(" ") : (data.display_name ?? "");
  const city = a.city ?? a.town ?? a.village ?? a.municipality ?? null;
  const country = a.country ?? null;

  return { address, city, country };
}
