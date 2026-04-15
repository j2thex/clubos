# Web Push (Members v1) — Design

**Status:** Design approved, pending implementation plan
**Date:** 2026-04-15
**Trello:** https://trello.com/c/yiDUoNJa
**Depends on:** `2026-04-15-ios-add-to-homescreen-design.md` (per-club PWA install) and `2026-04-15-a2hs-walkthrough-modal-design.md` (install walkthrough) — both shipped.

## Problem

Members cannot be notified of events, offers, or announcements once they close their browser tab. Today the only notification path is the staff-side Telegram bot that polls `/api/notify/[clubId]` for pending approvals — there is nothing for members. Members are asking "did the event change time?", "is my RSVP confirmed?", and clubs have no way to push time-sensitive information to them.

Now that per-club PWA install works and the walkthrough modal teaches iOS users how to add the club to their home screen, the prerequisite for iOS web push is in place (iOS 16.4+ requires PWA install before push will work).

## Goals

- A member can install the club's PWA, tap a "Enable notifications" button inside the app, grant permission, and start receiving web push notifications on iOS, Android, and desktop.
- An admin can compose a title + body + optional link in an admin page and send a test push to every subscribed member of that club.
- Data and infrastructure are fully self-hosted: VAPID keys, subscriptions stored in our own Supabase, payloads sent via the `web-push` npm package. No third-party SDK.
- Stale subscriptions (410/404 from push service) are cleaned up automatically whenever a send hits them.

## Non-Goals (Phase 1)

- **Staff notifications** — Telegram bot stays. No staff subscribe flow, no member→staff transactional pushes.
- **Staff→member transactional pushes** — no automatic "your order was approved" confirmation.
- **Segmentation or audience filters** — admin always sends to all subscribed members of the current club.
- **Scheduled sends / send-at-time**
- **Analytics / delivery receipts / read tracking**
- **Admin unsubscribe UI** — members manage notification permission via browser settings (Safari or Chrome).
- **Badge counts, action buttons, images in notifications** — title + body + click-through URL only.
- **Reporting on which member has or hasn't subscribed**

Each of these is a natural Phase 2 candidate built on the infrastructure this spec delivers.

## Architecture

Five moving parts, each with clear boundaries.

### 1. Infrastructure

- **VAPID keys** — generated once via `npx web-push generate-vapid-keys`. Stored as env vars:
  - `VAPID_PUBLIC_KEY` (server)
  - `VAPID_PRIVATE_KEY` (server, never client)
  - `VAPID_SUBJECT` (mailto: URL, `mailto:jnamed@gmail.com`)
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (same value as `VAPID_PUBLIC_KEY`, exposed to client)
- **`web-push` npm package** — added to dependencies. Mature, stable, Node-native signing and sending.
- **Service worker** — `public/sw.js`, hand-written vanilla JavaScript, no Workbox, no build step. Single global worker served from origin root, scope `/`. Handles all clubs.

### 2. Data model

New table `push_subscriptions`:

```sql
CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  UNIQUE (endpoint)
);

CREATE INDEX idx_push_subscriptions_member_id ON push_subscriptions(member_id);
CREATE INDEX idx_push_subscriptions_club_id ON push_subscriptions(club_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages all"
  ON push_subscriptions FOR ALL
  USING (auth.role() = 'service_role');
```

**Design notes:**

- `club_id` denormalised next to `member_id` so `sendPushToClub` can query by club without a join.
- `UNIQUE (endpoint)` enables idempotent upsert on re-subscribe from the same device.
- `ON DELETE CASCADE` — deleting a member or club removes their subscriptions.
- RLS matches the existing ClubOS pattern: only the service-role client touches the table. Member-scoped access is enforced by server actions that read `getMemberFromCookie()` before acting.

### 3. Member subscribe flow

The existing `AddToHomescreen` card on the member home evolves into a **progressive install card** with three states:

| State | `isStandalone` | `isSubscribed` | UI |
|---|---|---|---|
| Install | `false` | — | Existing compact install banner + "Show me how" modal (current behavior) |
| Subscribe | `true` | `false` | Same card shell, new copy: "Enable notifications" + "Never miss events and offers" + Subscribe button |
| Done | `true` | `true` | Card hidden |

**Subscribe button behavior:**

1. Call `registerServiceWorker()` (idempotent — returns existing registration if already registered).
2. Call `subscribeToPush(NEXT_PUBLIC_VAPID_PUBLIC_KEY)`:
   - If there's an existing push subscription for this worker, return it.
   - Otherwise, call `Notification.requestPermission()`. Must be triggered by a user tap (iOS requirement).
   - On `granted`, call `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`.
3. POST the subscription to the `savePushSubscription` server action, which upserts into `push_subscriptions` keyed by `endpoint`.
4. On success: hide the card, show toast "Notifications enabled".
5. On permission `denied` or `default` (user dismissed): show inline message "Notifications blocked — you can enable them in your browser settings."

**State detection on mount** (client-side only):

- `isStandalone`: `window.matchMedia("(display-mode: standalone)").matches` OR `navigator.standalone` (iOS)
- `isSubscribed`: `await navigator.serviceWorker.ready; await reg.pushManager.getSubscription() !== null`

**Test-mode flag:** The existing `A2HS_TEST_MODE` constant still gates the Install state (shows every load in test mode, once-per-club in production). It does NOT gate the Subscribe state — once subscribed, the card is always hidden. Otherwise users would see the subscribe button on every load in production.

### 4. Server-side sender

New file `lib/push/send.ts` exposes:

```ts
type Payload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  tag?: string;
};

export async function sendPushToMember(
  memberId: string,
  payload: Payload,
): Promise<{ sent: number; removed: number }>;

export async function sendPushToClub(
  clubId: string,
  payload: Payload,
): Promise<{ sent: number; removed: number }>;
```

**Behavior:**

- Lazy-initialises `web-push` with VAPID details from env on first call.
- Queries `push_subscriptions` by `member_id` or `club_id`.
- For each subscription, calls `webpush.sendNotification(subscription, JSON.stringify(payload))`.
- On error with statusCode `404` or `410`, marks the subscription for deletion (subscription is dead, push service is telling us to clean it up).
- After all sends complete, deletes dead subscriptions in a single query.
- Returns `{ sent, removed }` so callers can report the outcome.

**Not exposed in Phase 1:** segmentation, per-member filtering, batching, rate limiting. All future work.

### 5. Admin test UI

New admin page at `/[clubSlug]/admin/push`. Requires owner cookie, same guard as other admin pages.

**Layout:**

- Page heading: "Push notifications"
- Small paragraph: "Send a test notification to all members who have subscribed on this club."
- Compose form:
  - **Title** — required, text, max 80 chars
  - **Body** — required, textarea, max 300 chars
  - **Link** — optional, text, URL or path (e.g. `/events/123`)
- Submit button: "Send test notification"
- After submit: toast with outcome, e.g. "Sent to 12 devices, cleaned up 1 stale subscription" or "No members subscribed yet."

**Server action** `app/[clubSlug]/admin/(panel)/push/actions.ts`:

1. Validates owner cookie → extracts `club_id`.
2. Validates input lengths (reject oversized).
3. Calls `sendPushToClub(clubId, { title, body, url })`.
4. Returns the result object for the client to toast.

**Navigation:** add a "Push" link to the admin panel navigation (exact component to be confirmed during plan — ClubOS admin has an existing tab/nav structure used by members, events, offers, etc.).

## Service worker contract

Hand-written `public/sw.js`:

**`push` event:**

```js
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const payload = event.data.json();
  const { title, body, url, icon, badge, tag } = payload;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon || "/logo-192.png",
      badge: badge || "/logo-192.png",
      data: { url: url || "/" },
      tag: tag || "clubos-notification",
    }),
  );
});
```

**`notificationclick` event:**

```js
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })(),
  );
});
```

Registered from the member portal on mount with `navigator.serviceWorker.register("/sw.js", { scope: "/" })`.

## Data flow

```
Member on club home (PWA standalone)
  └─> AddToHomescreen card detects standalone + !subscribed
        └─> renders "Enable notifications" state
              └─> user taps Subscribe
                    └─> registerServiceWorker()
                    └─> Notification.requestPermission() → granted
                    └─> pushManager.subscribe({ applicationServerKey })
                    └─> savePushSubscription server action
                          └─> INSERT/UPSERT into push_subscriptions
                    └─> card hides, toast "Notifications enabled"

Admin on /admin/push
  └─> composes title + body + optional url
        └─> submit → sendTestPush server action
              └─> sendPushToClub(clubId, payload)
                    └─> SELECT push_subscriptions WHERE club_id = ?
                    └─> for each: webpush.sendNotification(sub, body)
                          └─> 201 → sent++
                          └─> 404/410 → queue for deletion
                    └─> DELETE stale in one query
              └─> returns { sent, removed }
        └─> toast: "Sent to N devices"

Push service (FCM / Mozilla / Apple)
  └─> pushes encrypted payload to device
        └─> browser wakes sw.js push handler
              └─> showNotification(title, { body, data.url })
              └─> OS displays notification
                    └─> user taps → notificationclick handler
                          └─> focus existing tab or open new one at data.url
```

## Environment & setup

**New env vars** (all four must be present in local `.env.local`, Vercel staging, Vercel production):

```
VAPID_PUBLIC_KEY=<base64url>
VAPID_PRIVATE_KEY=<base64url>
VAPID_SUBJECT=mailto:jnamed@gmail.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<same as VAPID_PUBLIC_KEY>
```

**One-time setup** (first task in implementation plan):

1. `npx web-push generate-vapid-keys` — produces the keypair.
2. Add all four vars to `.env.local`.
3. Add all four vars to Vercel via `vercel env add` or the dashboard (preview + production).
4. Install the `web-push` npm package.

**No code that uses VAPID keys ships until this is done.**

## Testing plan

Manual only (no automated test framework).

**Local smoke:**

1. `pnpm dev`, open `http://localhost:3000/red-sessions` in Chrome (desktop). Log in as a member.
2. Desktop Chrome treats the app as installable without requiring A2HS. Open DevTools → Application → Service Workers, confirm `sw.js` registered with scope `/`.
3. The card detects desktop Chrome as "not standalone" (no install), so Install state shows. To simulate standalone, use Chrome's "Install app" via ⋮ menu. Relaunch as a PWA.
4. Verify Subscribe state now shows. Click "Enable notifications".
5. Browser permission prompt appears. Grant.
6. Verify `push_subscriptions` row exists in Supabase (check via Studio).
7. Open `/red-sessions/admin/push` (log in as club owner).
8. Compose "Hello world" / "This is a test" / leave URL blank. Submit.
9. OS notification appears within a few seconds. Click it — should focus the existing tab.
10. Supabase row's `last_seen_at` unchanged in Phase 1 (not updated during send — deferred to Phase 2).

**Real iPhone on staging:**

1. Deploy to staging via develop push. Ensure Vercel staging has all four env vars.
2. Install the PWA on an iPhone via the walkthrough modal we shipped earlier.
3. Launch from the home screen icon.
4. On the member home, verify the Subscribe state shows (was Install state before install).
5. Tap Subscribe, grant permission.
6. On desktop, log in as owner on staging, go to admin Push, send a test.
7. Verify the push arrives on the iPhone home screen with the iPhone screen locked.
8. Tap the notification, verify it opens the PWA.

**Edge cases to verify:**

- Two devices same member → two rows, test push hits both.
- Re-subscribe from same device → row upserted, not duplicated.
- Revoke permission in Safari → next send should 410 and the row should be deleted.
- Club with zero subscribers → admin send returns "Sent to 0 devices", no error.
- Oversized title/body → server action rejects with validation error.

## Files Touched

**New:**

- `public/sw.js` — service worker
- `supabase/migrations/<timestamp>_push_subscriptions.sql` — table + indexes + RLS
- `lib/push/send.ts` — `sendPushToMember`, `sendPushToClub`
- `lib/push/client.ts` — `registerServiceWorker`, `subscribeToPush`, `urlBase64ToUint8Array`
- `app/[clubSlug]/(member)/push-actions.ts` — `savePushSubscription` server action
- `app/[clubSlug]/admin/(panel)/push/page.tsx` — admin page (server component)
- `app/[clubSlug]/admin/(panel)/push/push-form.tsx` — admin form (client component)
- `app/[clubSlug]/admin/(panel)/push/actions.ts` — `sendTestPush` server action

**Modified:**

- `components/club/add-to-homescreen.tsx` — add Subscribe state, wire to push client + server action
- `package.json` — add `web-push` dependency
- Admin nav component (exact file TBD during plan) — add "Push" tab link
- `.env.local` — add four new vars (not committed, but added to `.env.example` if present)

**Untouched:**

- `middleware.ts` — no new routes need allowlisting (admin routes already auth-gated, `/sw.js` is at root)
- Existing A2HS walkthrough modal — unchanged
- Existing manifest + apple-touch-icon routes — unchanged
- Staff routes — out of scope

## Open questions resolved

- **Vendor:** self-hosted `web-push`, not OneSignal/FCM/Pusher.
- **Audience:** members only; staff deferred.
- **Subscribe placement:** evolved A2HS card, single progressive install flow.
- **Admin UI:** compose form (title + body + optional link), not a canned button.
- **Segmentation:** none in v1 — always all subscribed members of current club.

## Deferred to Phase 2+

- Staff push subscription + Telegram bot replacement
- Member→staff: push to staff when member submits order / quest completion
- Staff→member: push to member when staff approves
- Admin audience selector, segmentation, scheduled sends
- Notification action buttons, images, badge counts
- Subscriber analytics / admin list of subscribed members
