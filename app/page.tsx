import Link from "next/link";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/lib/i18n/switcher";

export default async function Home() {
  const locale = await getServerLocale();
  return (
    <div className="min-h-screen bg-background">
      {/* Language switcher */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher variant="dark" />
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-primary sm:text-6xl md:text-7xl">
            {t(locale, "landing.brandName")}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
            {t(locale, "landing.heroSubtitle")}
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/onboarding"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-medium text-primary-foreground shadow-md transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {t(locale, "landing.heroCta")}
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border/50 bg-card px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            {t(locale, "landing.howItWorksTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
            {t(locale, "landing.howItWorksSubtitle")}
          </p>

          <div className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                1
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">{t(locale, "landing.step1Title")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(locale, "landing.step1Desc")}
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                2
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">{t(locale, "landing.step2Title")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(locale, "landing.step2Desc")}
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                3
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">{t(locale, "landing.step3Title")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(locale, "landing.step3Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            {t(locale, "landing.featuresTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
            {t(locale, "landing.featuresSubtitle")}
          </p>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Member Portal */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{t(locale, "landing.featureMemberPortal")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(locale, "landing.featureMemberPortalDesc")}
              </p>
            </div>

            {/* Staff Console */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{t(locale, "landing.featureStaffConsole")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(locale, "landing.featureStaffConsoleDesc")}
              </p>
            </div>

            {/* Admin Panel */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{t(locale, "landing.featureAdminPanel")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(locale, "landing.featureAdminPanelDesc")}
              </p>
            </div>

            {/* Spin the Wheel */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{t(locale, "landing.featureSpinWheel")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(locale, "landing.featureSpinWheelDesc")}
              </p>
            </div>

            {/* White Label */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{t(locale, "landing.featureWhiteLabel")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(locale, "landing.featureWhiteLabelDesc")}
              </p>
            </div>

            {/* Multi-tenant */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{t(locale, "landing.featureSecure")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(locale, "landing.featureSecureDesc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Built For */}
      <section className="border-t border-border/50 bg-card px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            {t(locale, "landing.builtForTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            {t(locale, "landing.builtForDesc")}
          </p>
          <div className="mt-10">
            <Link
              href="/onboarding"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-medium text-primary-foreground shadow-md transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {t(locale, "landing.getStartedCta")}
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              {t(locale, "landing.setupTime")}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-8">
        <p className="text-center text-sm text-muted-foreground">
          {t(locale, "landing.brandName")}
        </p>
      </footer>
    </div>
  );
}
