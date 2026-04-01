import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { PeopleManager } from "../people-manager";

export default async function PeoplePage({
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

  const [{ data: roles }, { data: members }, { data: staff }, { data: referralSources }] =
    await Promise.all([
      supabase
        .from("member_roles")
        .select("id, name, display_order")
        .eq("club_id", club.id)
        .order("display_order", { ascending: true }),
      supabase
        .from("members")
        .select(
          "id, member_code, full_name, spin_balance, is_staff, status, member_roles(name)"
        )
        .eq("club_id", club.id)
        .eq("is_staff", false)
        .eq("is_system_member", false)
        .order("created_at", { ascending: false }),
      supabase
        .from("members")
        .select(
          "id, member_code, full_name, spin_balance, is_staff, status, member_roles(name)"
        )
        .eq("club_id", club.id)
        .eq("is_staff", true)
        .eq("is_system_member", false)
        .order("created_at", { ascending: false }),
      supabase
        .from("members")
        .select(
          "id, member_code, full_name, spin_balance, is_staff, status, member_roles(name)"
        )
        .eq("club_id", club.id)
        .eq("is_system_member", true)
        .order("created_at", { ascending: false }),
    ]);

  function extractRoleName(m: { member_roles: unknown }) {
    return Array.isArray(m.member_roles)
      ? m.member_roles[0]?.name ?? null
      : (m.member_roles as { name: string } | null)?.name ?? null;
  }

  const memberList = (members ?? []).map((m) => ({
    id: m.id,
    member_code: m.member_code,
    full_name: m.full_name,
    spin_balance: m.spin_balance,
    is_staff: m.is_staff,
    status: m.status,
    roleName: extractRoleName(m),
  }));

  const staffList = (staff ?? []).map((s) => ({
    id: s.id,
    member_code: s.member_code,
    full_name: s.full_name,
    spin_balance: s.spin_balance,
    is_staff: s.is_staff,
    status: s.status,
    roleName: extractRoleName(s),
  }));

  const referralList = (referralSources ?? []).map((r) => ({
    id: r.id,
    member_code: r.member_code,
    full_name: r.full_name,
    spin_balance: r.spin_balance,
    is_staff: r.is_staff,
    status: r.status,
    roleName: extractRoleName(r),
  }));

  return (
    <PeopleManager
      clubId={club.id}
      clubSlug={clubSlug}
      members={memberList}
      staff={staffList}
      referralSources={referralList}
    />
  );
}
