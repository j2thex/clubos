import { VERTICALS } from "./verticals";
import Link from "next/link";
import type { Metadata } from "next";
import { getBreadcrumbListJsonLd } from "@/lib/structured-data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://osocios.club";

export const metadata: Metadata = {
  title: "Examples",
  description:
    "See how osocios.club works for different types of businesses — sports clubs, bars, coworking spaces, and more.",
  alternates: {
    canonical: "/examples",
    languages: {
      en: "/examples",
      es: "/examples",
      "x-default": "/examples",
    },
  },
};

export default function ExamplesPage() {
  const breadcrumbJsonLd = getBreadcrumbListJsonLd([
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Examples", url: `${SITE_URL}/examples` },
  ]);

  return (
    <div className="min-h-screen landing-dark">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Nav */}
      <div className="flex items-center justify-between px-6 sm:px-10 pt-6">
        <Link href="/" className="text-xs font-mono tracking-widest uppercase opacity-60 hover:opacity-100 transition-opacity">
          osocios.club
        </Link>
        <Link
          href="/onboarding"
          className="text-xs font-medium opacity-60 hover:opacity-100 transition-opacity"
        >
          Get started &rarr;
        </Link>
      </div>

      {/* Hero */}
      <div className="px-6 sm:px-10 pt-20 pb-16 sm:pt-28 sm:pb-20">
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extralight tracking-tight max-w-4xl">
          See it in action
        </h1>
        <p className="mt-4 text-sm sm:text-base opacity-50 max-w-lg font-light leading-relaxed">
          Every business is different. Explore example portals for your industry and see how osocios.club adapts to your needs.
        </p>
      </div>

      {/* Grid — full width */}
      <div className="px-6 sm:px-10 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {VERTICALS.map((v) => (
            <Link
              key={v.slug}
              href={`/examples/${v.slug}`}
              className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.03] overflow-hidden hover:bg-white/[0.06] transition-all duration-300"
            >
              {/* Color bar */}
              <div
                className="h-32 sm:h-40 w-full relative"
                style={{ background: `linear-gradient(135deg, ${v.primaryColor}, ${v.secondaryColor})` }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl sm:text-6xl font-black text-white/20">
                    {v.name.split(" ")[0]}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h2 className="font-semibold text-sm">{v.name}</h2>
                <p className="mt-2 text-xs font-light text-white/50 leading-relaxed">
                  {v.tagline}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40">
                      {v.sampleEvents.length} events
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40">
                      {v.sampleServices.length} services
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40">
                      {v.sampleQuests.length} quests
                    </span>
                  </div>
                  <span
                    className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: v.primaryColor }}
                  >
                    &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="border-t border-white/[0.04] px-6 sm:px-10 py-16 sm:py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-extralight tracking-tight">
          Ready to build yours?
        </h2>
        <p className="mt-3 text-sm opacity-50 font-light">
          Set up your club portal in minutes. No credit card required.
        </p>
        <Link
          href="/onboarding"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-sm font-medium uppercase tracking-widest text-primary-foreground transition-all hover:brightness-110 hover:scale-[1.02]"
        >
          Get started free
        </Link>
      </div>
    </div>
  );
}
