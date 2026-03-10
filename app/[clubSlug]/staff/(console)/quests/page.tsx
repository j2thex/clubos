import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffFromCookie } from "@/lib/auth";
import { notFound } from "next/navigation";
import { StaffQuestClient } from "../../quest/staff-quest-client";

export default async function StaffQuestsPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();
  const session = await getStaffFromCookie();

  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  const [{ data: quests }, { data: pendingRaw }] = await Promise.all([
    supabase
      .from("quests")
      .select("id, title, reward_spins, quest_type")
      .eq("club_id", club.id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("member_quests")
      .select("id, completed_at, proof_url, quests!inner(title, reward_spins, quest_type, club_id), members!member_quests_member_id_fkey!inner(member_code, full_name)")
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
      proof_url: (p.proof_url as string) ?? null,
    };
  });

  return quests && quests.length > 0 ? (
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
  ) : (
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-900">No quests yet</p>
      <p className="text-xs text-gray-400 mt-1">Quests will appear here once created by admin.</p>
    </div>
  );
}
