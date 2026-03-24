"use client";

import { useState, useTransition } from "react";
import { updateClubLocation, findCoordinates } from "./location-actions";

interface LocationData {
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}

export function LocationManager({
  location,
  clubId,
  clubSlug,
}: {
  location: LocationData;
  clubId: string;
  clubSlug: string;
}) {
  const [address, setAddress] = useState(location.address ?? "");
  const [city, setCity] = useState(location.city ?? "");
  const [country, setCountry] = useState(location.country ?? "");
  const [latitude, setLatitude] = useState<number | null>(location.latitude);
  const [longitude, setLongitude] = useState<number | null>(location.longitude);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleGeocode() {
    setGeocoding(true);
    setError(null);
    const query = [address, city, country].filter(Boolean).join(", ");
    const result = await findCoordinates(query);
    setGeocoding(false);
    if ("error" in result) {
      setError(result.error);
    } else {
      setLatitude(result.lat);
      setLongitude(result.lng);
    }
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    formData.set("clubId", clubId);
    formData.set("clubSlug", clubSlug);
    formData.set("address", address);
    formData.set("city", city);
    formData.set("country", country);
    if (latitude != null) formData.set("latitude", String(latitude));
    if (longitude != null) formData.set("longitude", String(longitude));

    startTransition(async () => {
      const result = await updateClubLocation(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
        Location
      </h2>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <form action={handleSubmit} className="divide-y divide-gray-100">
          <div className="px-5 py-4 space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Barcelona"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Spain"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                />
              </div>
            </div>
          </div>

          <div className="px-5 py-3 space-y-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleGeocode}
                disabled={geocoding || (!address && !city)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                {geocoding ? "Searching..." : "Find Coordinates"}
              </button>
              {latitude != null && longitude != null && (
                <span className="text-xs text-green-600 font-medium">
                  {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </span>
              )}
            </div>
            {latitude == null && (
              <p className="text-xs text-gray-400">
                Enter an address and click Find Coordinates to locate your club
                on the map
              </p>
            )}
          </div>

          <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
            <div>
              {success && (
                <span className="text-xs text-green-600 font-medium">
                  Location saved
                </span>
              )}
              {error && (
                <span className="text-xs text-red-600 font-medium">
                  {error}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-gray-800 text-white px-5 py-1.5 text-xs font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Saving..." : "Save Location"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
