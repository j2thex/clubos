"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { notifyStaff } from "@/lib/staff-notify";

export async function submitQuest(
  memberId: string,
  questId: string,
  clubSlug: string,
  proofUrl?: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  // Check quest exists and is active
  const { data: quest } = await supabase
    .from("quests")
    .select("id, multi_use, title, club_id")
    .eq("id", questId)
    .eq("active", true)
    .single();

  if (!quest) return { error: "Quest not found" };

  // For single-use quests, check if already submitted or completed
  if (!quest.multi_use) {
    const { data: existing } = await supabase
      .from("member_quests")
      .select("id")
      .eq("quest_id", questId)
      .eq("member_id", memberId)
      .limit(1);

    if (existing && existing.length > 0) {
      return { error: "Quest already submitted" };
    }
  }

  // Insert as pending (no verified_by, no spins awarded yet)
  const insertData: Record<string, unknown> = {
    quest_id: questId,
    member_id: memberId,
    status: "pending",
  };
  if (proofUrl?.trim()) {
    insertData.proof_url = proofUrl.trim();
  }
  const { error } = await supabase.from("member_quests").insert(insertData);

  if (error) return { error: "Failed to submit quest" };

  // Notify staff via Telegram
  const { data: member } = await supabase
    .from("members")
    .select("member_code")
    .eq("id", memberId)
    .single();

  await notifyStaff(
    quest.club_id,
    `🎯 Quest validation needed\n<b>${quest.title}</b>\nMember: ${member?.member_code ?? "Unknown"}`,
  );

  return { ok: true };
}

export async function submitEmailQuest(
  memberId: string,
  questId: string,
  clubSlug: string,
  email: string,
): Promise<{ error: string } | { ok: true }> {
  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Invalid email address" };
  }

  const supabase = createAdminClient();

  // Check quest exists, is active, and is email_collect type
  const { data: quest } = await supabase
    .from("quests")
    .select("id, multi_use, title, club_id, quest_type")
    .eq("id", questId)
    .eq("active", true)
    .single();

  if (!quest) return { error: "Quest not found" };
  if (quest.quest_type !== "email_collect") return { error: "Invalid quest type" };

  // For single-use quests, check if already submitted
  if (!quest.multi_use) {
    const { data: existing } = await supabase
      .from("member_quests")
      .select("id")
      .eq("quest_id", questId)
      .eq("member_id", memberId)
      .limit(1);

    if (existing && existing.length > 0) {
      return { error: "Quest already submitted" };
    }
  }

  // Save email to the member record
  const { error: updateError } = await supabase
    .from("members")
    .update({ email })
    .eq("id", memberId);

  if (updateError) return { error: "Failed to save email" };

  // Insert member_quests record as pending
  const { error } = await supabase.from("member_quests").insert({
    quest_id: questId,
    member_id: memberId,
    status: "pending",
  });

  if (error) return { error: "Failed to submit quest" };

  // Notify staff via Telegram
  const { data: member } = await supabase
    .from("members")
    .select("member_code")
    .eq("id", memberId)
    .single();

  await notifyStaff(
    quest.club_id,
    `📧 Email collected via quest\n<b>${quest.title}</b>\nMember: ${member?.member_code ?? "Unknown"}\nEmail: ${email}`,
  );

  return { ok: true };
}
