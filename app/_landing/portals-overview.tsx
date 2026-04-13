import { ScrollReveal } from "./scroll-reveal";

export function PortalsOverview({ t }: { t: (key: string) => string }) {
  const portals = [
    {
      title: t("sales.portalsMemberTitle"),
      desc: t("sales.portalsMemberDesc"),
      color: "from-green-500/20 to-transparent",
    },
    {
      title: t("sales.portalsStaffTitle"),
      desc: t("sales.portalsStaffDesc"),
      color: "from-blue-500/20 to-transparent",
    },
    {
      title: t("sales.portalsAdminTitle"),
      desc: t("sales.portalsAdminDesc"),
      color: "from-red-500/20 to-transparent",
    },
  ];

  return (
    <section className="landing-dark px-6 py-20 sm:py-28 border-t border-landing-border-subtle">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <h2 className="text-center text-3xl sm:text-4xl lg:text-5xl font-extralight tracking-tight">
            {t("sales.portalsTitle")}
          </h2>
        </ScrollReveal>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {portals.map((p, i) => (
            <ScrollReveal key={i} delay={i * 80}>
              <div className={`rounded-2xl bg-gradient-to-b ${p.color} border border-landing-border-subtle p-6 h-full`}>
                <h3 className="text-lg font-medium">{p.title}</h3>
                <p className="mt-3 text-sm font-light opacity-70 leading-relaxed">
                  {p.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
