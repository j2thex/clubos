import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffFromCookie } from "@/lib/auth";
import { notFound } from "next/navigation";
import { StaffSpinClient } from "./spin/staff-spin-client";
import { StaffQuestClient } from "./quest/staff-quest-client";

export default async function StaffDashboard({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();
  const session = await getStaffFromCookie();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  const [{ data: segments }, { data: quests }, { data: pendingRaw }] = await Promise.all([
    supabase
      .from("wheel_configs")
      .select("label, color, label_color, probability")
      .eq("club_id", club.id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("quests")
      .select("id, title, reward_spins, quest_type")
      .eq("club_id", club.id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("member_quests")
      .select("id, completed_at, quests!inner(title, reward_spins, quest_type, club_id), members!member_quests_member_id_fkey!inner(member_code, full_name)")
      .eq("status", "pending")
      .eq("quests.club_id", club.id)
      .order("completed_at", { ascending: true }),
  ]);

  const pendingQuests = (pendingRaw ?? []).map((p: Record<string, unknown>) => {
    const quest = (Array.isArray(p.quests) ? p.quests[0] : p.quests) as { title: string; reward_spins: number; quest_type: string };
    const member = (Array.isArray(p.members) ? p.members[0] : p.members) as { member_code: string; full_name: string | null };
    return {
      id: p.id as string,
      quest_title: quest.title,
      reward_spins: quest.reward_spins,
      quest_type: quest.quest_type ?? "default",
      member_code: member.member_code,
      member_name: member.full_name,
      completed_at: p.completed_at as string,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 px-6 pt-10 pb-12">
        <h1 className="text-2xl font-bold text-white">Staff Console</h1>
        <p className="mt-1 text-gray-400 text-sm">{club.name}</p>
        <div className="mt-4">
          <a
            href={`/${clubSlug}`}
            className="text-xs text-gray-400 hover:text-white border border-gray-600 rounded-lg px-3 py-1.5 transition-colors"
          >
            View Member Page
          </a>
        </div>
      </div>

      <div className="px-4 -mt-6 pb-10 max-w-md mx-auto space-y-6">
        {/* Spin the Wheel */}
        {segments && segments.length > 0 ? (
          <StaffSpinClient
            clubId={club.id}
            segments={segments.map((s) => ({
              label: s.label,
              color: s.color ?? "#16a34a",
              labelColor: s.label_color ?? "#ffffff",
              probability: Number(s.probability),
            }))}
          />
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-gray-400 text-sm">
            Wheel not configured yet.
          </div>
        )}

        {/* Quest Completion */}
        {quests && quests.length > 0 && (
          <StaffQuestClient
            clubId={club.id}
            clubSlug={clubSlug}
            quests={quests.map((q) => ({
              id: q.id,
              title: q.title,
              reward_spins: q.reward_spins,
              quest_type: q.quest_type ?? "default",
            }))}
            staffMemberId={session?.member_id ?? ""}
            pendingQuests={pendingQuests}
          />
        )}
      </div>
    </div>
  );
}
