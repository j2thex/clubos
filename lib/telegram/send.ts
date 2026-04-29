import { createAdminClient } from "@/lib/supabase/admin";

export type TelegramPayload = {
  title?: string;
  body: string;
  url?: string;
};

export type TelegramSendResult = { sent: number; removed: number; failed: number };

type Subscription = {
  id: string;
  telegram_chat_id: number;
};

function formatMessage(payload: TelegramPayload): string {
  const escaped = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const parts: string[] = [];
  if (payload.title) parts.push(`<b>${escaped(payload.title)}</b>`);
  parts.push(escaped(payload.body));
  if (payload.url) parts.push(`\n${payload.url}`);
  return parts.join("\n");
}

async function sendToSubscriptions(
  botToken: string,
  subs: Subscription[],
  payload: TelegramPayload,
): Promise<TelegramSendResult> {
  if (subs.length === 0) return { sent: 0, removed: 0, failed: 0 };
  const supabase = createAdminClient();
  const text = formatMessage(payload);
  const staleIds: string[] = [];
  let sent = 0;
  let failed = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        const res = await fetch(
          `https://api.telegram.org/bot${botToken}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: s.telegram_chat_id,
              text,
              parse_mode: "HTML",
              disable_web_page_preview: false,
            }),
          },
        );
        if (res.ok) {
          sent++;
          return;
        }
        // 403 = user blocked bot; 404 = chat not found. Both = stale, drop the row.
        if (res.status === 403 || res.status === 404) {
          staleIds.push(s.id);
        } else {
          failed++;
          const body = await res.text().catch(() => "");
          console.error("[telegram] sendMessage failed", {
            chatId: s.telegram_chat_id,
            status: res.status,
            body,
          });
        }
      } catch (err: unknown) {
        failed++;
        console.error("[telegram] sendMessage threw", {
          chatId: s.telegram_chat_id,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }),
  );

  if (staleIds.length > 0) {
    await supabase.from("telegram_subscriptions").delete().in("id", staleIds);
  }

  return { sent, removed: staleIds.length, failed };
}

async function loadClubBot(
  clubId: string,
): Promise<{ token: string; enabled: boolean } | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("clubs")
    .select("telegram_bot_token, telegram_member_subs_enabled")
    .eq("id", clubId)
    .single();
  if (!data?.telegram_bot_token) return null;
  return {
    token: data.telegram_bot_token as string,
    enabled: Boolean(data.telegram_member_subs_enabled),
  };
}

export async function sendTelegramToClub(
  clubId: string,
  payload: TelegramPayload,
): Promise<TelegramSendResult> {
  const bot = await loadClubBot(clubId);
  if (!bot || !bot.enabled) return { sent: 0, removed: 0, failed: 0 };

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("telegram_subscriptions")
    .select("id, telegram_chat_id")
    .eq("club_id", clubId);

  return sendToSubscriptions(bot.token, data ?? [], payload);
}

export async function sendTelegramToMember(
  memberId: string,
  payload: TelegramPayload,
): Promise<TelegramSendResult> {
  const supabase = createAdminClient();
  const { data: sub } = await supabase
    .from("telegram_subscriptions")
    .select("id, telegram_chat_id, club_id")
    .eq("member_id", memberId)
    .maybeSingle();

  if (!sub) return { sent: 0, removed: 0, failed: 0 };

  const bot = await loadClubBot(sub.club_id);
  if (!bot || !bot.enabled) return { sent: 0, removed: 0, failed: 0 };

  return sendToSubscriptions(
    bot.token,
    [{ id: sub.id, telegram_chat_id: sub.telegram_chat_id }],
    payload,
  );
}

export async function sendTelegramToSubscriptions(
  clubId: string,
  memberIds: string[],
  payload: TelegramPayload,
): Promise<TelegramSendResult> {
  if (memberIds.length === 0) return { sent: 0, removed: 0, failed: 0 };
  const bot = await loadClubBot(clubId);
  if (!bot || !bot.enabled) return { sent: 0, removed: 0, failed: 0 };

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("telegram_subscriptions")
    .select("id, telegram_chat_id")
    .eq("club_id", clubId)
    .in("member_id", memberIds);

  return sendToSubscriptions(bot.token, data ?? [], payload);
}
