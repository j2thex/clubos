import { ScrollReveal } from "./scroll-reveal";

export function HowItWorks({ t }: { t: (key: string) => string }) {
  const steps = [
    { num: "01", title: t("landing.step1Title"), desc: t("landing.step1Desc") },
    { num: "02", title: t("landing.step2Title"), desc: t("landing.step2Desc") },
    { num: "03", title: t("landing.step3Title"), desc: t("landing.step3Desc") },
  ];

  return (
    <section id="how-it-works" className="landing-dark px-6 py-20 sm:py-28 border-t border-white/[0.04]">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <h2 className="text-center text-3xl sm:text-4xl lg:text-5xl font-extralight tracking-tight">
            {t("landing.howItWorksTitle2")}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-sm opacity-60">
            {t("landing.howItWorksSubtitle2")}
          </p>
        </ScrollReveal>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
          {steps.map((step, i) => (
            <ScrollReveal key={i} delay={i * 120}>
              <div className="relative">
                {/* Watermark number */}
                <span className="text-[6rem] sm:text-[8rem] font-extralight leading-none opacity-[0.04] absolute -top-6 -left-2 select-none">
                  {step.num}
                </span>
                <div className="relative pt-12 sm:pt-16">
                  <h3 className="font-medium text-base">{step.title}</h3>
                  <p className="mt-2 text-sm font-light opacity-60 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
