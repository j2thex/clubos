// Per-club Telegram webhook handler. Each Club owner registers
// `/api/telegram/webhook/<clubSlug>` against their bot via setWebhook
// (with a secret_token); this route validates that header and routes
// /start, /stop, /help to the right side-effects.
//
// Always returns 200 to Telegram (even on internal errors). If we returned
// non-200, Telegram would retry with backoff and eventually disable the bot.

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { replyInWebhook } from "@/lib/telegram/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      username?: string;
      language_code?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
  };
};

const SECRET_HEADER = "x-telegram-bot-api-secret-token";

const HELP_TEXT_EN =
  "👋 This bot lets you subscribe to club updates.\n\n" +
  "<b>Commands</b>\n" +
  "/start &lt;member_code&gt; — subscribe with your member code\n" +
  "/stop — unsubscribe\n" +
  "/help — show this message";

const HELP_TEXT_ES =
  "👋 Este bot te permite recibir avisos del club.\n\n" +
  "<b>Comandos</b>\n" +
  "/start &lt;codigo_socio&gt; — suscribirte con tu código de socio\n" +
  "/stop — darte de baja\n" +
  "/help — mostrar este mensaje";

function pickLocale(code: string | undefined): "en" | "es" {
  if (!code) return "en";
  return code.toLowerCase().startsWith("es") ? "es" : "en";
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ clubSlug: string }> },
) {
  const { clubSlug } = await ctx.params;

  const supabase = createAdminClient();
  const { data: club } = await supabase
    .from("clubs")
    .select(
      "id, name, telegram_bot_token, telegram_webhook_secret, telegram_member_subs_enabled",
    )
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  // Don't reveal whether the club exists. Always 200 to Telegram with no body.
  if (
    !club ||
    !club.telegram_bot_token ||
    !club.telegram_webhook_secret ||
    !club.telegram_member_subs_enabled
  ) {
    return new NextResponse(null, { status: 200 });
  }

  const provided = req.headers.get(SECRET_HEADER);
  if (provided !== club.telegram_webhook_secret) {
    return new NextResponse(null, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return new NextResponse(null, { status: 200 });
  }

  const message = update.message;
  if (!message?.text || message.chat.type !== "private") {
    return new NextResponse(null, { status: 200 });
  }

  const text = message.text.trim();
  const chatId = message.chat.id;
  const username = message.from?.username ?? null;
  const locale = pickLocale(message.from?.language_code);
  const token = club.telegram_bot_token as string;

  try {
    if (text === "/help") {
      await replyInWebhook(token, chatId, locale === "es" ? HELP_TEXT_ES : HELP_TEXT_EN);
      return new NextResponse(null, { status: 200 });
    }

    if (text === "/stop") {
      const { error: delErr } = await supabase
        .from("telegram_subscriptions")
        .delete()
        .eq("club_id", club.id)
        .eq("telegram_chat_id", chatId);
      const reply = delErr
        ? locale === "es"
          ? "No pudimos dar de baja la suscripción. Inténtalo de nuevo."
          : "Could not unsubscribe — please try again."
        : locale === "es"
          ? "✅ Te has dado de baja. Vuelve cuando quieras con /start &lt;codigo&gt;."
          : "✅ You're unsubscribed. Re-enrol any time with /start &lt;member_code&gt;.";
      await replyInWebhook(token, chatId, reply);
      return new NextResponse(null, { status: 200 });
    }

    if (text === "/start" || text.startsWith("/start ")) {
      const param = text === "/start" ? "" : text.slice("/start ".length).trim();
      if (!param) {
        const reply =
          locale === "es"
            ? "Para suscribirte, abre el portal del club, copia tu código de socio y envía aquí <code>/start TUCODIGO</code>."
            : "To subscribe, open the club portal, copy your member code, and send <code>/start YOURCODE</code> here.";
        await replyInWebhook(token, chatId, reply);
        return new NextResponse(null, { status: 200 });
      }

      const memberCode = param.split(/\s+/)[0].toUpperCase();
      const { data: member } = await supabase
        .from("members")
        .select("id, full_name, status")
        .eq("club_id", club.id)
        .eq("member_code", memberCode)
        .maybeSingle();

      if (!member || member.status === "expired" || member.status === "inactive") {
        const reply =
          locale === "es"
            ? `❌ No encontramos un socio activo con código <b>${memberCode}</b> en ${escapeHtml(club.name)}. Comprueba tu código en la app.`
            : `❌ We couldn't find an active member with code <b>${memberCode}</b> at ${escapeHtml(club.name)}. Double-check your code in the app.`;
        await replyInWebhook(token, chatId, reply);
        return new NextResponse(null, { status: 200 });
      }

      // Upsert on member_id so re-running /start from a new chat moves the
      // subscription to the new chat (the unique(member_id) constraint).
      const { error: upsertErr } = await supabase
        .from("telegram_subscriptions")
        .upsert(
          {
            member_id: member.id,
            club_id: club.id,
            telegram_chat_id: chatId,
            telegram_username: username,
            locale,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: "member_id" },
        );

      if (upsertErr) {
        console.error("[telegram-webhook] upsert failed", upsertErr);
        const reply =
          locale === "es"
            ? "No pudimos completar la suscripción. Inténtalo de nuevo en un momento."
            : "Couldn't complete the subscription — please try again in a moment.";
        await replyInWebhook(token, chatId, reply);
        return new NextResponse(null, { status: 200 });
      }

      const greeting = member.full_name ? `, <b>${escapeHtml(member.full_name)}</b>` : "";
      const reply =
        locale === "es"
          ? `🎉 ¡Listo${greeting}! Recibirás avisos de <b>${escapeHtml(club.name)}</b> aquí. Envía /stop para darte de baja.`
          : `🎉 You're in${greeting}! You'll receive updates from <b>${escapeHtml(club.name)}</b> here. Send /stop to unsubscribe.`;
      await replyInWebhook(token, chatId, reply);
      return new NextResponse(null, { status: 200 });
    }

    // Anything else: nudge to /help, but only if this looks like a command,
    // to avoid spamming users who reply to broadcasts.
    if (text.startsWith("/")) {
      await replyInWebhook(token, chatId, locale === "es" ? HELP_TEXT_ES : HELP_TEXT_EN);
    }
    return new NextResponse(null, { status: 200 });
  } catch (err) {
    console.error("[telegram-webhook] handler threw", err);
    return new NextResponse(null, { status: 200 });
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
