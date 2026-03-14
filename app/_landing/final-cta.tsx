import Link from "next/link";

export function FinalCta({ t }: { t: (key: string) => string }) {
  return (
    <section className="landing-dark px-6 py-24 sm:py-32 border-t border-white/[0.04]">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extralight tracking-tight">
          {t("landing.closingTitle").split(" ").map((word, i, arr) =>
            i === arr.length - 1 ? (
              <span key={i} className="text-gradient font-medium">{word}</span>
            ) : (
              <span key={i}>{word} </span>
            ),
          )}
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm opacity-60">
          {t("landing.closingSubtitle")}
        </p>
        <div className="mt-10">
          <Link
            href="/onboarding"
            className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-sm font-medium uppercase tracking-widest text-primary-foreground transition-all hover:brightness-110 hover:scale-[1.02]"
          >
            {t("landing.closingCta")}
          </Link>
          <p className="mt-4 text-xs opacity-40">
            {t("landing.closingReassurance")}
          </p>
        </div>
      </div>
    </section>
  );
}
