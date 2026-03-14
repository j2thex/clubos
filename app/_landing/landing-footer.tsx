import { LanguageSwitcher } from "@/lib/i18n/switcher";

export function LandingFooter({ t }: { t: (key: string) => string }) {
  return (
    <footer className="landing-dark border-t border-white/[0.04] px-6 py-8">
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <p className="text-xs font-mono opacity-30">{t("landing.brandName")}</p>
          <p className="text-[10px] opacity-15 mt-0.5">{t("landing.footerTagline")}</p>
        </div>
        <LanguageSwitcher variant="dark" />
      </div>
    </footer>
  );
}
