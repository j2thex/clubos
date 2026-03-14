import { ScrollReveal } from "./scroll-reveal";

export function UseCases({
  t,
}: {
  t: (key: string) => string;
}) {
  const cases = [
    {
      title: t("landing.useCaseSocial"),
      desc: t("landing.useCaseSocialDesc"),
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      ),
      gradient: "from-green-50 to-emerald-50",
    },
    {
      title: t("landing.useCaseCannabis"),
      desc: t("landing.useCaseCannabisDesc"),
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      ),
      gradient: "from-lime-50 to-green-50",
    },
    {
      title: t("landing.useCaseBars"),
      desc: t("landing.useCaseBarsDesc"),
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0A1.5 1.5 0 013 15.546M12 3v2m0 0c-2 0-4 1-4 3v1h8V8c0-2-2-3-4-3z" />
      ),
      gradient: "from-amber-50 to-orange-50",
    },
    {
      title: t("landing.useCaseSports"),
      desc: t("landing.useCaseSportsDesc"),
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      ),
      gradient: "from-blue-50 to-indigo-50",
    },
    {
      title: t("landing.useCaseCoworking"),
      desc: t("landing.useCaseCoworkingDesc"),
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      ),
      gradient: "from-violet-50 to-purple-50",
    },
  ];

  return (
    <section className="px-6 py-20 sm:py-28 bg-card border-t border-border/30">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
          {t("landing.useCasesTitle")}
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-center text-muted-foreground text-base sm:text-lg">
          {t("landing.useCasesSubtitle")}
        </p>

        {/* Desktop: 5-column grid */}
        <div className="hidden lg:grid lg:grid-cols-5 gap-4 mt-14">
          {cases.map((c, i) => (
            <ScrollReveal key={i} delay={i * 80}>
              <div className={`rounded-2xl bg-gradient-to-br ${c.gradient} p-6 h-full hover:shadow-lg transition-all duration-300`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-foreground mb-4">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    {c.icon}
                  </svg>
                </div>
                <h3 className="font-semibold text-foreground text-sm">{c.title}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Mobile/Tablet: horizontal scroll */}
        <div className="lg:hidden mt-10 -mx-6 px-6">
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide">
            {cases.map((c, i) => (
              <div
                key={i}
                className={`snap-start shrink-0 w-[260px] rounded-2xl bg-gradient-to-br ${c.gradient} p-6`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-foreground mb-4">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    {c.icon}
                  </svg>
                </div>
                <h3 className="font-semibold text-foreground text-sm">{c.title}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
