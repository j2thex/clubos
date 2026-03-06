import { redirect } from "next/navigation";
import Link from "next/link";
import { getMemberFromCookie } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logout } from "./actions";

export default async function ProfilePage({
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

  const { data: member } = await supabase
    .from("members")
    .select("full_name, member_code, spin_balance, created_at")
    .eq("id", session.member_id)
    .single();

  const displayName = member?.full_name || "Member";
  const memberCode = member?.member_code ?? "";
  const spinBalance = member?.spin_balance ?? 0;
  const memberSince = member?.created_at
    ? new Date(member.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown";

  const logoutWithSlug = logout.bind(null, clubSlug);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="club-hero px-6 pt-10 pb-16 text-center">
        {/* Back link */}
        <div className="absolute top-4 left-4">
          <Link
            href={`/${clubSlug}`}
            className="inline-flex items-center club-light-text hover:text-white text-sm font-medium transition-colors"
          >
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Dashboard
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-white mt-4">Your Profile</h1>
        <p className="club-light-text text-sm mt-1">{displayName}</p>
      </div>

      {/* Profile card */}
      <div className="px-4 -mt-8 pb-10 max-w-md mx-auto space-y-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Member Code */}
          <div className="club-tint-bg border-b club-tint-border px-6 py-5 text-center">
            <p className="text-xs font-medium club-tint-text uppercase tracking-wider mb-2">
              Member Code
            </p>
            <p className="text-3xl font-bold font-mono tracking-widest club-tint-text inline-block px-5 py-2 rounded-lg" style={{ backgroundColor: "color-mix(in srgb, var(--club-primary, #16a34a) 15%, white)" }}>
              {memberCode}
            </p>
          </div>

          {/* Info fields */}
          <div className="divide-y divide-gray-100">
            {/* Full Name */}
            <div className="px-6 py-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Full Name
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {displayName}
              </p>
            </div>

            {/* Spin Balance */}
            <div className="px-6 py-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Spin Balance
              </p>
              <p className="mt-1 text-lg font-semibold club-primary">
                {spinBalance}{" "}
                <span className="text-sm font-normal text-gray-400">
                  {spinBalance === 1 ? "spin" : "spins"} available
                </span>
              </p>
            </div>

            {/* Member Since */}
            <div className="px-6 py-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Member Since
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {memberSince}
              </p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <form action={logoutWithSlug}>
          <button
            type="submit"
            className="w-full rounded-2xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-3.5 text-center transition-colors shadow"
          >
            Log Out
          </button>
        </form>
      </div>
    </div>
  );
}
