import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

export default async function StaffOperationsPage() {
  const locale = await getServerLocale();

  return (
    <div className="space-y-4">
      <h1 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
        {t(locale, "ops.title")}
      </h1>
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-gray-500">
        <p className="text-sm font-medium text-gray-700">{t(locale, "ops.comingSoonTitle")}</p>
        <p className="mt-2 text-xs text-gray-500">{t(locale, "ops.comingSoonBody")}</p>
      </div>
    </div>
  );
}
