import Link from "next/link";
import { LanguageSwitcher } from "@/lib/i18n/switcher";
import { HeroArt } from "./landing-art";

export function Hero({
  t,
  stats,
}: {
  t: (key: string, params?: Record<string, string | number>) => string;
  stats: { clubs: number; members: number; events: number };
}) {
  return (
    <section className="landing-dark relative min-h-svh flex flex-col">
      <div className="hidden dark:block"><HeroArt /></div>
      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-6 sm:px-10">
        <span className="text-xs font-mono tracking-widest uppercase opacity-60">
          {t("landing.brandName")}
        </span>
        <LanguageSwitcher variant="auto" />
      </div>

      {/* Center content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6">
        <div className="max-w-5xl text-center">
          <h1 className="text-[clamp(3.5rem,12vw,10rem)] font-extralight tracking-tighter leading-[0.85]">
            {t("landing.brandName")}
          </h1>

          <p className="mt-4 text-[clamp(2rem,5vw,4rem)] font-black tracking-tight text-gradient leading-none">
            {t("landing.tagline")}
          </p>

          <p className="mx-auto mt-6 max-w-md text-base sm:text-lg font-light opacity-60 leading-relaxed">
            {t("landing.heroDescription")}
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-sm font-medium uppercase tracking-widest text-primary-foreground transition-all hover:brightness-110 hover:scale-[1.02]"
            >
              {t("landing.heroPrimaryCta")}
            </Link>
            <Link
              href="/examples"
              className="text-sm font-light opacity-60 hover:opacity-80 transition-opacity"
            >
              See examples →
            </Link>
            <a
              href="#how-it-works"
              className="text-sm font-light opacity-60 hover:opacity-80 transition-opacity"
            >
              {t("landing.heroSecondaryCta")} ↓
            </a>
          </div>
        </div>
      </div>

      {/* Bottom stats */}
      <div className="relative z-10 text-center pb-10">
        <p className="text-xs font-mono opacity-40 tracking-wider">
          {stats.clubs > 0 && <>{stats.clubs} clubs</>}
          {stats.members > 0 && <> · {stats.members} members</>}
          {stats.events > 0 && <> · {stats.events} events</>}
        </p>
      </div>
    </section>
  );
}
