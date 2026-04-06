import Link from "next/link";
import { ScrollReveal } from "./scroll-reveal";
import {
  SocialClubIcon,
  CannabisClubIcon,
  BarsClubIcon,
  SportsClubIcon,
  CoworkingIcon,
} from "./landing-art";

const ICONS = [SocialClubIcon, CannabisClubIcon, BarsClubIcon, SportsClubIcon, CoworkingIcon];

export function UseCases({ t }: { t: (key: string) => string }) {
  const cases = [
    { title: t("landing.useCaseSocial"), desc: t("landing.useCaseSocialDesc"), example: "/examples/bars" },
    { title: t("landing.useCaseCannabis"), desc: t("landing.useCaseCannabisDesc"), example: "/examples/coffee-shops" },
    { title: t("landing.useCaseBars"), desc: t("landing.useCaseBarsDesc"), example: "/examples/bars" },
    { title: t("landing.useCaseSports"), desc: t("landing.useCaseSportsDesc"), example: "/examples/sports-clubs" },
    { title: t("landing.useCaseCoworking"), desc: t("landing.useCaseCoworkingDesc"), example: "/examples/coworking-spaces" },
  ];

  return (
    <section className="landing-dark px-6 py-20 sm:py-28 border-t border-landing-border-subtle">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <h2 className="text-center text-3xl sm:text-4xl lg:text-5xl font-extralight tracking-tight">
            {t("landing.useCasesTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-sm opacity-60">
            {t("landing.useCasesSubtitle")}
          </p>
        </ScrollReveal>

        {/* Desktop */}
        <div className="hidden lg:grid lg:grid-cols-5 gap-3 mt-14">
          {cases.map((c, i) => {
            const Icon = ICONS[i];
            return (
              <ScrollReveal key={i} delay={i * 60}>
                <Link href={c.example} className="block rounded-2xl bg-landing-surface border border-landing-border-subtle p-5 hover:bg-landing-surface-hover transition-colors duration-300 h-full group/card">
                  <Icon />
                  <h3 className="font-medium text-sm">{c.title}</h3>
                  <p className="mt-2 text-xs font-light opacity-60 leading-relaxed">{c.desc}</p>
                  <p className="mt-3 text-[10px] font-medium opacity-0 group-hover/card:opacity-60 transition-opacity">See example &rarr;</p>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Mobile/Tablet: horizontal scroll */}
        <div className="lg:hidden mt-10 -mx-6 px-6">
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4">
            {cases.map((c, i) => {
              const Icon = ICONS[i];
              return (
                <Link
                  key={i}
                  href={c.example}
                  className="snap-start shrink-0 w-[220px] rounded-2xl bg-landing-surface border border-landing-border-subtle p-5"
                >
                  <Icon />
                  <h3 className="font-medium text-sm">{c.title}</h3>
                  <p className="mt-2 text-xs font-light opacity-60 leading-relaxed">{c.desc}</p>
                  <p className="mt-3 text-[10px] font-medium opacity-60">See example &rarr;</p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
