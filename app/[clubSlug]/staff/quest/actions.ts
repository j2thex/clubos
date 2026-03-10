"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity-log";
import { requireActiveStaff } from "@/lib/auth";

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
        quest_type: string;
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
      .select("id, title, reward_spins, multi_use, quest_type")
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
      quest_type: q.quest_type ?? "default",
      completionCount: completionCounts.get(q.id) ?? 0,
    })),
  };
}

export async function completeQuest(
  memberId: string,
  questId: string,
  staffMemberId: string,
  referralMemberCode?: string,
): Promise<{ error: string } | { ok: true; newBalance: number }> {
  try { await requireActiveStaff(); } catch { return { error: "Account is inactive" }; }
  if (staffMemberId === memberId) return { error: "Cannot validate your own quest" };
  const supabase = createAdminClient();
  const { data: quest } = await supabase
    .from("quests")
    .select("reward_spins, multi_use, title, club_id")
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
  const insertData: Record<string, unknown> = {
    quest_id: questId,
    member_id: memberId,
    verified_by: staffMemberId,
    status: "verified",
  };
  if (referralMemberCode) {
    insertData.referral_member_code = referralMemberCode;
  }

  const { error: insertError } = await supabase
    .from("member_quests")
    .insert(insertData);

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

  // Log activity
  const { data: targetMember } = await supabase
    .from("members")
    .select("member_code")
    .eq("id", memberId)
    .single();

  await logActivity({
    clubId: quest.club_id,
    staffMemberId: staffMemberId,
    action: "quest_validated",
    targetMemberCode: targetMember?.member_code,
    details: `${quest.title} (+${quest.reward_spins} spins)`,
  });

  return { ok: true, newBalance };
}

export async function approveQuest(
  memberQuestId: string,
  staffMemberId: string,
  clubSlug?: string,
  referralMemberCode?: string,
): Promise<{ error: string } | { ok: true; rewardSpins: number }> {
  try { await requireActiveStaff(); } catch { return { error: "Account is inactive" }; }
  const supabase = createAdminClient();

  // Get the pending quest
  const { data: mq } = await supabase
    .from("member_quests")
    .select("id, member_id, quest_id, status")
    .eq("id", memberQuestId)
    .single();

  if (!mq) return { error: "Quest submission not found" };
  if (mq.status !== "pending") return { error: "Quest is not pending" };
  if (staffMemberId === mq.member_id) return { error: "Cannot approve your own quest" };

  // Get reward amount
  const { data: quest } = await supabase
    .from("quests")
    .select("reward_spins, title, club_id")
    .eq("id", mq.quest_id)
    .single();

  if (!quest) return { error: "Quest not found" };

  // Mark as verified
  const updateData: Record<string, unknown> = { status: "verified", verified_by: staffMemberId };
  if (referralMemberCode) {
    updateData.referral_member_code = referralMemberCode;
  }
  const { error: updateError } = await supabase
    .from("member_quests")
    .update(updateData)
    .eq("id", memberQuestId);

  if (updateError) return { error: "Failed to approve quest" };

  // Award spins
  const { data: member } = await supabase
    .from("members")
    .select("spin_balance")
    .eq("id", mq.member_id)
    .single();

  const newBalance = (member?.spin_balance ?? 0) + quest.reward_spins;

  await supabase
    .from("members")
    .update({ spin_balance: newBalance })
    .eq("id", mq.member_id);

  // Log activity
  const { data: targetMember } = await supabase
    .from("members")
    .select("member_code")
    .eq("id", mq.member_id)
    .single();

  await logActivity({
    clubId: quest.club_id,
    staffMemberId: staffMemberId,
    action: "quest_approved",
    targetMemberCode: targetMember?.member_code,
    details: `${quest.title} (+${quest.reward_spins} spins)`,
  });

  if (clubSlug) {
    revalidatePath(`/${clubSlug}`);
    revalidatePath(`/${clubSlug}/staff`);
  }

  return { ok: true, rewardSpins: quest.reward_spins };
}

export async function declineQuest(
  memberQuestId: string,
  staffMemberId: string,
  clubSlug?: string,
): Promise<{ error: string } | { ok: true }> {
  try { await requireActiveStaff(); } catch { return { error: "Account is inactive" }; }
  const supabase = createAdminClient();

  const { data: mq } = await supabase
    .from("member_quests")
    .select("id, member_id, quest_id, status")
    .eq("id", memberQuestId)
    .single();

  if (!mq) return { error: "Quest submission not found" };
  if (mq.status !== "pending") return { error: "Quest is not pending" };
  if (staffMemberId === mq.member_id) return { error: "Cannot decline your own quest" };

  const { data: quest } = await supabase
    .from("quests")
    .select("title, club_id")
    .eq("id", mq.quest_id)
    .single();

  // Delete the record so member can re-submit
  const { error: deleteError } = await supabase
    .from("member_quests")
    .delete()
    .eq("id", memberQuestId);

  if (deleteError) return { error: "Failed to decline quest" };

  const { data: targetMember } = await supabase
    .from("members")
    .select("member_code")
    .eq("id", mq.member_id)
    .single();

  await logActivity({
    clubId: quest?.club_id ?? "",
    staffMemberId,
    action: "quest_declined",
    targetMemberCode: targetMember?.member_code,
    details: quest?.title ?? "Unknown quest",
  });

  if (clubSlug) {
    revalidatePath(`/${clubSlug}`);
    revalidatePath(`/${clubSlug}/staff`);
  }

  return { ok: true };
}
