"use client";

import { useState, useRef } from "react";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface ClubWithLocation {
  id: string;
  latitude: number | null;
  longitude: number | null;
}

export function NearMeButton({
  onLocationFound,
  clubs,
  onNavigateToClub,
  locale = "en",
}: {
  onLocationFound: (lat: number, lng: number) => void;
  clubs?: ClubWithLocation[];
  onNavigateToClub?: (id: string, lat: number, lng: number) => void;
  locale?: Locale;
}) {
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  function findClosestClub(userLat: number, userLng: number): ClubWithLocation | null {
    if (!clubs || clubs.length === 0) return null;
    let closest: ClubWithLocation | null = null;
    let minDist = Infinity;
    for (const club of clubs) {
      if (club.latitude == null || club.longitude == null) continue;
      const dLat = club.latitude - userLat;
      const dLng = club.longitude - userLng;
      const dist = dLat * dLat + dLng * dLng;
      if (dist < minDist) {
        minDist = dist;
        closest = club;
      }
    }
    return closest;
  }

  function handleClick() {
    if (!navigator.geolocation) return;
    setLoading(true);
    if (timerRef.current) clearTimeout(timerRef.current);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onLocationFound(latitude, longitude);
        setLoading(false);

        // After centering on user, fly to closest club
        if (onNavigateToClub) {
          const closest = findClosestClub(latitude, longitude);
          if (closest && closest.latitude != null && closest.longitude != null) {
            timerRef.current = setTimeout(() => {
              onNavigateToClub(closest.id, closest.latitude!, closest.longitude!);
            }, 800);
          }
        }
      },
      () => {
        setLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: false },
    );
  }

  const label = loading ? t(locale, "discover.nearMeLocating") : t(locale, "discover.nearMeLabel");

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={t(locale, "discover.nearMeLabel")}
      className="shrink-0 h-10 px-3 flex items-center justify-center gap-2 rounded-lg bg-white/[0.08] border border-white/10 text-white/70 hover:text-white/90 hover:border-white/25 disabled:opacity-50 transition"
    >
      {loading ? (
        <div className="w-3.5 h-3.5 border border-white/30 border-t-white/60 rounded-full animate-spin" />
      ) : (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M2 12h2m16 0h2" />
        </svg>
      )}
      <span className="hidden sm:inline text-xs font-medium">{label}</span>
    </button>
  );
}
