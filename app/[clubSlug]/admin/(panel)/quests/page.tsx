import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { QuestManager } from "../../quest-manager";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { getReviewUrl } from "@/lib/google-maps";

export default async function QuestsPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, spin_display_decimals")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();
  const locale = await getServerLocale();

  const [{ data: quests }, { data: questCompletions }, { data: branding }] = await Promise.all([
    supabase
      .from("quests")
      .select(
        "id, title, description, link, image_url, icon, badge_id, reward_spins, display_order, active, multi_use, is_public, quest_type, proof_mode, proof_placeholder, tutorial_steps, title_es, description_es, deadline, category"
      )
      .eq("club_id", club.id)
      .order("display_order", { ascending: true }),
    supabase
      .from("member_quests")
      .select("quest_id, quests!inner(club_id)")
      .eq("quests.club_id", club.id),
    supabase
      .from("club_branding")
      .select("google_place_id, social_instagram, social_website")
      .eq("club_id", club.id)
      .single(),
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
    icon: q.icon ?? null,
    reward_spins: q.reward_spins,
    display_order: q.display_order,
    completions: completionCounts.get(q.id) ?? 0,
    multi_use: q.multi_use ?? false,
    is_public: q.is_public ?? false,
    quest_type: q.quest_type ?? "default",
    proof_mode: q.proof_mode ?? "none",
    proof_placeholder: q.proof_placeholder ?? null,
    tutorial_steps: q.tutorial_steps ?? null,
    badge_id: q.badge_id ?? null,
    title_es: q.title_es ?? null,
    description_es: q.description_es ?? null,
    deadline: q.deadline ?? null,
    category: q.category ?? "social",
    active: q.active ?? true,
  }));

  const googleReviewUrl = branding?.google_place_id ? getReviewUrl(branding.google_place_id) : null;

  return (
    <div className="space-y-4">
      <Link
        href={`/${clubSlug}/admin/content`}
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {t(locale, "admin.backToContent")}
      </Link>
      <QuestManager
        quests={questList}
        clubId={club.id}
        clubSlug={clubSlug}
        googleReviewUrl={googleReviewUrl}
        instagramUrl={branding?.social_instagram ?? null}
        websiteUrl={branding?.social_website ?? null}
        spinDisplayDecimals={club.spin_display_decimals ?? 0}
      />
    </div>
  );
}
