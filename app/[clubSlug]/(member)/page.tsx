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

  const [{ data: member }, { data: club }, { count: spinsDone }] = await Promise.all([
    supabase
      .from("members")
      .select("full_name, spin_balance, member_code")
      .eq("id", session.member_id)
      .single(),
    supabase
      .from("clubs")
      .select("name")
      .eq("id", session.club_id)
      .single(),
    supabase
      .from("spins")
      .select("*", { count: "exact", head: true })
      .eq("member_id", session.member_id),
  ]);

  const displayName = member?.full_name || "Member";
  const spinBalance = member?.spin_balance ?? 0;
  const clubName = club?.name ?? "";
  const totalSpins = spinsDone ?? 0;
  const level = Math.min(10, Math.floor(totalSpins / 5) + 1);

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
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide px-1">
            Quests
          </h2>
          <div className="space-y-3">
            {/* Quest: First Spin */}
            <div className="bg-white rounded-2xl shadow p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${totalSpins >= 1 ? "club-tint-bg club-primary" : "bg-gray-100 text-gray-300"}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">First Spin</p>
                <p className="text-xs text-gray-400">Complete your first spin</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${totalSpins >= 1 ? "club-tint-bg club-tint-text" : "bg-gray-100 text-gray-400"}`}>
                {totalSpins >= 1 ? "Done" : "0/1"}
              </span>
            </div>

            {/* Quest: 5 Spins */}
            <div className="bg-white rounded-2xl shadow p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${totalSpins >= 5 ? "club-tint-bg club-primary" : "bg-gray-100 text-gray-300"}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">Regular Spinner</p>
                <p className="text-xs text-gray-400">Complete 5 spins</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${totalSpins >= 5 ? "club-tint-bg club-tint-text" : "bg-gray-100 text-gray-400"}`}>
                {totalSpins >= 5 ? "Done" : `${totalSpins}/5`}
              </span>
            </div>

            {/* Quest: 25 Spins */}
            <div className="bg-white rounded-2xl shadow p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${totalSpins >= 25 ? "club-tint-bg club-primary" : "bg-gray-100 text-gray-300"}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">Wheel Master</p>
                <p className="text-xs text-gray-400">Complete 25 spins</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${totalSpins >= 25 ? "club-tint-bg club-tint-text" : "bg-gray-100 text-gray-400"}`}>
                {totalSpins >= 25 ? "Done" : `${totalSpins}/25`}
              </span>
            </div>

            {/* Quest: Reach Level 5 */}
            <div className="bg-white rounded-2xl shadow p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${level >= 5 ? "club-tint-bg club-primary" : "bg-gray-100 text-gray-300"}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">Rising Star</p>
                <p className="text-xs text-gray-400">Reach level 5</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${level >= 5 ? "club-tint-bg club-tint-text" : "bg-gray-100 text-gray-400"}`}>
                {level >= 5 ? "Done" : `Lvl ${level}/5`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
