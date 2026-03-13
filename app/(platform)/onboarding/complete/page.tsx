import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { seedClubDefaults } from "../actions";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

export default async function CompletePage({
  searchParams,
}: {
  searchParams: Promise<{ clubId?: string }>;
}) {
  const { clubId } = await searchParams;
  const locale = await getServerLocale();

  if (!clubId) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{t(locale, "onboarding.missingClubId")}</p>
        <Link href="/onboarding" className="text-green-600 underline mt-2 inline-block">
          {t(locale, "onboarding.goToOnboarding")}
        </Link>
      </div>
    );
  }

  // Seed wheel config and default roles (idempotent)
  await seedClubDefaults(clubId);

  // Fetch club slug
  const supabase = createAdminClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("slug")
    .eq("id", clubId)
    .single();

  const clubSlug = club?.slug ?? "";
  const adminUrl = clubSlug ? `/${clubSlug}/admin` : "/";
  const staffUrl = clubSlug ? `/${clubSlug}/staff/login` : "/";
  const memberUrl = clubSlug ? `/${clubSlug}/login` : "/";

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-green-700">{t(locale, "onboarding.step3")}</p>
        <div className="flex items-center justify-center gap-2">
          <span className="h-2 w-8 rounded-full bg-green-600" />
          <span className="h-2 w-8 rounded-full bg-green-600" />
          <span className="h-2 w-8 rounded-full bg-green-600" />
        </div>
      </div>

      <Card className="border-green-200 shadow-lg shadow-green-100/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <CardTitle className="text-2xl text-gray-900">{t(locale, "onboarding.completeTitle")}</CardTitle>
          <CardDescription className="text-gray-600">
            {t(locale, "onboarding.completeDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Next steps */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">{t(locale, "onboarding.nextSteps")}</h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-800 text-[10px] font-bold text-white">1</span>
                {t(locale, "onboarding.nextStep1")}
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-800 text-[10px] font-bold text-white">2</span>
                {t(locale, "onboarding.nextStep2")}
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-800 text-[10px] font-bold text-white">3</span>
                {t(locale, "onboarding.nextStep3")}
              </li>
            </ol>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Link
              href={adminUrl}
              target="_blank"
              className="block rounded-md bg-gray-800 px-3 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-700 transition-colors"
            >
              {t(locale, "onboarding.adminPanel")}
            </Link>
            <Link
              href={staffUrl}
              target="_blank"
              className="block rounded-md bg-gray-600 px-3 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-500 transition-colors"
            >
              {t(locale, "onboarding.staffConsole")}
            </Link>
            <Link
              href={memberUrl}
              target="_blank"
              className="block rounded-md bg-green-600 px-3 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition-colors"
            >
              {t(locale, "onboarding.memberPortal")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
