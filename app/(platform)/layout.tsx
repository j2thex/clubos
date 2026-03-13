import { LanguageSwitcher } from "@/lib/i18n/switcher";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher variant="dark" />
      </div>
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}
