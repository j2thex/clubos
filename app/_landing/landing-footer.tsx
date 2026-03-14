import { LanguageSwitcher } from "@/lib/i18n/switcher";

export function LandingFooter({
  t,
}: {
  t: (key: string) => string;
}) {
  return (
    <footer className="border-t border-border/50 px-6 py-8">
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <p className="text-sm font-semibold text-foreground">{t("landing.brandName")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("landing.footerTagline")}</p>
        </div>
        <LanguageSwitcher variant="light" />
      </div>
    </footer>
  );
}
