import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { PendingPrizes } from "../../spin/pending-prizes";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { requireOpsAccess } from "@/lib/auth";
import { NoAccessCard } from "@/components/club/no-access-card";

export default async function StaffBonusesPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, spin_enabled")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  const locale = await getServerLocale();

  if (club.spin_enabled === false) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-gray-400 text-sm">
        {t(locale, "staff.spinDisabledByAdmin")}
      </div>
    );
  }

  try {
    await requireOpsAccess(club.id, "qebo");
  } catch {
    return <NoAccessCard permission="qebo" clubSlug={clubSlug} locale={locale} />;
  }

  const { data: pendingBonuses } = await supabase
    .from("spins")
    .select("id, outcome_label, created_at, member_id, members!spins_member_id_fkey!inner(member_code, full_name)")
    .eq("club_id", club.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-4">
      <h1 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
        {t(locale, "staff.bonusesTitle")}
      </h1>
      <PendingPrizes
        clubId={club.id}
        prizes={(pendingBonuses ?? []).map((p) => {
          const m = p.members as unknown as { member_code: string; full_name: string | null };
          return {
            id: p.id,
            outcomeLabel: p.outcome_label,
            createdAt: p.created_at,
            memberCode: m.member_code,
            memberName: m.full_name,
          };
        })}
      />
    </div>
  );
}
