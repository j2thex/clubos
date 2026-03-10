import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { WheelManager } from "../../wheel-manager";
import { RoleManager } from "../../role-manager";
import { MembershipPeriodManager } from "../../membership-period-manager";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  const [{ data: segments }, { data: roles }, { data: membershipPeriods }] = await Promise.all([
    supabase
      .from("wheel_configs")
      .select(
        "id, label, color, label_color, probability, display_order, active"
      )
      .eq("club_id", club.id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("member_roles")
      .select("id, name, display_order")
      .eq("club_id", club.id)
      .order("display_order", { ascending: true }),
    supabase
      .from("membership_periods")
      .select("id, name, duration_months, display_order")
      .eq("club_id", club.id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
  ]);

  return (
    <div className="space-y-6">
      <WheelManager
        segments={(segments ?? []).map((s) => ({
          id: s.id,
          label: s.label,
          color: s.color ?? "#16a34a",
          label_color: s.label_color ?? "#ffffff",
          probability: Number(s.probability),
          display_order: s.display_order,
        }))}
        clubId={club.id}
        clubSlug={clubSlug}
      />
      <RoleManager
        roles={roles ?? []}
        clubId={club.id}
        clubSlug={clubSlug}
      />
      <MembershipPeriodManager
        periods={(membershipPeriods ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          duration_months: p.duration_months,
        }))}
        clubId={club.id}
        clubSlug={clubSlug}
      />
    </div>
  );
}
