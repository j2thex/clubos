"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getMemberFromCookie } from "@/lib/auth";

type SaveResult = { ok: true } | { ok: false; error: string };

export async function savePushSubscription(sub: {
  clubSlug: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}): Promise<SaveResult> {
  const session = await getMemberFromCookie();
  if (!session) return { ok: false, error: "unauthenticated" };

  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return { ok: false, error: "invalid subscription" };
  }

  const clubSlug = sub.clubSlug?.trim() ?? "";
  if (!clubSlug) return { ok: false, error: "Missing club" };

  // Resolve club_id from the URL slug, NOT from the member cookie.
  // Middleware doesn't enforce that cookie.club_id matches the URL, so a stale
  // cross-tenant cookie would otherwise write the subscription against the wrong club.
  const supabase = createAdminClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) return { ok: false, error: "Club not found" };

  // Verify the session member actually belongs to this club.
  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("id", session.member_id)
    .eq("club_id", club.id)
    .maybeSingle();

  if (!member) return { ok: false, error: "Not a member of this club" };

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      member_id: session.member_id,
      club_id: club.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      user_agent: sub.userAgent ?? null,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
