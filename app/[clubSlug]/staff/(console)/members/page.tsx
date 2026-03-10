import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { StaffMemberRow } from "../../members/member-row";
import { StaffMemberCreator } from "../../members/member-creator";

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

  const [{ data: members }, { data: roles }] = await Promise.all([
    supabase
      .from("members")
      .select("id, member_code, full_name, spin_balance, status, role_id, member_roles(id, name)")
      .eq("club_id", club.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("member_roles")
      .select("id, name")
      .eq("club_id", club.id)
      .order("display_order", { ascending: true }),
  ]);

  return (
    <>
      <StaffMemberCreator clubId={club.id} clubSlug={clubSlug} />

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
          All Members ({members?.length ?? 0})
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
                    }}
                    roles={roles ?? []}
                    clubSlug={clubSlug}
                  />
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">
              No members yet
            </div>
          )}
        </div>
      </div>
    </>
  );
}
