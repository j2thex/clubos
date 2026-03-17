import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "@/lib/telegram";

export async function notifyStaff(clubId: string, message: string) {
  try {
    const supabase = createAdminClient();
    const { data: club } = await supabase
      .from("clubs")
      .select("telegram_bot_token, telegram_chat_id")
      .eq("id", clubId)
      .single();

    if (!club?.telegram_bot_token || !club?.telegram_chat_id) return;

    await sendTelegramMessage(club.telegram_bot_token, club.telegram_chat_id, message);
  } catch {
    // Fire-and-forget — never block the member action
  }
}

export async function notifyPlatform(message: string) {
  try {
    const token = process.env.PLATFORM_TELEGRAM_BOT_TOKEN;
    const chatId = process.env.PLATFORM_TELEGRAM_CHAT_ID;
    if (!token || !chatId) return;

    await sendTelegramMessage(token, chatId, message);
  } catch {
    // Fire-and-forget
  }
}
