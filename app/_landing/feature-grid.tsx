import { ScrollReveal } from "./scroll-reveal";

interface Feature {
  titleKey: string;
  descKey: string;
  icon: React.ReactNode;
  colSpan?: string;
  rowSpan?: string;
  category: string;
  categoryColor: string;
}

const FEATURES: Feature[] = [
  {
    titleKey: "landing.featureMemberPortal",
    descKey: "landing.featureMemberPortalDesc",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
    colSpan: "sm:col-span-2",
    category: "Portal",
    categoryColor: "bg-green-100 text-green-700",
  },
  {
    titleKey: "landing.featureStaffConsole",
    descKey: "landing.featureStaffConsoleDesc",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
    category: "Portal",
    categoryColor: "bg-blue-100 text-blue-700",
  },
  {
    titleKey: "landing.featureAdminPanel",
    descKey: "landing.featureAdminPanelDesc",
    icon: <><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>,
    category: "Portal",
    categoryColor: "bg-gray-100 text-gray-700",
  },
  {
    titleKey: "landing.featureSpinWheel",
    descKey: "landing.featureSpinWheelDesc",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
    colSpan: "sm:col-span-2",
    category: "Engagement",
    categoryColor: "bg-amber-100 text-amber-700",
  },
  {
    titleKey: "landing.featureQuestsTitle",
    descKey: "landing.featureQuestsDesc",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />,
    category: "Engagement",
    categoryColor: "bg-amber-100 text-amber-700",
  },
  {
    titleKey: "landing.featureEventsTitle",
    descKey: "landing.featureEventsDesc",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
    category: "Engagement",
    categoryColor: "bg-amber-100 text-amber-700",
  },
  {
    titleKey: "landing.featureServicesTitle",
    descKey: "landing.featureServicesDesc",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />,
    category: "Management",
    categoryColor: "bg-blue-100 text-blue-700",
  },
  {
    titleKey: "landing.featureWhiteLabel",
    descKey: "landing.featureWhiteLabelDesc",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />,
    colSpan: "sm:col-span-2",
    category: "Branding",
    categoryColor: "bg-purple-100 text-purple-700",
  },
  {
    titleKey: "landing.featureRolesTitle",
    descKey: "landing.featureRolesDesc",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
    category: "Management",
    categoryColor: "bg-blue-100 text-blue-700",
  },
  {
    titleKey: "landing.featureLogsTitle",
    descKey: "landing.featureLogsDesc",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    category: "Analytics",
    categoryColor: "bg-violet-100 text-violet-700",
  },
  {
    titleKey: "landing.featureReferralsTitle",
    descKey: "landing.featureReferralsDesc",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />,
    category: "Analytics",
    categoryColor: "bg-violet-100 text-violet-700",
  },
  {
    titleKey: "landing.featureSecure",
    descKey: "landing.featureSecureDesc",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
    colSpan: "sm:col-span-2",
    category: "Security",
    categoryColor: "bg-rose-100 text-rose-700",
  },
];

export function FeatureGrid({
  t,
}: {
  t: (key: string) => string;
}) {
  return (
    <section className="px-6 py-20 sm:py-28 bg-card border-t border-border/30">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
          {t("landing.featuresTitle2")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground text-base sm:text-lg">
          {t("landing.featuresSubtitle2")}
        </p>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <ScrollReveal key={i} delay={i * 50}>
              <div
                className={`rounded-2xl border border-border/50 bg-background p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300 h-full ${f.colSpan ?? ""}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${f.categoryColor}`}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      {f.icon}
                    </svg>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${f.categoryColor}`}>
                    {f.category}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground text-base">{t(f.titleKey)}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  {t(f.descKey)}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
