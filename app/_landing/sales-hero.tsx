import Link from "next/link";
import { ScrollReveal } from "./scroll-reveal";

type Stats = { clubs: number; members: number; events: number };

export function SalesHero({
  t,
  stats,
}: {
  t: (key: string) => string;
  stats: Stats;
}) {
  return (
    <section className="landing-dark px-6 pt-24 pb-20 sm:pt-32 sm:pb-28 border-b border-landing-border-subtle">
      <div className="mx-auto max-w-4xl text-center">
        <ScrollReveal>
          <p className="text-xs font-medium uppercase tracking-[0.2em] opacity-60">
            {t("sales.heroEyebrow")}
          </p>
          <h1 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-extralight tracking-tight">
            {t("sales.heroTitle")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg font-light opacity-70">
            {t("sales.heroSubtitle")}
          </p>
        </ScrollReveal>

        <ScrollReveal delay={120}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {t("sales.heroCtaPrimary")} →
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-landing-border-subtle px-6 py-3 text-sm font-medium hover:bg-landing-surface-hover transition-colors"
            >
              {t("sales.heroCtaSecondary")}
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <dl className="mx-auto mt-14 grid max-w-xl grid-cols-3 gap-6 text-center">
            {[
              { label: "clubs", value: stats.clubs },
              { label: "members", value: stats.members },
              { label: "events", value: stats.events },
            ].map((s) => (
              <div key={s.label}>
                <dt className="text-[10px] uppercase tracking-[0.2em] opacity-50">
                  {s.label}
                </dt>
                <dd className="mt-1 text-2xl font-light">{s.value}</dd>
              </div>
            ))}
          </dl>
        </ScrollReveal>
      </div>
    </section>
  );
}
