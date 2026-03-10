import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { ReferralTree } from "../../referral-tree";

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

  // Get all verified referral quest completions for this club
  const { data: referralCompletions } = await supabase
    .from("member_quests")
    .select("member_id, referral_member_code, completed_at, quests!inner(quest_type, club_id)")
    .eq("quests.quest_type", "referral")
    .eq("quests.club_id", club.id)
    .eq("status", "verified")
    .not("referral_member_code", "is", null)
    .order("completed_at", { ascending: false });

  if (!referralCompletions || referralCompletions.length === 0) {
    return (
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
          Referrals
        </h2>
        <ReferralTree referrers={[]} />
      </div>
    );
  }

  // Collect all referrer member IDs
  const memberIds = [...new Set(referralCompletions.map((r) => r.member_id))];
  const { data: members } = await supabase
    .from("members")
    .select("id, member_code, full_name")
    .in("id", memberIds);

  const memberMap = new Map(
    (members ?? []).map((m) => [m.id, { code: m.member_code, name: m.full_name }]),
  );

  // Collect all referred member codes and look up their names
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

  // Group by referrer
  const referrerGroups = new Map<string, {
    code: string;
    name: string | null;
    referrals: { code: string; name: string | null; date: string }[];
  }>();

  for (const completion of referralCompletions) {
    const referrer = memberMap.get(completion.member_id);
    if (!referrer) continue;

    const referredCode = completion.referral_member_code!;

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

  // Sort by referral count descending
  const referrers = [...referrerGroups.values()].sort(
    (a, b) => b.referrals.length - a.referrals.length,
  );

  const totalReferrals = referralCompletions.length;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
        Referrals ({totalReferrals})
      </h2>
      <ReferralTree referrers={referrers} />
    </div>
  );
}
