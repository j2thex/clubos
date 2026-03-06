import { redirect } from "next/navigation";
import Link from "next/link";
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

  // Fetch member data and club branding in parallel
  const [{ data: member }, { data: club }] = await Promise.all([
    supabase
      .from("members")
      .select("full_name, spin_balance, member_code")
      .eq("id", session.member_id)
      .single(),
    supabase
      .from("clubs")
      .select("name, club_branding(logo_url, primary_color)")
      .eq("id", session.club_id)
      .single(),
  ]);

  const displayName = member?.full_name || "Member";
  const spinBalance = member?.spin_balance ?? 0;
  const memberCode = member?.member_code ?? "";
  const clubName = club?.name ?? "";
  const branding = (club?.club_branding as Record<string, string>[] | null)?.[0] ?? null;
  const primaryColor = branding?.primary_color ?? "#16a34a";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero area with dark green gradient */}
      <div
        className="px-6 pt-10 pb-16 text-center"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, #052e16)`,
        }}
      >
        {clubName && (
          <p className="text-green-200 text-sm font-medium tracking-wide uppercase mb-2">
            {clubName}
          </p>
        )}
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {displayName}
        </h1>
        {memberCode && (
          <p className="mt-2 text-green-200 text-sm">
            Member Code: <span className="font-mono font-semibold text-white">{memberCode}</span>
          </p>
        )}
      </div>

      {/* Content cards, pulled up to overlap hero */}
      <div className="px-4 -mt-8 pb-10 max-w-md mx-auto space-y-4">
        {/* Spin Balance Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Your Spin Balance
          </p>
          <p
            className="mt-2 text-6xl font-extrabold"
            style={{ color: primaryColor }}
          >
            {spinBalance}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {spinBalance === 1 ? "spin available" : "spins available"}
          </p>
          <Link
            href={`/${clubSlug}/spin`}
            className="mt-6 inline-block w-full rounded-xl py-3.5 px-6 text-lg font-semibold text-white text-center transition-colors bg-green-600 hover:bg-green-700 active:bg-green-800"
          >
            Spin the Wheel
          </Link>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href={`/${clubSlug}/history`}
            className="flex flex-col items-center justify-center bg-white rounded-2xl shadow p-5 border-2 border-green-100 hover:border-green-400 transition-colors group"
          >
            <svg
              className="w-7 h-7 text-green-600 mb-2 group-hover:text-green-700 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-green-700 transition-colors">
              History
            </span>
          </Link>

          <Link
            href={`/${clubSlug}/profile`}
            className="flex flex-col items-center justify-center bg-white rounded-2xl shadow p-5 border-2 border-green-100 hover:border-green-400 transition-colors group"
          >
            <svg
              className="w-7 h-7 text-green-600 mb-2 group-hover:text-green-700 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-green-700 transition-colors">
              Profile
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
