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

  // Normalize to a club-scoped same-origin path. iOS standalone PWAs block
  // cross-origin navigation from push taps, so external URLs silently fail.
  // We also need every path to start with /{clubSlug} — otherwise /offers lands
  // on the platform root, not the club's offers page.
  let normalizedUrl = "";
  if (url) {
    let path = url;
    if (/^https?:\/\//i.test(path)) {
      try {
        const parsed = new URL(path);
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://osocios.club";
        const expectedHost = new URL(siteUrl).host;
        if (parsed.host !== expectedHost) {
          return {
            ok: false,
            error: "Link must be a path on this site (e.g. /events/123)",
          };
        }
        path = parsed.pathname + parsed.search + parsed.hash;
      } catch {
        return { ok: false, error: "Invalid link" };
      }
    } else if (!path.startsWith("/")) {
      return {
        ok: false,
        error: "Link must start with / (e.g. /events/123)",
      };
    }
    const prefix = `/${clubSlug}`;
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      normalizedUrl = path;
    } else if (path === "/") {
      normalizedUrl = prefix;
    } else {
      normalizedUrl = `${prefix}${path}`;
    }
  }

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
      url: normalizedUrl || undefined,
    });
    return { ok: true, ...result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Send failed";
    return { ok: false, error: message };
  }
}
