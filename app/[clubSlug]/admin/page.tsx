import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { RoleManager } from "./role-manager";
import { PeopleManager } from "./people-manager";
import { WheelManager } from "./wheel-manager";
import { LogoutButton } from "./logout-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}): Promise<Metadata> {
  const { clubSlug } = await params;
  const supabase = createAdminClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("name")
    .eq("slug", clubSlug)
    .single();

  return {
    title: club ? `Admin | ${club.name}` : "Club Admin",
    icons: { icon: "/favicon-admin.svg" },
  };
}

export default async function AdminPage({
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

  const [{ data: roles }, { data: members }, { data: staff }, { data: segments }] = await Promise.all([
    supabase
      .from("member_roles")
      .select("id, name, display_order")
      .eq("club_id", club.id)
      .order("display_order", { ascending: true }),
    supabase
      .from("members")
      .select("id, member_code, full_name, spin_balance, is_staff, status, member_roles(name)")
      .eq("club_id", club.id)
      .eq("is_staff", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("members")
      .select("id, member_code, full_name, spin_balance, is_staff, status, member_roles(name)")
      .eq("club_id", club.id)
      .eq("is_staff", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("wheel_configs")
      .select("id, label, color, label_color, probability, display_order, active")
      .eq("club_id", club.id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 px-6 pt-10 pb-12">
        <div className="flex items-start justify-between max-w-2xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-white">Club Admin</h1>
            <p className="mt-1 text-gray-400 text-sm">{club.name}</p>
          </div>
          <LogoutButton clubSlug={clubSlug} />
        </div>
      </div>

      <div className="px-4 -mt-6 pb-10 max-w-2xl mx-auto space-y-6">
        <PeopleManager
          clubId={club.id}
          clubSlug={clubSlug}
          members={memberList}
          staff={staffList}
        />
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
      </div>
    </div>
  );
}
