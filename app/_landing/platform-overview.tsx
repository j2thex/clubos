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
      caps: [
        t("landing.portalMemberCap1"),
        t("landing.portalMemberCap2"),
        t("landing.portalMemberCap3"),
        t("landing.portalMemberCap4"),
      ],
      mockup: <MemberMockup />,
      accent: "bg-green-500",
    },
    {
      title: t("landing.portalStaffTitle"),
      desc: t("landing.portalStaffDesc"),
      caps: [
        t("landing.portalStaffCap1"),
        t("landing.portalStaffCap2"),
        t("landing.portalStaffCap3"),
        t("landing.portalStaffCap4"),
      ],
      mockup: <StaffMockup />,
      accent: "bg-blue-500",
    },
    {
      title: t("landing.portalAdminTitle"),
      desc: t("landing.portalAdminDesc"),
      caps: [
        t("landing.portalAdminCap1"),
        t("landing.portalAdminCap2"),
        t("landing.portalAdminCap3"),
        t("landing.portalAdminCap4"),
      ],
      mockup: <AdminMockup />,
      accent: "bg-red-500",
    },
  ];

  return (
    <section className="px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
          {t("landing.platformTitle")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground text-base sm:text-lg">
          {t("landing.platformSubtitle")}
        </p>

        {/* Desktop: 3-column grid */}
        <div className="hidden sm:grid sm:grid-cols-3 gap-6 mt-14">
          {portals.map((portal, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/50 bg-card overflow-hidden hover:border-primary/20 hover:shadow-xl transition-all duration-300 group"
            >
              {/* Mockup area */}
              <div className="p-6 pb-4 bg-muted/30">
                {portal.mockup}
              </div>
              {/* Info */}
              <div className="p-6 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${portal.accent}`} />
                  <h3 className="font-bold text-foreground text-lg">{portal.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{portal.desc}</p>
                <ul className="space-y-2">
                  {portal.caps.map((cap, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <svg className="w-4 h-4 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {cap}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: Tab switcher */}
        <div className="mt-10">
          <PortalTabs
            tabs={portals.map((p) => ({
              label: p.title,
              content: (
                <div>
                  <div className="p-4 bg-muted/30 rounded-xl mb-4">
                    {p.mockup}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{p.desc}</p>
                  <ul className="space-y-2">
                    {p.caps.map((cap, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <svg className="w-4 h-4 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {cap}
                      </li>
                    ))}
                  </ul>
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
    <div className="rounded-xl bg-card border border-border/30 overflow-hidden shadow-sm mx-auto max-w-[200px]">
      <div className="h-8 bg-green-600 flex items-center justify-center">
        <div className="w-16 h-1.5 bg-white/30 rounded-full" />
      </div>
      <div className="p-3 space-y-2">
        <div className="w-10 h-10 rounded-full bg-green-100 mx-auto" />
        <div className="grid grid-cols-3 gap-1.5">
          <div className="h-8 rounded-lg bg-muted" />
          <div className="h-8 rounded-lg bg-muted" />
          <div className="h-8 rounded-lg bg-muted" />
        </div>
        <div className="h-10 rounded-lg bg-muted/60" />
        <div className="h-10 rounded-lg bg-muted/60" />
      </div>
      <div className="flex justify-around py-2 border-t border-border/30">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? "bg-green-500" : "bg-muted-foreground/20"}`} />
        ))}
      </div>
    </div>
  );
}

function StaffMockup() {
  return (
    <div className="rounded-xl bg-card border border-border/30 overflow-hidden shadow-sm mx-auto max-w-[200px]">
      <div className="h-8 bg-gray-700 flex items-center justify-center">
        <div className="w-16 h-1.5 bg-white/20 rounded-full" />
      </div>
      <div className="p-3 space-y-2">
        <div className="w-16 h-16 rounded-full border-4 border-blue-200 mx-auto flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-blue-100" />
        </div>
        <div className="h-8 rounded-lg bg-muted mx-auto max-w-[120px]" />
        <div className="h-10 rounded-lg bg-gray-700 mx-auto max-w-[140px]" />
      </div>
      <div className="flex justify-around py-2 border-t border-border/30">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? "bg-blue-500" : "bg-muted-foreground/20"}`} />
        ))}
      </div>
    </div>
  );
}

function AdminMockup() {
  return (
    <div className="rounded-xl bg-card border border-border/30 overflow-hidden shadow-sm mx-auto max-w-[200px]">
      <div className="h-8 bg-gray-800 flex items-center justify-center">
        <div className="w-16 h-1.5 bg-white/20 rounded-full" />
      </div>
      <div className="p-3 space-y-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-muted/50">
            <div className="w-5 h-5 rounded-full bg-muted" />
            <div className="flex-1 h-2 rounded bg-muted" />
            <div className={`w-6 h-3 rounded-full ${i < 2 ? "bg-green-400" : "bg-muted"}`} />
          </div>
        ))}
      </div>
      <div className="flex justify-around py-2 border-t border-border/30">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? "bg-red-500" : "bg-muted-foreground/20"}`} />
        ))}
      </div>
    </div>
  );
}
