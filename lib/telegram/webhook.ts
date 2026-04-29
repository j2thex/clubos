// Thin helpers around the Telegram Bot API endpoints we need to set up
// per-club Member Subscription bots: identity check, webhook registration,
// and explicit replies inside the webhook handler.

const API = "https://api.telegram.org";

export type GetMeResult = {
  ok: true;
  username: string;
  id: number;
  firstName: string;
} | { ok: false; error: string };

export async function getMe(token: string): Promise<GetMeResult> {
  try {
    const res = await fetch(`${API}/bot${token}/getMe`);
    const json = (await res.json()) as {
      ok: boolean;
      description?: string;
      result?: { id: number; username?: string; first_name: string };
    };
    if (!json.ok || !json.result?.username) {
      return { ok: false, error: json.description ?? "Telegram getMe failed" };
    }
    return {
      ok: true,
      username: json.result.username,
      id: json.result.id,
      firstName: json.result.first_name,
    };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

export type SetWebhookResult = { ok: true } | { ok: false; error: string };

export async function setWebhook(
  token: string,
  url: string,
  secretToken: string,
): Promise<SetWebhookResult> {
  try {
    const res = await fetch(`${API}/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        secret_token: secretToken,
        allowed_updates: ["message"],
        drop_pending_updates: true,
      }),
    });
    const json = (await res.json()) as { ok: boolean; description?: string };
    if (!json.ok) {
      return { ok: false, error: json.description ?? "setWebhook failed" };
    }
    return { ok: true };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

export async function deleteWebhook(token: string): Promise<SetWebhookResult> {
  try {
    const res = await fetch(`${API}/bot${token}/deleteWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drop_pending_updates: false }),
    });
    const json = (await res.json()) as { ok: boolean; description?: string };
    if (!json.ok) {
      return { ok: false, error: json.description ?? "deleteWebhook failed" };
    }
    return { ok: true };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

// Reply inside a webhook handler. Returns void; failures are logged but never
// thrown — the webhook should always 200 to Telegram even if the reply fails.
export async function replyInWebhook(
  token: string,
  chatId: number,
  text: string,
): Promise<void> {
  try {
    const res = await fetch(`${API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[telegram] webhook reply failed", { status: res.status, body });
    }
  } catch (err: unknown) {
    console.error("[telegram] webhook reply threw", {
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

// 256-char-max secret used in the X-Telegram-Bot-Api-Secret-Token header. We
// generate one per Club at webhook registration time so we can validate
// incoming requests came from Telegram (not a forged caller).
export function generateWebhookSecret(): string {
  // 32 random bytes hex-encoded → 64 chars, well within the 256 limit.
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
