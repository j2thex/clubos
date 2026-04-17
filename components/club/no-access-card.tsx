import Link from "next/link";
import { t, type Locale } from "@/lib/i18n";
import type { StaffPermission } from "@/lib/auth";

export function NoAccessCard({
  permission,
  clubSlug,
  locale,
}: {
  permission: StaffPermission;
  clubSlug: string;
  locale: Locale;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5">
            {t(locale, "ops.noPermission.tag")}
          </span>
        </div>
        <h1 className="text-lg font-semibold text-gray-900">
          {t(locale, `ops.noPermission.${permission}Title`)}
        </h1>
        <p className="text-sm text-gray-600">
          {t(locale, `ops.noPermission.${permission}Body`)}
        </p>
        <p className="text-sm text-gray-500">
          {t(locale, "ops.noPermission.contactOwner")}
        </p>
        <div className="pt-2">
          <Link
            href={`/${clubSlug}/staff`}
            className="inline-block rounded-lg bg-gray-800 text-white text-sm font-semibold px-4 py-2 hover:bg-gray-700"
          >
            {t(locale, "ops.noPermission.backToConsole")}
          </Link>
        </div>
      </div>
    </div>
  );
}
