import { redirect } from "next/navigation";
import Link from "next/link";
import { getMemberFromCookie } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) +
    " at " +
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
}

export default async function SpinHistoryPage({
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

  const { data: spins } = await supabase
    .from("spins")
    .select("id, outcome_label, outcome_value, created_at")
    .eq("member_id", session.member_id)
    .eq("club_id", session.club_id)
    .order("created_at", { ascending: false });

  const hasSpins = spins && spins.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 to-green-900 px-6 pt-10 pb-12 text-center">
        <h1 className="text-2xl font-bold text-white">Spin History</h1>
        <p className="mt-1 text-green-200 text-sm">Your past spin results</p>
      </div>

      {/* Content */}
      <div className="px-4 -mt-6 pb-10 max-w-md mx-auto">
        {hasSpins ? (
          <div className="space-y-3">
            {spins.map((spin) => {
              const isWin = spin.outcome_value > 0;
              return (
                <div
                  key={spin.id}
                  className="bg-white rounded-2xl shadow p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isWin
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isWin ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M20 12H4"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {spin.outcome_label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatTimestamp(spin.created_at)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      isWin
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {isWin ? `+${spin.outcome_value}` : "No Win"}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-gray-700 font-semibold text-lg">
              No spins yet
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Try your luck and spin the wheel!
            </p>
            <Link
              href={`/${clubSlug}/spin`}
              className="mt-6 inline-block rounded-xl py-3 px-8 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 active:bg-green-800 transition-colors"
            >
              Spin the Wheel
            </Link>
          </div>
        )}

        {/* Back to dashboard */}
        <div className="mt-6 text-center">
          <Link
            href={`/${clubSlug}`}
            className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
          >
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
