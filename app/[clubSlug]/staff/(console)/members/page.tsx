import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { StaffMemberRow } from "../../members/member-row";
import { StaffMemberCreator } from "../../members/member-creator";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

export default async function StaffMembersPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  const [{ data: members }, { data: roles }, { data: periods }] = await Promise.all([
    supabase
      .from("members")
      .select("id, member_code, full_name, spin_balance, status, role_id, membership_period_id, valid_till, member_roles(id, name)")
      .eq("club_id", club.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("member_roles")
      .select("id, name")
      .eq("club_id", club.id)
      .order("display_order", { ascending: true }),
    supabase
      .from("membership_periods")
      .select("id, name, duration_months")
      .eq("club_id", club.id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
  ]);

  // Build a map of period id -> duration for member rows
  const periodMap = new Map((periods ?? []).map((p) => [p.id, p.duration_months]));
  const locale = await getServerLocale();

  return (
    <>
      <StaffMemberCreator clubId={club.id} clubSlug={clubSlug} periods={periods ?? []} />

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
          {t(locale, "staff.allMembers", { count: members?.length ?? 0 })}
        </h2>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {members && members.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {members.map((member) => {
                const roleName = Array.isArray(member.member_roles)
                  ? member.member_roles[0]?.name
                  : (member.member_roles as { id: string; name: string } | null)?.name;
                return (
                  <StaffMemberRow
                    key={member.id}
                    member={{
                      id: member.id,
                      memberCode: member.member_code,
                      fullName: member.full_name,
                      spinBalance: member.spin_balance,
                      roleId: member.role_id,
                      roleName: roleName ?? null,
                      validTill: member.valid_till ?? null,
                      membershipPeriodId: member.membership_period_id ?? null,
                      periodDurationMonths: member.membership_period_id
                        ? periodMap.get(member.membership_period_id) ?? null
                        : null,
                    }}
                    roles={roles ?? []}
                    periods={periods ?? []}
                    clubSlug={clubSlug}
                  />
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">
              {t(locale, "staff.noMembers")}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
