import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { RoleManager } from "./role-manager";
import { MemberCreator } from "./member-creator";

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

  const { data: roles } = await supabase
    .from("member_roles")
    .select("id, name, display_order")
    .eq("club_id", club.id)
    .order("display_order", { ascending: true });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 px-6 pt-10 pb-12">
        <h1 className="text-2xl font-bold text-white">Club Admin</h1>
        <p className="mt-1 text-gray-400 text-sm">{club.name}</p>
      </div>

      <div className="px-4 -mt-6 pb-10 max-w-2xl mx-auto space-y-6">
        <MemberCreator clubId={club.id} clubSlug={clubSlug} />
        <RoleManager
          roles={roles ?? []}
          clubId={club.id}
          clubSlug={clubSlug}
        />
      </div>
    </div>
  );
}
