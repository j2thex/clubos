import { ScrollReveal } from "./scroll-reveal";
import { FeatureShowcase } from "./feature-showcase";

export function FeatureShowcases({ t }: { t: (key: string) => string }) {
  const seeExample = t("sales.showcaseSeeExample");

  return (
    <section className="landing-dark px-6 py-20 sm:py-28 border-t border-landing-border-subtle">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <h2 className="text-center text-3xl sm:text-4xl lg:text-5xl font-extralight tracking-tight">
            {t("sales.showcasesTitle")}
          </h2>
        </ScrollReveal>

        <div className="mt-16 space-y-20">
          <FeatureShowcase
            title={t("sales.showcaseSpinTitle")}
            description={t("sales.showcaseSpinDesc")}
            exampleHref="/examples/bars"
            seeExampleLabel={seeExample}
          />
          <FeatureShowcase
            title={t("sales.showcaseQuestsTitle")}
            description={t("sales.showcaseQuestsDesc")}
            exampleHref="/examples/coworking-spaces"
            seeExampleLabel={seeExample}
            reverse
          />
          <FeatureShowcase
            title={t("sales.showcaseEventsTitle")}
            description={t("sales.showcaseEventsDesc")}
            exampleHref="/examples/sports-clubs"
            seeExampleLabel={seeExample}
          />
          <FeatureShowcase
            title={t("sales.showcaseEmailTitle")}
            description={t("sales.showcaseEmailDesc")}
            exampleHref="/examples/coffee-shops"
            seeExampleLabel={seeExample}
            reverse
          />
        </div>
      </div>
    </section>
  );
}
