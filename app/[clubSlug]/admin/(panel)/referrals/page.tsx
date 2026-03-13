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

  // Get referrals from two sources:
  // 1. Quest-based referrals (member_quests with referral_member_code)
  // 2. Direct referrals (members.referred_by set during creation)
  const [{ data: referralCompletions }, { data: directReferrals }] = await Promise.all([
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
  ]);

  // Build referrer groups map
  const referrerGroups = new Map<string, {
    code: string;
    name: string | null;
    referrals: { code: string; name: string | null; date: string }[];
  }>();

  // Track referred codes to deduplicate across sources
  const seenPairs = new Set<string>();

  // Process direct referrals (members.referred_by)
  if (directReferrals && directReferrals.length > 0) {
    // Look up referrer names
    const referrerCodes = [...new Set(directReferrals.map((r) => r.referred_by!))];
    const { data: referrerMembers } = await supabase
      .from("members")
      .select("member_code, full_name")
      .eq("club_id", club.id)
      .in("member_code", referrerCodes);

    const referrerNameMap = new Map(
      (referrerMembers ?? []).map((m) => [m.member_code, m.full_name]),
    );

    for (const member of directReferrals) {
      const referrerCode = member.referred_by!;
      const pairKey = `${referrerCode}->${member.member_code}`;
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      if (!referrerGroups.has(referrerCode)) {
        referrerGroups.set(referrerCode, {
          code: referrerCode,
          name: referrerNameMap.get(referrerCode) ?? null,
          referrals: [],
        });
      }

      referrerGroups.get(referrerCode)!.referrals.push({
        code: member.member_code,
        name: member.full_name,
        date: member.created_at,
      });
    }
  }

  // Process quest-based referrals
  if (referralCompletions && referralCompletions.length > 0) {
    const memberIds = [...new Set(referralCompletions.map((r) => r.member_id))];
    const { data: members } = await supabase
      .from("members")
      .select("id, member_code, full_name")
      .in("id", memberIds);

    const memberMap = new Map(
      (members ?? []).map((m) => [m.id, { code: m.member_code, name: m.full_name }]),
    );

    const referredCodes = [...new Set(
      referralCompletions.map((r) => r.referral_member_code).filter(Boolean) as string[],
    )];
    const { data: referredMembers } = await supabase
      .from("members")
      .select("member_code, full_name")
      .eq("club_id", club.id)
      .in("member_code", referredCodes.length > 0 ? referredCodes : ["__none__"]);

    const referredMap = new Map(
      (referredMembers ?? []).map((m) => [m.member_code, m.full_name]),
    );

    for (const completion of referralCompletions) {
      const referrer = memberMap.get(completion.member_id);
      if (!referrer) continue;

      const referredCode = completion.referral_member_code!;
      const pairKey = `${referrer.code}->${referredCode}`;
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      if (!referrerGroups.has(referrer.code)) {
        referrerGroups.set(referrer.code, {
          code: referrer.code,
          name: referrer.name,
          referrals: [],
        });
      }

      referrerGroups.get(referrer.code)!.referrals.push({
        code: referredCode,
        name: referredMap.get(referredCode) ?? null,
        date: completion.completed_at,
      });
    }
  }

  // Sort by referral count descending
  const referrers = [...referrerGroups.values()].sort(
    (a, b) => b.referrals.length - a.referrals.length,
  );

  const totalReferrals = referrers.reduce((sum, r) => sum + r.referrals.length, 0);

  if (totalReferrals === 0) {
    return (
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
          {t(locale, "admin.referralsTitle")}
        </h2>
        <ReferralTree referrers={[]} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
        {t(locale, "admin.referralsCount", { count: totalReferrals })}
      </h2>
      <ReferralTree referrers={referrers} />
    </div>
  );
}
