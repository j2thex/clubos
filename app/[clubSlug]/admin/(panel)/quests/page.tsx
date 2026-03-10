import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { QuestManager } from "../../quest-manager";

export default async function QuestsPage({
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

  const [{ data: quests }, { data: questCompletions }] = await Promise.all([
    supabase
      .from("quests")
      .select(
        "id, title, description, link, image_url, reward_spins, display_order, active, multi_use, quest_type"
      )
      .eq("club_id", club.id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("member_quests")
      .select("quest_id, quests!inner(club_id)")
      .eq("quests.club_id", club.id),
  ]);

  // Count completions per quest
  const completionCounts = new Map<string, number>();
  for (const c of questCompletions ?? []) {
    completionCounts.set(
      c.quest_id,
      (completionCounts.get(c.quest_id) ?? 0) + 1
    );
  }

  const questList = (quests ?? []).map((q) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    link: q.link,
    image_url: q.image_url,
    reward_spins: q.reward_spins,
    display_order: q.display_order,
    completions: completionCounts.get(q.id) ?? 0,
    multi_use: q.multi_use ?? false,
    quest_type: q.quest_type ?? "default",
  }));

  return (
    <div className="space-y-4">
      <Link
        href={`/${clubSlug}/admin/content`}
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Content
      </Link>
      <QuestManager quests={questList} clubId={club.id} clubSlug={clubSlug} />
    </div>
  );
}
