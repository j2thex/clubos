import { redirect } from "next/navigation";
import { getMemberFromCookie } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function MemberDashboard({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const session = await getMemberFromCookie();

  if (!session) {
    redirect(`/${clubSlug}/login`);
  }

  const supabase = createAdminClient();

  const [{ data: member }, { data: club }, { count: spinsDone }, { data: quests }, { data: completedQuests }] = await Promise.all([
    supabase
      .from("members")
      .select("full_name, spin_balance, member_code")
      .eq("id", session.member_id)
      .single(),
    supabase
      .from("clubs")
      .select("id, name")
      .eq("id", session.club_id)
      .single(),
    supabase
      .from("spins")
      .select("*", { count: "exact", head: true })
      .eq("member_id", session.member_id),
    supabase
      .from("quests")
      .select("id, title, description, link, reward_spins")
      .eq("club_id", session.club_id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("member_quests")
      .select("quest_id")
      .eq("member_id", session.member_id),
  ]);

  const displayName = member?.full_name || "Member";
  const spinBalance = member?.spin_balance ?? 0;
  const clubName = club?.name ?? "";
  const totalSpins = spinsDone ?? 0;
  const level = Math.min(10, Math.floor(totalSpins / 5) + 1);

  const completedQuestIds = new Set((completedQuests ?? []).map((c) => c.quest_id));
  const activeQuests = quests ?? [];

  return (
    <div className="min-h-screen club-page-bg">
      {/* Hero area */}
      <div className="club-hero px-6 pt-10 pb-16 text-center">
        {clubName && (
          <p className="club-light-text text-sm font-medium tracking-wide uppercase mb-2">
            {clubName}
          </p>
        )}
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {displayName}
        </h1>
      </div>

      {/* Content cards */}
      <div className="px-4 -mt-8 pb-10 max-w-md mx-auto space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {/* Remaining Spins */}
          <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Remaining
            </p>
            <p className="mt-1 text-3xl font-extrabold club-primary">
              {spinBalance}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">spins</p>
          </div>

          {/* Spins Done */}
          <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Completed
            </p>
            <p className="mt-1 text-3xl font-extrabold club-primary">
              {totalSpins}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">spins</p>
          </div>

          {/* Level */}
          <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Level
            </p>
            <p className="mt-1 text-3xl font-extrabold club-primary">
              {level}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">/ 10</p>
          </div>
        </div>

        {/* Quests */}
        {activeQuests.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide px-1">
              Quests
            </h2>
            <div className="space-y-3">
              {activeQuests.map((q) => {
                const done = completedQuestIds.has(q.id);
                return (
                  <div key={q.id} className="bg-white rounded-2xl shadow p-4 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${done ? "club-tint-bg club-primary" : "bg-gray-100 text-gray-300"}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={done ? "M5 13l4 4L19 7" : "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"} />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{q.title}</p>
                      {q.description && (
                        <p className="text-xs text-gray-400">{q.description}</p>
                      )}
                      {q.link && !done && (
                        <a
                          href={q.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-1 text-xs font-medium club-primary underline"
                        >
                          Open link
                        </a>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${done ? "club-tint-bg club-tint-text" : "bg-gray-100 text-gray-400"}`}>
                      {done ? "Done" : `+${q.reward_spins} spin${q.reward_spins === 1 ? "" : "s"}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
