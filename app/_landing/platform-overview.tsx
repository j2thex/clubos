import { ScrollReveal } from "./scroll-reveal";
import { PortalTabs } from "./portal-tabs";

export function PlatformOverview({
  t,
}: {
  t: (key: string) => string;
}) {
  const portals = [
    {
      title: t("landing.portalMemberTitle"),
      desc: t("landing.portalMemberDesc"),
      caps: [t("landing.portalMemberCap1"), t("landing.portalMemberCap2"), t("landing.portalMemberCap3"), t("landing.portalMemberCap4")],
      mockup: <MemberMockup />,
      dot: "bg-green-500",
    },
    {
      title: t("landing.portalStaffTitle"),
      desc: t("landing.portalStaffDesc"),
      caps: [t("landing.portalStaffCap1"), t("landing.portalStaffCap2"), t("landing.portalStaffCap3"), t("landing.portalStaffCap4")],
      mockup: <StaffMockup />,
      dot: "bg-blue-500",
    },
    {
      title: t("landing.portalAdminTitle"),
      desc: t("landing.portalAdminDesc"),
      caps: [t("landing.portalAdminCap1"), t("landing.portalAdminCap2"), t("landing.portalAdminCap3"), t("landing.portalAdminCap4")],
      mockup: <AdminMockup />,
      dot: "bg-red-500",
    },
  ];

  return (
    <section className="landing-dark px-6 py-20 sm:py-28 border-t border-white/[0.04]">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <h2 className="text-center text-3xl sm:text-4xl lg:text-5xl font-extralight tracking-tight">
            {t("landing.platformTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-sm opacity-40">
            {t("landing.platformSubtitle")}
          </p>
        </ScrollReveal>

        {/* Desktop */}
        <div className="hidden sm:grid sm:grid-cols-3 gap-4 mt-16">
          {portals.map((p, i) => (
            <ScrollReveal key={i} delay={i * 100}>
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:bg-white/[0.05] transition-colors duration-300">
                <div className="p-5 pb-3">{p.mockup}</div>
                <div className="p-5 pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                    <h3 className="text-xl font-extralight">{p.title}</h3>
                  </div>
                  <p className="text-xs opacity-40 mb-4">{p.desc}</p>
                  <ul className="space-y-1.5">
                    {p.caps.map((c, j) => (
                      <li key={j} className="flex items-center gap-2 text-xs opacity-50">
                        <span className="text-primary text-[10px]">+</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Mobile */}
        <div className="mt-10">
          <PortalTabs
            tabs={portals.map((p) => ({
              label: p.title,
              content: (
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
                  <div className="p-4">{p.mockup}</div>
                  <div className="p-4 pt-2">
                    <p className="text-xs opacity-40 mb-3">{p.desc}</p>
                    <ul className="space-y-1.5">
                      {p.caps.map((c, j) => (
                        <li key={j} className="flex items-center gap-2 text-xs opacity-50">
                          <span className="text-primary text-[10px]">+</span> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ),
            }))}
          />
        </div>
      </div>
    </section>
  );
}

function MemberMockup() {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] overflow-hidden mx-auto max-w-[180px]">
      <div className="h-6 bg-green-600/30" />
      <div className="p-2.5 space-y-1.5">
        <div className="w-8 h-8 rounded-full bg-white/[0.06] mx-auto" />
        <div className="grid grid-cols-3 gap-1">
          <div className="h-6 rounded bg-white/[0.04]" />
          <div className="h-6 rounded bg-white/[0.04]" />
          <div className="h-6 rounded bg-white/[0.04]" />
        </div>
        <div className="h-7 rounded bg-white/[0.03]" />
        <div className="h-7 rounded bg-white/[0.03]" />
      </div>
    </div>
  );
}

function StaffMockup() {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] overflow-hidden mx-auto max-w-[180px]">
      <div className="h-6 bg-white/[0.06]" />
      <div className="p-2.5 space-y-1.5">
        <div className="w-12 h-12 rounded-full border-2 border-blue-400/20 mx-auto" />
        <div className="h-6 rounded bg-white/[0.04] mx-auto max-w-[100px]" />
        <div className="h-8 rounded bg-white/[0.06] mx-auto max-w-[120px]" />
      </div>
    </div>
  );
}

function AdminMockup() {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] overflow-hidden mx-auto max-w-[180px]">
      <div className="h-6 bg-white/[0.06]" />
      <div className="p-2.5 space-y-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-1.5 p-1 rounded bg-white/[0.02]">
            <div className="w-4 h-4 rounded-full bg-white/[0.05]" />
            <div className="flex-1 h-1.5 rounded bg-white/[0.04]" />
            <div className={`w-5 h-2.5 rounded-full ${i < 2 ? "bg-green-500/30" : "bg-white/[0.04]"}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
