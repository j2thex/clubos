import { ScrollReveal } from "./scroll-reveal";

export function TheLoop({ t }: { t: (key: string) => string }) {
  const steps = [
    { title: t("sales.loopStep1Title"), desc: t("sales.loopStep1Desc") },
    { title: t("sales.loopStep2Title"), desc: t("sales.loopStep2Desc") },
    { title: t("sales.loopStep3Title"), desc: t("sales.loopStep3Desc") },
    { title: t("sales.loopStep4Title"), desc: t("sales.loopStep4Desc") },
  ];

  return (
    <section className="landing-dark px-6 py-20 sm:py-28 border-t border-landing-border-subtle">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <h2 className="text-center text-3xl sm:text-4xl lg:text-5xl font-extralight tracking-tight">
            {t("sales.loopTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-sm opacity-60">
            {t("sales.loopSubtitle")}
          </p>
        </ScrollReveal>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <ScrollReveal key={i} delay={i * 80}>
              <div className="relative rounded-2xl bg-landing-surface border border-landing-border-subtle p-6 h-full">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-medium">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-lg font-medium">{s.title}</h3>
                <p className="mt-2 text-sm font-light opacity-60 leading-relaxed">
                  {s.desc}
                </p>
                {i < steps.length - 1 && (
                  <span
                    aria-hidden
                    className="hidden lg:block absolute right-[-14px] top-1/2 -translate-y-1/2 text-white/30"
                  >
                    →
                  </span>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
