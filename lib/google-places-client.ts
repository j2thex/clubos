"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

export function isGooglePlacesEnabled(): boolean {
  return !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
}

let placesPromise: Promise<google.maps.PlacesLibrary | null> | null = null;

export function loadPlaces(): Promise<google.maps.PlacesLibrary | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return Promise.resolve(null);

  if (!placesPromise) {
    setOptions({ key: apiKey, v: "weekly" });
    placesPromise = importLibrary("places").catch(() => null);
  }
  return placesPromise;
}
