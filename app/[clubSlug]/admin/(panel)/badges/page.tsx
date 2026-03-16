import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BadgeManager } from "../../badge-manager";

export default async function BadgesPage({
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

  const [{ data: badges }, { data: earnedCounts }] = await Promise.all([
    supabase
      .from("badges")
      .select("id, name, description, icon, image_url, color, display_order")
      .eq("club_id", club.id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("member_badges")
      .select("badge_id"),
  ]);

  // Count earned per badge
  const countMap = new Map<string, number>();
  for (const e of earnedCounts ?? []) {
    countMap.set(e.badge_id, (countMap.get(e.badge_id) ?? 0) + 1);
  }

  const badgeList = (badges ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    icon: b.icon ?? null,
    image_url: b.image_url ?? null,
    color: b.color ?? "#6b7280",
    earnedCount: countMap.get(b.id) ?? 0,
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
        Back to Content
      </Link>
      <BadgeManager badges={badgeList} clubId={club.id} clubSlug={clubSlug} />
    </div>
  );
}
