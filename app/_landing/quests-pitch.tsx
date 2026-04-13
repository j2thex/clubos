import { ScrollReveal } from "./scroll-reveal";

export function QuestsPitch({ t }: { t: (key: string) => string }) {
  const bullets = [
    t("sales.questsBullet1"),
    t("sales.questsBullet2"),
    t("sales.questsBullet3"),
    t("sales.questsBullet4"),
  ];

  return (
    <section className="landing-dark px-6 py-20 sm:py-28 border-t border-landing-border-subtle">
      <div className="mx-auto max-w-5xl grid gap-10 lg:grid-cols-2 lg:items-center">
        <ScrollReveal>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extralight tracking-tight">
            {t("sales.questsTitle")}
          </h2>
          <p className="mt-4 text-sm opacity-70 leading-relaxed max-w-md">
            {t("sales.questsSubtitle")}
          </p>
          <ul className="mt-8 space-y-3">
            {bullets.map((b, i) => (
              <li key={i} className="flex gap-3 text-sm font-light">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/60" />
                <span className="opacity-80">{b}</span>
              </li>
            ))}
          </ul>
        </ScrollReveal>

        <ScrollReveal delay={120}>
          <div className="rounded-3xl bg-landing-surface border border-landing-border-subtle p-8 aspect-[4/5] flex items-center justify-center">
            <div className="text-center opacity-40">
              <div className="text-6xl">⚡</div>
              <p className="mt-3 text-xs uppercase tracking-[0.2em]">Quests preview</p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
