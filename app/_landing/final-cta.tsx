import Link from "next/link";

export function FinalCta({
  t,
}: {
  t: (key: string) => string;
}) {
  return (
    <section className="landing-dark-section relative overflow-hidden px-6 py-24 sm:py-32">
      {/* Background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[20%] -right-[10%] h-[400px] w-[400px] rounded-full bg-[oklch(0.55_0.17_150_/_0.06)] blur-[100px]" />
        <div className="absolute bottom-[10%] -left-[5%] h-[300px] w-[300px] rounded-full bg-[oklch(0.55_0.15_170_/_0.04)] blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <h2 className="animate-gradient-text text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
          {t("landing.closingTitle")}
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base sm:text-lg opacity-50">
          {t("landing.closingSubtitle")}
        </p>
        <div className="mt-10">
          <Link
            href="/onboarding"
            className="inline-flex h-14 items-center justify-center rounded-xl bg-primary px-10 text-lg font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:scale-[1.02] animate-pulse-glow"
          >
            {t("landing.closingCta")}
          </Link>
          <p className="mt-4 text-sm opacity-40">
            {t("landing.closingReassurance")}
          </p>
        </div>
      </div>
    </section>
  );
}
