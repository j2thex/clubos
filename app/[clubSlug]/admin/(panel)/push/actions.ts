"use server";

import { getOwnerFromCookie } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToClub, type SendResult } from "@/lib/push/send";

export type SendTestPushResult =
  | ({ ok: true } & SendResult)
  | { ok: false; error: string };

const MAX_TITLE = 80;
const MAX_BODY = 300;
const MAX_URL = 500;

export async function sendTestPush(input: {
  clubSlug: string;
  title: string;
  body: string;
  url: string;
}): Promise<SendTestPushResult> {
  const session = await getOwnerFromCookie();
  if (!session) return { ok: false, error: "unauthenticated" };

  const title = input.title?.trim() ?? "";
  const body = input.body?.trim() ?? "";
  const url = input.url?.trim() ?? "";
  const clubSlug = input.clubSlug?.trim() ?? "";

  if (!clubSlug) return { ok: false, error: "Missing club" };
  if (!title) return { ok: false, error: "Title is required" };
  if (!body) return { ok: false, error: "Body is required" };
  if (title.length > MAX_TITLE)
    return { ok: false, error: `Title must be ${MAX_TITLE} characters or fewer` };
  if (body.length > MAX_BODY)
    return { ok: false, error: `Body must be ${MAX_BODY} characters or fewer` };
  if (url.length > MAX_URL)
    return { ok: false, error: `Link must be ${MAX_URL} characters or fewer` };

  // Resolve the club from the URL slug, NOT from the owner cookie's club_id.
  // The middleware doesn't enforce that the cookie's club matches the URL,
  // so cross-tenant cookies must not be trusted for tenancy decisions.
  const supabase = createAdminClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) return { ok: false, error: "Club not found" };

  // Verify the logged-in owner actually owns this specific club.
  const ownerId = session.owner_id as string;
  const { data: ownership } = await supabase
    .from("club_owner_clubs")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("club_id", club.id)
    .maybeSingle();

  if (!ownership) return { ok: false, error: "Not authorized for this club" };

  try {
    const result = await sendPushToClub(club.id, {
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
