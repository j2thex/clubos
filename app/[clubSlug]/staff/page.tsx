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

  const [{ data: segments }, { data: quests }] = await Promise.all([
    supabase
      .from("wheel_configs")
      .select("label, color, label_color, probability")
      .eq("club_id", club.id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("quests")
      .select("id, title, reward_spins")
      .eq("club_id", club.id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
  ]);

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
            quests={quests.map((q) => ({
              id: q.id,
              title: q.title,
              reward_spins: q.reward_spins,
            }))}
            staffMemberId={session?.member_id ?? ""}
          />
        )}
      </div>
    </div>
  );
}
