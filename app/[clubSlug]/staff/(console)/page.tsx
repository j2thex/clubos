import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { StaffSpinClient } from "../spin/staff-spin-client";
import { PendingPrizes } from "../spin/pending-prizes";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

export default async function StaffSpinPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<{ member?: string }>;
}) {
  const { clubSlug } = await params;
  const { member } = await searchParams;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, spin_enabled, spin_display_decimals, spin_cost")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  const { data: segments } = await supabase
    .from("wheel_configs")
    .select("label, label_es, color, label_color, probability")
    .eq("club_id", club.id)
    .eq("active", true)
    .order("display_order", { ascending: true });

  // Fetch pending prizes from member self-service spins
  const { data: pendingPrizes } = await supabase
    .from("spins")
    .select("id, outcome_label, outcome_value, created_at, member_id, members!inner(member_code, full_name)")
    .eq("club_id", club.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(20);

  const locale = await getServerLocale();

  return (
    <div className="space-y-4">
      {/* Pending prizes */}
      {pendingPrizes && pendingPrizes.length > 0 && (
        <PendingPrizes
          clubId={club.id}
          prizes={pendingPrizes.map((p) => {
            const m = p.members as unknown as { member_code: string; full_name: string | null };
            return {
              id: p.id,
              outcomeLabel: p.outcome_label,
              outcomeValue: p.outcome_value,
              createdAt: p.created_at,
              memberCode: m.member_code,
              memberName: m.full_name,
            };
          })}
        />
      )}

      {/* Wheel */}
      {club.spin_enabled === false ? (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-gray-400 text-sm">
          {t(locale, "staff.spinDisabledByAdmin")}
        </div>
      ) : segments && segments.length > 0 ? (
        <StaffSpinClient
          clubId={club.id}
          initialMemberCode={member}
          displayDecimals={club.spin_display_decimals ?? 0}
          spinCost={club.spin_cost ?? 1}
          segments={segments.map((s) => ({
            label: locale === "es" && s.label_es ? s.label_es : s.label,
            color: s.color ?? "#16a34a",
            labelColor: s.label_color ?? "#ffffff",
            probability: Number(s.probability),
          }))}
        />
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-gray-400 text-sm">
          {t(locale, "staff.wheelNotConfigured")}
        </div>
      )}
    </div>
  );
}
