import { redirect } from "next/navigation";
import { getMemberFromCookie } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logout } from "./actions";
import { MemberQrCard } from "@/components/club/member-qr-card";
import { EmailField } from "./email-field";

import { BadgeCollection } from "../badge-collection";
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

  const [{ data: member }, { data: spins }, { data: branding }, { data: clubBadges }, { data: memberBadges }] = await Promise.all([
    supabase
      .from("members")
      .select("member_code, spin_balance, valid_till, created_at, email")
      .eq("id", session.member_id)
      .single(),
    supabase
      .from("spins")
      .select("id, outcome_label, outcome_value, created_at")
      .eq("member_id", session.member_id)
      .eq("club_id", session.club_id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("club_branding")
      .select("logo_url")
      .eq("club_id", session.club_id)
      .single(),
    supabase
      .from("badges")
      .select("id, name, description, icon, image_url, color, quests(title)")
      .eq("club_id", session.club_id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("member_badges")
      .select("badge_id, earned_at")
      .eq("member_id", session.member_id),
  ]);

  // Fetch referrals (members referred by this member's code)
  const { data: referrals } = member?.member_code
    ? await supabase
        .from("members")
        .select("member_code, full_name, created_at")
        .eq("club_id", session.club_id)
        .eq("referred_by", member.member_code)
        .order("created_at", { ascending: false })
    : { data: [] };

  const logoUrl = branding?.logo_url ?? null;
  const locale = await getServerLocale();

  const memberCode = member?.member_code ?? "";
  const spinBalance = member?.spin_balance ?? 0;
  const memberSince = member?.created_at
    ? new Date(member.created_at).toLocaleDateString(getDateLocale(locale), {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown";

  const hasSpins = spins && spins.length > 0;
  const logoutWithSlug = logout.bind(null, clubSlug);

  return (
    <div className="min-h-screen club-page-bg">
      {/* Header */}
      <div className="club-hero px-6 pt-10 pb-16 text-center">
        {logoUrl && (
          <img src={logoUrl} alt="Club logo" className="w-10 h-10 rounded-lg object-cover mx-auto mb-2 shadow ring-2 ring-white/20" />
        )}
        <h1 className="text-2xl font-bold text-white">{t(locale, "profile.title")}</h1>
        <p className="club-light-text text-sm mt-1">{memberCode}</p>
      </div>

      {/* Profile card */}
      <div className="px-4 -mt-8 pb-10 max-w-md mx-auto space-y-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* QR Code & Member Code */}
          <div className="club-tint-bg border-b club-tint-border px-6 py-8 text-center">
            <MemberQrCard memberCode={memberCode} />
          </div>

          {/* Info fields */}
          <div className="divide-y divide-gray-100">
            {/* Dates row */}
            <div className={`px-6 py-4 grid ${member?.valid_till ? "grid-cols-2 gap-4" : ""}`}>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t(locale, "profile.memberSince")}
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {memberSince}
                </p>
              </div>
              {member?.valid_till && (() => {
                const validDate = new Date(member.valid_till + "T00:00:00");
                const now = new Date();
                const daysLeft = Math.ceil((validDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const isExpired = daysLeft < 0;
                const isExpiringSoon = daysLeft >= 0 && daysLeft <= 30;
                const formatted = validDate.toLocaleDateString(getDateLocale(locale), { month: "short", day: "numeric", year: "numeric" });
                return (
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t(locale, "profile.validTill")}
                    </p>
                    <p className={`mt-1 text-sm font-semibold ${isExpired ? "text-red-500" : isExpiringSoon ? "text-amber-500" : "text-green-600"}`}>
                      {formatted}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Email */}
            <EmailField
              currentEmail={member?.email ?? null}
              memberId={session.member_id}
            />
          </div>
        </div>

        {/* Badges */}
        {clubBadges && clubBadges.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide px-1">
              {t(locale, "profile.badges")}
            </h2>
            <BadgeCollection
              allBadges={(clubBadges ?? []).map((b) => {
                const quest = Array.isArray(b.quests) ? b.quests[0] : b.quests;
                return {
                  id: b.id,
                  name: b.name,
                  description: b.description,
                  icon: b.icon ?? null,
                  imageUrl: b.image_url ?? null,
                  color: b.color ?? "#6b7280",
                  questTitle: quest?.title ?? null,
                };
              })}
              earnedBadges={(memberBadges ?? []).map((mb) => ({
                badgeId: mb.badge_id,
                earnedAt: mb.earned_at,
              }))}
            />
          </div>
        )}

        {/* Spin History */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide px-1">
            {t(locale, "profile.spinHistory")}
          </h2>
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
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isWin
                            ? "club-tint-bg club-primary"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {isWin ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
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
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <p className="text-gray-400 text-sm">{t(locale, "profile.noSpins")}</p>
            </div>
          )}
        </div>

        {/* Referrals */}
        {referrals && referrals.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide px-1">
              {t(locale, "profile.referralsTitle")}
            </h2>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="club-tint-bg px-5 py-3 flex items-center justify-between border-b club-tint-border">
                <span className="text-sm font-semibold club-tint-text">
                  {t(locale, "profile.referredPeople")}
                </span>
                <span className="text-xs font-bold club-tint-text px-2.5 py-1 rounded-full" style={{ backgroundColor: "color-mix(in srgb, var(--club-primary, #16a34a) 15%, white)" }}>
                  {referrals.length}
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {referrals.map((ref) => (
                  <div key={ref.member_code} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 font-mono tracking-wide">
                        {ref.member_code}
                      </p>
                      {ref.full_name && (
                        <p className="text-xs text-gray-400 truncate">{ref.full_name}</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 shrink-0">
                      {new Date(ref.created_at).toLocaleDateString(getDateLocale(locale), { month: "short", day: "numeric" })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <form action={logoutWithSlug}>
          <button
            type="submit"
            className="w-full rounded-2xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-3.5 text-center transition-colors shadow"
          >
            {t(locale, "common.logout")}
          </button>
        </form>
      </div>
    </div>
  );
}
