"use client";

import { useState } from "react";

export function NearMeButton({
  onLocationFound,
}: {
  onLocationFound: (lat: number, lng: number) => void;
}) {
  const [loading, setLoading] = useState(false);

  function handleClick() {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationFound(pos.coords.latitude, pos.coords.longitude);
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: false },
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title="Near me"
      className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/20 disabled:opacity-50 transition"
    >
      {loading ? (
        <div className="w-3.5 h-3.5 border border-white/30 border-t-white/60 rounded-full animate-spin" />
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M2 12h2m16 0h2" />
        </svg>
      )}
    </button>
  );
}
