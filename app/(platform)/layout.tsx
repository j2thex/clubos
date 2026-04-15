import Link from "next/link";
import { LanguageSwitcher } from "@/lib/i18n/switcher";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="platform-light min-h-screen bg-white text-gray-900 flex items-center justify-center p-4">
      <Link
        href="/"
        className="fixed top-4 left-4 z-50 inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/95 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm backdrop-blur hover:bg-gray-50 hover:text-gray-900 transition-colors"
      >
        ← Exit
      </Link>
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher variant="dark" />
      </div>
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}
