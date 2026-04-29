"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOwnerForClub } from "@/lib/auth";
import {
  deleteWebhook,
  generateWebhookSecret,
  getMe,
  setWebhook,
} from "@/lib/telegram/webhook";
import { sendTelegramToClub } from "@/lib/telegram/send";

type Result<T = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://osocios.club"
  );
}

async function loadClubBySlug(clubSlug: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("clubs")
    .select(
      "id, slug, telegram_bot_token, telegram_bot_username, telegram_webhook_secret, telegram_member_subs_enabled",
    )
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();
  return data;
}

export async function saveTelegramBotToken(input: {
  clubSlug: string;
  token: string;
}): Promise<Result> {
  const club = await loadClubBySlug(input.clubSlug);
  if (!club) return { ok: false, error: "Club not found" };

  try {
    await requireOwnerForClub(club.id);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unauthorized",
    };
  }

  const token = input.token.trim();
  if (!token) return { ok: false, error: "Token is required" };
  if (!/^[0-9]+:[A-Za-z0-9_-]+$/.test(token)) {
    return { ok: false, error: "That doesn't look like a Telegram bot token" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("clubs")
    .update({ telegram_bot_token: token })
    .eq("id", club.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${input.clubSlug}/admin/settings`);
  return { ok: true };
}

export async function verifyAndRegisterBot(input: {
  clubSlug: string;
}): Promise<Result<{ username: string; webhookUrl: string }>> {
  const club = await loadClubBySlug(input.clubSlug);
  if (!club) return { ok: false, error: "Club not found" };

  try {
    await requireOwnerForClub(club.id);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unauthorized",
    };
  }

  if (!club.telegram_bot_token) {
    return { ok: false, error: "Save a bot token first" };
  }

  const me = await getMe(club.telegram_bot_token);
  if (!me.ok) return { ok: false, error: me.error };

  const secret = club.telegram_webhook_secret ?? generateWebhookSecret();
  const webhookUrl = `${siteUrl()}/api/telegram/webhook/${club.slug}`;

  const wh = await setWebhook(club.telegram_bot_token, webhookUrl, secret);
  if (!wh.ok) return { ok: false, error: wh.error };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("clubs")
    .update({
      telegram_bot_username: me.username,
      telegram_webhook_secret: secret,
      telegram_member_subs_enabled: true,
    })
    .eq("id", club.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/${input.clubSlug}/admin/settings`);
  return { ok: true, username: me.username, webhookUrl };
}

export async function disableMemberSubscriptions(input: {
  clubSlug: string;
}): Promise<Result> {
  const club = await loadClubBySlug(input.clubSlug);
  if (!club) return { ok: false, error: "Club not found" };

  try {
    await requireOwnerForClub(club.id);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unauthorized",
    };
  }

  // Best-effort: remove the webhook so Telegram stops POSTing. We keep the
  // token + subscriptions so re-enabling later restores everything.
  if (club.telegram_bot_token) {
    await deleteWebhook(club.telegram_bot_token);
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("clubs")
    .update({ telegram_member_subs_enabled: false })
    .eq("id", club.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/${input.clubSlug}/admin/settings`);
  return { ok: true };
}

export async function sendTelegramTestBroadcast(input: {
  clubSlug: string;
  body: string;
}): Promise<Result<{ sent: number; removed: number; failed: number }>> {
  const club = await loadClubBySlug(input.clubSlug);
  if (!club) return { ok: false, error: "Club not found" };

  try {
    await requireOwnerForClub(club.id);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unauthorized",
    };
  }

  const body = input.body.trim();
  if (!body) return { ok: false, error: "Message is required" };
  if (body.length > 1000) return { ok: false, error: "Keep it under 1000 chars" };

  const result = await sendTelegramToClub(club.id, { body });
  return { ok: true, ...result };
}
