"use client";

import { useState } from "react";
import Link from "next/link";

interface ServiceItem {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  club_name: string;
  club_slug: string;
  club_logo: string | null;
  club_color: string | null;
}

export function ServiceFinder({
  services,
  labels,
}: {
  services: ServiceItem[];
  labels: {
    title: string;
    subtitle: string;
    placeholder: string;
    noResults: string;
    free: string;
    viewClub: string;
  };
}) {
  const [query, setQuery] = useState("");

  if (services.length === 0) return null;

  const filtered = query.trim()
    ? services.filter(
        (s) =>
          s.title.toLowerCase().includes(query.toLowerCase()) ||
          s.description?.toLowerCase().includes(query.toLowerCase()) ||
          s.club_name.toLowerCase().includes(query.toLowerCase()),
      )
    : services;

  return (
    <section className="landing-dark px-6 py-20 sm:py-28 border-t border-white/[0.04]">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl sm:text-4xl lg:text-5xl font-extralight tracking-tight">
          {labels.title}
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-center text-sm opacity-60">
          {labels.subtitle}
        </p>

        {/* Search */}
        <div className="mt-10 max-w-md mx-auto">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={labels.placeholder}
            className="w-full rounded-full bg-white/[0.06] border border-white/[0.08] px-5 py-3 text-sm placeholder:opacity-50 focus:outline-none focus:border-white/[0.15] transition-colors"
          />
        </div>

        {/* Results */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((s) => (
            <Link
              key={s.id}
              href={`/${s.club_slug}/public`}
              className="group rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 hover:bg-white/[0.06] transition-colors duration-300 block"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-sm">{s.title}</h3>
                  {s.description && (
                    <p className="mt-1 text-xs opacity-60 line-clamp-2">{s.description}</p>
                  )}
                </div>
                {s.price !== null && (
                  <span className="text-sm font-mono opacity-60 shrink-0">
                    {s.price === 0 ? labels.free : `€${s.price}`}
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2 pt-3 border-t border-white/[0.04]">
                {s.club_logo ? (
                  <img src={s.club_logo} alt="" className="w-5 h-5 rounded object-cover" />
                ) : (
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center text-white text-[8px] font-medium"
                    style={{ backgroundColor: s.club_color || "#16a34a" }}
                  >
                    {s.club_name.charAt(0)}
                  </div>
                )}
                <span className="text-[10px] opacity-50">{s.club_name}</span>
                <span className="text-[10px] opacity-40 ml-auto">{labels.viewClub}</span>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-sm opacity-50 mt-8">{labels.noResults}</p>
        )}
      </div>
    </section>
  );
}
