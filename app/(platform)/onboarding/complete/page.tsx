import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
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

  await seedClubDefaults(clubId);

  const supabase = createAdminClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("slug")
    .eq("id", clubId)
    .single();

  redirect(club?.slug ? `/${club.slug}/admin` : "/");
}
