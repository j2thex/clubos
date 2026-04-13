import Link from "next/link";
import { ScrollReveal } from "./scroll-reveal";

export function FeatureShowcase({
  title,
  description,
  exampleHref,
  seeExampleLabel,
  reverse = false,
}: {
  title: string;
  description: string;
  exampleHref: string;
  seeExampleLabel: string;
  reverse?: boolean;
}) {
  return (
    <div className={`grid gap-10 lg:grid-cols-2 lg:items-center ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
      <ScrollReveal>
        <div className="rounded-3xl bg-landing-surface border border-landing-border-subtle aspect-[4/3] flex items-center justify-center">
          <span className="text-5xl opacity-40">🎡</span>
        </div>
      </ScrollReveal>
      <ScrollReveal delay={120}>
        <h3 className="text-2xl sm:text-3xl font-extralight tracking-tight">{title}</h3>
        <p className="mt-4 text-sm opacity-70 leading-relaxed max-w-md">{description}</p>
        <Link
          href={exampleHref}
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
        >
          {seeExampleLabel} →
        </Link>
      </ScrollReveal>
    </div>
  );
}
