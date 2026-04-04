import Link from "next/link";
import { LanguageSwitcher } from "@/lib/i18n/switcher";

export function LandingFooter({ t }: { t: (key: string) => string }) {
  return (
    <footer className="landing-dark border-t border-white/[0.04] px-6 py-8">
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <p className="text-xs font-mono opacity-50">{t("landing.brandName")}</p>
          <p className="text-[10px] opacity-40 mt-0.5">{t("landing.footerTagline")}</p>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/discover" className="text-xs opacity-40 hover:opacity-70 transition-opacity">
            Discover
          </Link>
          <Link href="/onboarding" className="text-xs opacity-40 hover:opacity-70 transition-opacity">
            For Clubs
          </Link>
          <Link href="/examples" className="text-xs opacity-40 hover:opacity-70 transition-opacity">
            Examples
          </Link>
          <Link href="/privacy" className="text-xs opacity-40 hover:opacity-70 transition-opacity">
            {t("legal.privacyPolicy")}
          </Link>
          <Link href="/terms" className="text-xs opacity-40 hover:opacity-70 transition-opacity">
            {t("legal.termsOfUse")}
          </Link>
          <LanguageSwitcher variant="dark" />
        </div>
      </div>
    </footer>
  );
}
