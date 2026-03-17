import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { ReferralTree } from "../../referral-tree";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

export default async function AdminReferralsPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();
  const locale = await getServerLocale();

  // Get referrals from two sources + all members for premium referrer data
  const [{ data: referralCompletions }, { data: directReferrals }, { data: allMembers }] = await Promise.all([
    supabase
      .from("member_quests")
      .select("member_id, referral_member_code, completed_at, quests!inner(quest_type, club_id)")
      .eq("quests.quest_type", "referral")
      .eq("quests.club_id", club.id)
      .eq("status", "verified")
      .not("referral_member_code", "is", null)
      .order("completed_at", { ascending: false }),
    supabase
      .from("members")
      .select("member_code, full_name, referred_by, created_at")
      .eq("club_id", club.id)
      .not("referred_by", "is", null),
    supabase
      .from("members")
      .select("id, member_code, full_name, is_premium_referrer, referral_reward_spins")
      .eq("club_id", club.id)
      .eq("status", "active"),
  ]);

  // Build member lookup maps
  const memberByCode = new Map(
    (allMembers ?? []).map((m) => [m.member_code, m]),
  );
  const memberById = new Map(
    (allMembers ?? []).map((m) => [m.id, m]),
  );

  // Build referrer groups map
  const referrerGroups = new Map<string, {
    code: string;
    name: string | null;
    memberId: string;
    isPremiumReferrer: boolean;
    referralRewardSpins: number;
    referrals: { code: string; name: string | null; date: string }[];
  }>();

  const seenPairs = new Set<string>();

  // Helper to get or create a referrer group
  function getGroup(code: string) {
    if (!referrerGroups.has(code)) {
      const member = memberByCode.get(code);
      referrerGroups.set(code, {
        code,
        name: member?.full_name ?? null,
        memberId: member?.id ?? "",
        isPremiumReferrer: member?.is_premium_referrer ?? false,
        referralRewardSpins: member?.referral_reward_spins ?? 0,
        referrals: [],
      });
    }
    return referrerGroups.get(code)!;
  }

  // Process direct referrals (members.referred_by)
  if (directReferrals && directReferrals.length > 0) {
    for (const member of directReferrals) {
      const referrerCode = member.referred_by!;
      const pairKey = `${referrerCode}->${member.member_code}`;
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      getGroup(referrerCode).referrals.push({
        code: member.member_code,
        name: member.full_name,
        date: member.created_at,
      });
    }
  }

  // Process quest-based referrals
  if (referralCompletions && referralCompletions.length > 0) {
    for (const completion of referralCompletions) {
      const referrer = memberById.get(completion.member_id);
      if (!referrer) continue;

      const referredCode = completion.referral_member_code!;
      const pairKey = `${referrer.member_code}->${referredCode}`;
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      const referredMember = memberByCode.get(referredCode);
      getGroup(referrer.member_code).referrals.push({
        code: referredCode,
        name: referredMember?.full_name ?? null,
        date: completion.completed_at,
      });
    }
  }

  // Also include premium referrers who have no referrals yet (so admin can see/manage them)
  for (const member of allMembers ?? []) {
    if (member.is_premium_referrer && !referrerGroups.has(member.member_code)) {
      getGroup(member.member_code); // creates empty group
    }
  }

  // Sort: premium referrers first, then by referral count descending
  const referrers = [...referrerGroups.values()].sort((a, b) => {
    if (a.isPremiumReferrer !== b.isPremiumReferrer) return a.isPremiumReferrer ? -1 : 1;
    return b.referrals.length - a.referrals.length;
  });

  const totalReferrals = referrers.reduce((sum, r) => sum + r.referrals.length, 0);

  // Get all active members for the "make premium" dropdown
  const memberOptions = (allMembers ?? [])
    .filter((m) => !referrerGroups.has(m.member_code))
    .map((m) => ({ id: m.id, code: m.member_code, name: m.full_name }));

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
        {totalReferrals === 0
          ? t(locale, "admin.referralsTitle")
          : t(locale, "admin.referralsCount", { count: totalReferrals })}
      </h2>
      <ReferralTree
        referrers={referrers}
        clubSlug={clubSlug}
        memberOptions={memberOptions}
      />
    </div>
  );
}
