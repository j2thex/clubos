"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function lookupMemberQuests(
  memberCode: string,
  clubId: string,
): Promise<
  | { error: string }
  | {
      memberId: string;
      memberCode: string;
      quests: {
        id: string;
        title: string;
        reward_spins: number;
        multi_use: boolean;
        completionCount: number;
      }[];
    }
> {
  const code = memberCode.trim().toUpperCase();

  if (!code || code.length < 3 || code.length > 6) {
    return { error: "Invalid member code" };
  }
  if (!/^[A-Z0-9]+$/.test(code)) {
    return { error: "Invalid member code" };
  }

  const supabase = createAdminClient();

  const { data: member } = await supabase
    .from("members")
    .select("id, member_code")
    .eq("club_id", clubId)
    .eq("member_code", code)
    .eq("status", "active")
    .single();

  if (!member) return { error: "Member not found" };

  const [{ data: quests }, { data: completions }] = await Promise.all([
    supabase
      .from("quests")
      .select("id, title, reward_spins, multi_use")
      .eq("club_id", clubId)
      .eq("active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("member_quests")
      .select("quest_id")
      .eq("member_id", member.id),
  ]);

  // Count completions per quest
  const completionCounts = new Map<string, number>();
  for (const c of completions ?? []) {
    completionCounts.set(c.quest_id, (completionCounts.get(c.quest_id) ?? 0) + 1);
  }

  return {
    memberId: member.id,
    memberCode: member.member_code,
    quests: (quests ?? []).map((q) => ({
      id: q.id,
      title: q.title,
      reward_spins: q.reward_spins,
      multi_use: q.multi_use ?? false,
      completionCount: completionCounts.get(q.id) ?? 0,
    })),
  };
}

export async function completeQuest(
  memberId: string,
  questId: string,
  staffMemberId: string,
): Promise<{ error: string } | { ok: true; newBalance: number }> {
  const supabase = createAdminClient();

  // Get quest reward and multi_use flag
  const { data: quest } = await supabase
    .from("quests")
    .select("reward_spins, multi_use")
    .eq("id", questId)
    .single();

  if (!quest) return { error: "Quest not found" };

  // For single-use quests, check if already completed
  if (!quest.multi_use) {
    const { data: existing } = await supabase
      .from("member_quests")
      .select("id")
      .eq("quest_id", questId)
      .eq("member_id", memberId)
      .limit(1);

    if (existing && existing.length > 0) {
      return { error: "Quest already completed" };
    }
  }

  // Insert completion
  const { error: insertError } = await supabase
    .from("member_quests")
    .insert({
      quest_id: questId,
      member_id: memberId,
      verified_by: staffMemberId,
    });

  if (insertError) {
    return { error: "Failed to complete quest" };
  }

  // Award spins
  const { data: member } = await supabase
    .from("members")
    .select("spin_balance")
    .eq("id", memberId)
    .single();

  const newBalance = (member?.spin_balance ?? 0) + quest.reward_spins;

  await supabase
    .from("members")
    .update({ spin_balance: newBalance })
    .eq("id", memberId);

  return { ok: true, newBalance };
}
