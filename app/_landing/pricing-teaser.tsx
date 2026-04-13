import Link from "next/link";
import { ScrollReveal } from "./scroll-reveal";

export function PricingTeaser({ t }: { t: (key: string) => string }) {
  const tiers = [
    { title: t("sales.pricingFree"), desc: t("sales.pricingFreeDesc") },
    { title: t("sales.pricingStarter"), desc: t("sales.pricingStarterDesc") },
    { title: t("sales.pricingGrowth"), desc: t("sales.pricingGrowthDesc") },
  ];

  return (
    <section className="landing-dark px-6 py-20 sm:py-28 border-t border-landing-border-subtle">
      <div className="mx-auto max-w-4xl text-center">
        <ScrollReveal>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extralight tracking-tight">
            {t("sales.pricingTitle")}
          </h2>
          <p className="mt-4 opacity-70 max-w-xl mx-auto">
            {t("sales.pricingSubtitle")}
          </p>
        </ScrollReveal>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {tiers.map((tier, i) => (
            <ScrollReveal key={i} delay={i * 80}>
              <div className="rounded-2xl bg-landing-surface border border-landing-border-subtle p-8 h-full">
                <h3 className="text-xl font-medium">{tier.title}</h3>
                <p className="mt-3 text-sm opacity-60">{tier.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={240}>
          <Link
            href="/contact"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-gray-900 hover:bg-gray-100"
          >
            {t("sales.pricingCta")} →
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
