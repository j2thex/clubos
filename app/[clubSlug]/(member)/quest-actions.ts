"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function submitQuest(
  memberId: string,
  questId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  // Check quest exists and is active
  const { data: quest } = await supabase
    .from("quests")
    .select("id, multi_use")
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
  const { error } = await supabase.from("member_quests").insert({
    quest_id: questId,
    member_id: memberId,
    status: "pending",
  });

  if (error) return { error: "Failed to submit quest" };

  revalidatePath(`/${clubSlug}`);
  return { ok: true };
}
