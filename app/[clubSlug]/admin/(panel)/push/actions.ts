"use server";

import { getOwnerFromCookie } from "@/lib/auth";
import { sendPushToClub, type SendResult } from "@/lib/push/send";

export type SendTestPushResult =
  | ({ ok: true } & SendResult)
  | { ok: false; error: string };

const MAX_TITLE = 80;
const MAX_BODY = 300;
const MAX_URL = 500;

export async function sendTestPush(input: {
  title: string;
  body: string;
  url: string;
}): Promise<SendTestPushResult> {
  const session = await getOwnerFromCookie();
  if (!session) return { ok: false, error: "unauthenticated" };

  const title = input.title?.trim() ?? "";
  const body = input.body?.trim() ?? "";
  const url = input.url?.trim() ?? "";

  if (!title) return { ok: false, error: "Title is required" };
  if (!body) return { ok: false, error: "Body is required" };
  if (title.length > MAX_TITLE)
    return { ok: false, error: `Title must be ${MAX_TITLE} characters or fewer` };
  if (body.length > MAX_BODY)
    return { ok: false, error: `Body must be ${MAX_BODY} characters or fewer` };
  if (url.length > MAX_URL)
    return { ok: false, error: `Link must be ${MAX_URL} characters or fewer` };

  try {
    const result = await sendPushToClub(session.club_id as string, {
      title,
      body,
      url: url || undefined,
    });
    return { ok: true, ...result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Send failed";
    return { ok: false, error: message };
  }
}
