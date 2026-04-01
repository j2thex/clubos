"use client";

import { useState, useRef, useEffect } from "react";

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

export function LocationSearch({
  onLocationFound,
}: {
  onLocationFound: (lat: number, lng: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSearch(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim() || value.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(value)}`;
        const res = await fetch(url, { headers: { "User-Agent": "osocios.club/1.0" } });
        if (res.ok) {
          const data: SearchResult[] = await res.json();
          setResults(data);
          setOpen(data.length > 0);
        }
      } catch {
        // Ignore search errors
      } finally {
        setLoading(false);
      }
    }, 500);
  }

  function selectResult(r: SearchResult) {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    onLocationFound(lat, lng);
    setQuery(r.display_name.split(",")[0]);
    setOpen(false);
    setResults([]);
  }

  return (
    <div ref={containerRef} className="flex-1 relative">
      <div className="relative">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search a city or address..."
          className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/[0.08] border border-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/25 transition"
        />
        {loading && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 border border-white/30 border-t-white/60 rounded-full animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[oklch(0.12_0.02_150)] border border-white/15 rounded-lg shadow-xl overflow-hidden z-50">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => selectResult(r)}
              className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/[0.1] hover:text-white transition-colors border-b border-white/[0.06] last:border-0"
            >
              <span className="line-clamp-1">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
