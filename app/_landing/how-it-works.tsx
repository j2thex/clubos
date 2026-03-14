import { ScrollReveal } from "./scroll-reveal";

export function HowItWorks({
  t,
}: {
  t: (key: string) => string;
}) {
  const steps = [
    {
      num: "1",
      title: t("landing.step1Title"),
      desc: t("landing.step1Desc"),
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      ),
    },
    {
      num: "2",
      title: t("landing.step2Title"),
      desc: t("landing.step2Desc"),
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      ),
    },
    {
      num: "3",
      title: t("landing.step3Title"),
      desc: t("landing.step3Desc"),
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      ),
    },
  ];

  return (
    <section id="how-it-works" className="px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
          {t("landing.howItWorksTitle2")}
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-center text-muted-foreground text-base sm:text-lg">
          {t("landing.howItWorksSubtitle2")}
        </p>

        {/* Desktop: horizontal timeline */}
        <div className="hidden sm:block mt-16">
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute top-6 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-primary via-primary/50 to-primary/20" />

            <div className="grid grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <ScrollReveal key={i} delay={i * 150}>
                  <div className="text-center">
                    <div className="relative mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold shadow-lg shadow-primary/20">
                      {step.num}
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mx-auto mb-3">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        {step.icon}
                      </svg>
                    </div>
                    <h3 className="font-semibold text-foreground text-lg">{step.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: vertical timeline */}
        <div className="sm:hidden mt-12">
          <div className="relative pl-8 border-l-2 border-primary/20 space-y-10">
            {steps.map((step, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <div className="relative">
                  <div className="absolute -left-[calc(2rem+5px)] flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20">
                    {step.num}
                  </div>
                  <h3 className="font-semibold text-foreground text-base">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
