"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getMemberFromCookie } from "@/lib/auth";

type SaveResult = { ok: true } | { ok: false; error: string };

export async function savePushSubscription(sub: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}): Promise<SaveResult> {
  const session = await getMemberFromCookie();
  if (!session) return { ok: false, error: "unauthenticated" };

  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return { ok: false, error: "invalid subscription" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      member_id: session.member_id,
      club_id: session.club_id,
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
