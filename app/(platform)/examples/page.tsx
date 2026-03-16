import { VERTICALS } from "./verticals";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Examples | osocios.club",
  description: "See how osocios.club works for different types of businesses — sports clubs, bars, coworking spaces, and more.",
};

export default function ExamplesPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="px-6 pt-16 pb-12 text-center max-w-3xl mx-auto">
        <Link href="/" className="text-sm text-white/50 hover:text-white/80 transition-colors">
          &larr; Back to osocios.club
        </Link>
        <h1 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-extralight tracking-tight">
          See it in action
        </h1>
        <p className="mt-4 text-sm text-white/60 max-w-md mx-auto">
          Every business is different. Explore example portals for your industry and see how osocios.club adapts to your needs.
        </p>
      </div>

      {/* Grid */}
      <div className="px-6 pb-20 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {VERTICALS.map((v) => (
            <Link
              key={v.slug}
              href={`/examples/${v.slug}`}
              className="group rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 hover:bg-white/[0.06] transition-all duration-300"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold mb-4"
                style={{ backgroundColor: v.primaryColor }}
              >
                {v.name.charAt(0)}
              </div>
              <h2 className="font-medium text-sm">{v.name}</h2>
              <p className="mt-2 text-xs font-light text-white/50 leading-relaxed">
                {v.tagline}
              </p>
              <p className="mt-3 text-xs font-medium group-hover:translate-x-1 transition-transform" style={{ color: v.primaryColor }}>
                View example &rarr;
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
