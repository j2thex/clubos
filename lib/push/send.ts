import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  tag?: string;
};

export type SendResult = { sent: number; removed: number };

type Subscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

let initialised = false;
function initWebPush() {
  if (initialised) return;
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) {
    throw new Error("VAPID env vars not configured");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  initialised = true;
}

async function sendToSubscriptions(
  subs: Subscription[],
  payload: PushPayload,
): Promise<SendResult> {
  if (subs.length === 0) return { sent: 0, removed: 0 };
  initWebPush();
  const supabase = createAdminClient();
  const body = JSON.stringify(payload);
  const staleIds: string[] = [];
  let sent = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          staleIds.push(s.id);
        }
      }
    }),
  );

  if (staleIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", staleIds);
  }

  return { sent, removed: staleIds.length };
}

export async function sendPushToClub(
  clubId: string,
  payload: PushPayload,
): Promise<SendResult> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("club_id", clubId);
  return sendToSubscriptions(data ?? [], payload);
}

export async function sendPushToMember(
  memberId: string,
  payload: PushPayload,
): Promise<SendResult> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("member_id", memberId);
  return sendToSubscriptions(data ?? [], payload);
}
