import Link from "next/link";
import { LanguageSwitcher } from "@/lib/i18n/switcher";

export function Hero({
  locale,
  t,
  clubCount,
}: {
  locale: string;
  t: (key: string, params?: Record<string, string | number>) => string;
  clubCount: number;
}) {
  return (
    <section className="landing-dark-section relative overflow-hidden min-h-svh flex flex-col">
      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between px-6 pt-5 sm:px-10">
        <span className="text-sm font-medium tracking-wide opacity-60">
          {t("landing.brandName")}
        </span>
        <LanguageSwitcher variant="dark" />
      </div>

      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[30%] right-[10%] h-[600px] w-[600px] rounded-full bg-[oklch(0.55_0.17_150_/_0.08)] blur-[120px] animate-float" />
        <div className="absolute bottom-[5%] -left-[10%] h-[500px] w-[500px] rounded-full bg-[oklch(0.55_0.15_170_/_0.06)] blur-[100px] animate-float-delayed" />
        <div className="absolute inset-0 bg-dot-pattern opacity-30" />
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6">
        <div className="max-w-4xl text-center">
          <h1 className="animate-gradient-text text-[clamp(3rem,10vw,8rem)] font-bold tracking-tighter leading-[0.9]">
            {t("landing.brandName")}
          </h1>

          <p className="mt-6 text-xl sm:text-2xl font-medium tracking-tight opacity-80">
            {t("landing.tagline")}
          </p>

          <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg opacity-50 leading-relaxed">
            {t("landing.heroDescription")}
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/onboarding"
              className="inline-flex h-14 items-center justify-center rounded-xl bg-primary px-10 text-lg font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:scale-[1.02] animate-pulse-glow"
            >
              {t("landing.heroPrimaryCta")}
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-medium opacity-60 hover:opacity-100 transition-opacity border border-white/10"
            >
              {t("landing.heroSecondaryCta")}
            </a>
          </div>

          {clubCount > 0 && (
            <p className="mt-8 text-sm opacity-40">
              {t("landing.trustedBy", { count: clubCount })}
            </p>
          )}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="relative z-10 flex justify-center pb-8 opacity-30">
        <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
