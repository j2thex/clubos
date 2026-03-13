import { redirect } from "next/navigation";
import Link from "next/link";
import { getMemberFromCookie } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { t, getDateLocale } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n";

function formatTimestamp(iso: string, locale: Locale): string {
  const dl = getDateLocale(locale);
  const date = new Date(iso);
  return date.toLocaleDateString(dl, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) +
    " " +
    date.toLocaleTimeString(dl, {
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

  const locale = await getServerLocale();
  const hasSpins = spins && spins.length > 0;

  return (
    <div className="min-h-screen club-page-bg">
      {/* Header */}
      <div className="club-hero px-6 pt-10 pb-12 text-center">
        <h1 className="text-2xl font-bold text-white">{t(locale, "history.title")}</h1>
        <p className="mt-1 club-light-text text-sm">{t(locale, "history.subtitle")}</p>
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
                          ? "club-tint-bg club-primary"
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
                        {formatTimestamp(spin.created_at, locale)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      isWin
                        ? "club-tint-bg club-tint-text"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {isWin ? `+${spin.outcome_value}` : t(locale, "common.noWin")}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full club-tint-bg flex items-center justify-center">
              <svg
                className="w-8 h-8 club-primary"
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
              {t(locale, "history.noSpins")}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {t(locale, "history.trySpin")}
            </p>
            <Link
              href={`/${clubSlug}/spin`}
              className="club-btn mt-6 inline-block rounded-xl py-3 px-8 text-sm font-semibold"
            >
              {t(locale, "history.spinTheWheel")}
            </Link>
          </div>
        )}

        {/* Back to dashboard */}
        <div className="mt-6 text-center">
          <Link
            href={`/${clubSlug}`}
            className="text-sm font-medium club-primary hover:opacity-80 transition-opacity"
          >
            {t(locale, "history.backToDashboard")}
          </Link>
        </div>
      </div>
    </div>
  );
}
