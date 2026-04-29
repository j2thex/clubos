"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMemberFromCookie } from "@/lib/auth";
import { replyInWebhook } from "@/lib/telegram/webhook";

type Result = { ok: true } | { ok: false; error: string };

export async function disconnectTelegramSubscription(input: {
  clubSlug: string;
}): Promise<Result> {
  const session = await getMemberFromCookie();
  if (!session) return { ok: false, error: "unauthenticated" };

  const supabase = createAdminClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, telegram_bot_token")
    .eq("slug", input.clubSlug)
    .eq("active", true)
    .single();
  if (!club) return { ok: false, error: "Club not found" };

  // Confirm the member belongs to this club before mutating their row.
  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("id", session.member_id)
    .eq("club_id", club.id)
    .maybeSingle();
  if (!member) return { ok: false, error: "Not a member of this club" };

  const { data: sub } = await supabase
    .from("telegram_subscriptions")
    .select("id, telegram_chat_id")
    .eq("member_id", session.member_id)
    .maybeSingle();

  if (!sub) {
    revalidatePath(`/${input.clubSlug}/profile`);
    return { ok: true };
  }

  const { error: delErr } = await supabase
    .from("telegram_subscriptions")
    .delete()
    .eq("id", sub.id);
  if (delErr) return { ok: false, error: delErr.message };

  // Best-effort goodbye message; never block the disconnect on it.
  if (club.telegram_bot_token) {
    await replyInWebhook(
      club.telegram_bot_token,
      sub.telegram_chat_id,
      `You've been unsubscribed from <b>${escapeHtml(club.name)}</b>. Re-subscribe any time from your member profile.`,
    );
  }

  revalidatePath(`/${input.clubSlug}/profile`);
  return { ok: true };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
