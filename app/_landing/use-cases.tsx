import { ScrollReveal } from "./scroll-reveal";

export function UseCases({ t }: { t: (key: string) => string }) {
  const cases = [
    { title: t("landing.useCaseSocial"), desc: t("landing.useCaseSocialDesc") },
    { title: t("landing.useCaseCannabis"), desc: t("landing.useCaseCannabisDesc") },
    { title: t("landing.useCaseBars"), desc: t("landing.useCaseBarsDesc") },
    { title: t("landing.useCaseSports"), desc: t("landing.useCaseSportsDesc") },
    { title: t("landing.useCaseCoworking"), desc: t("landing.useCaseCoworkingDesc") },
  ];

  return (
    <section className="landing-dark px-6 py-20 sm:py-28 border-t border-white/[0.04]">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <h2 className="text-center text-3xl sm:text-4xl lg:text-5xl font-extralight tracking-tight">
            {t("landing.useCasesTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-sm opacity-40">
            {t("landing.useCasesSubtitle")}
          </p>
        </ScrollReveal>

        {/* Desktop */}
        <div className="hidden lg:grid lg:grid-cols-5 gap-3 mt-14">
          {cases.map((c, i) => (
            <ScrollReveal key={i} delay={i * 60}>
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 hover:bg-white/[0.06] transition-colors duration-300 h-full">
                <h3 className="font-medium text-sm">{c.title}</h3>
                <p className="mt-2 text-xs font-light opacity-40 leading-relaxed">{c.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Mobile/Tablet: horizontal scroll */}
        <div className="lg:hidden mt-10 -mx-6 px-6">
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4">
            {cases.map((c, i) => (
              <div
                key={i}
                className="snap-start shrink-0 w-[220px] rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5"
              >
                <h3 className="font-medium text-sm">{c.title}</h3>
                <p className="mt-2 text-xs font-light opacity-40 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
