# Web Push (Members v1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship member-facing web push notifications end-to-end: a member installs the PWA, taps a "Enable notifications" button inside the app, and an admin can send a test push from a new admin page that arrives on the member's device.

**Architecture:** Self-hosted via `web-push` npm package + VAPID keys in env. New `push_subscriptions` Supabase table keyed by `member_id` + `club_id`. Single global service worker at `public/sw.js`. The existing `AddToHomescreen` member card evolves into a three-state progressive install card (install → subscribe → hidden). New admin page `/[clubSlug]/admin/push` with a compose form that calls a `sendPushToClub` server helper.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, pnpm, Supabase, `web-push` (new), `sonner` for toasts, existing i18n provider.

**Spec:** `docs/superpowers/specs/2026-04-15-web-push-members-v1-design.md`

**Testing model:** No automated tests. Verification = `pnpm build` + manual flow on the local dev server and on staging from a real iPhone.

**Commit cadence:** One commit per task on `develop`. Push at the end.

**Prerequisite:** Tasks 1's VAPID keys must be added to Vercel staging + production environment BEFORE the final push. Otherwise staging will crash the first time the send path is exercised.

---

## File Structure

**New files:**

- `supabase/migrations/20260415150000_add_push_subscriptions.sql` — new table + indexes + RLS
- `public/sw.js` — service worker (push + notificationclick handlers)
- `lib/push/client.ts` — browser-side helpers (SW registration, subscribe, key decode)
- `lib/push/send.ts` — server-side sender (`sendPushToMember`, `sendPushToClub`)
- `app/[clubSlug]/(member)/push-actions.ts` — `savePushSubscription` server action
- `app/[clubSlug]/admin/(panel)/push/page.tsx` — admin page (server component)
- `app/[clubSlug]/admin/(panel)/push/push-form.tsx` — admin compose form (client component)
- `app/[clubSlug]/admin/(panel)/push/actions.ts` — `sendTestPush` server action

**Modified files:**

- `package.json` + `pnpm-lock.yaml` — add `web-push` + `@types/web-push`
- `.env.local` (local only, never committed) — 4 new VAPID env vars
- `components/club/add-to-homescreen.tsx` — add Subscribe state, 3-state logic
- `lib/i18n/dictionaries/en.json` — 6 new keys
- `lib/i18n/dictionaries/es.json` — 6 new keys
- `app/[clubSlug]/admin/(panel)/settings/page.tsx` — add a small card link to `/admin/push`

**Untouched:**

- `middleware.ts` — `/sw.js` lives at root (matcher already excludes it? verified in Task 3) and admin routes are already owner-gated
- Existing A2HS walkthrough modal
- Manifest + icon routes
- Staff routes

---

## Task 1: VAPID keys, env vars, and `web-push` dependency

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `.env.local` (local only — do NOT commit)

**Context:** Before any push code can run, we need VAPID keys and the `web-push` package. VAPID keys identify our server to push services (FCM, Mozilla, Apple) so they know who signed the payload. One keypair per app, reused forever.

- [ ] **Step 1: Install `web-push` and types**

Run:
```bash
pnpm add web-push
pnpm add -D @types/web-push
```

Expected: `package.json` gains `"web-push": "^3.6.x"` in `dependencies` and `"@types/web-push": "^3.6.x"` in `devDependencies`. `pnpm-lock.yaml` updates.

- [ ] **Step 2: Generate a VAPID keypair**

Run:
```bash
npx web-push generate-vapid-keys --json
```

Expected: prints `{ "publicKey": "...", "privateKey": "..." }`. Copy both strings. Do NOT commit them.

- [ ] **Step 3: Add VAPID vars to `.env.local`**

Append to `.env.local` (create if missing):
```
VAPID_PUBLIC_KEY=<paste publicKey>
VAPID_PRIVATE_KEY=<paste privateKey>
VAPID_SUBJECT=mailto:jnamed@gmail.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<same as VAPID_PUBLIC_KEY>
```

`VAPID_SUBJECT` is a `mailto:` URL identifying who owns the server — push services may reach out if there's abuse.

- [ ] **Step 4: Verify `.env.local` is gitignored**

Run:
```bash
git check-ignore -v .env.local
```

Expected: output shows the ignore rule matching `.env.local`. If nothing prints, STOP — `.env.local` would get committed. Fix `.gitignore` before proceeding.

- [ ] **Step 5: Commit package changes only**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat(push): add web-push dependency for VAPID signing"
```

Do NOT push yet.

- [ ] **Step 6: Record for Jeff — Vercel env setup**

Print a reminder message showing Jeff the four env vars (without the real values) and that he needs to add them to Vercel staging and production BEFORE the final push at Task 10. The exact values are in `.env.local` locally.

Output:
```
REMINDER: Before Task 10 push, add these 4 env vars to Vercel (staging + production):
  VAPID_PUBLIC_KEY          (copy from .env.local)
  VAPID_PRIVATE_KEY         (copy from .env.local)
  VAPID_SUBJECT             mailto:jnamed@gmail.com
  NEXT_PUBLIC_VAPID_PUBLIC_KEY  (same as VAPID_PUBLIC_KEY)

Run `vercel env add <NAME> preview` and `vercel env add <NAME> production` for each,
or add via the Vercel dashboard.
```

---

## Task 2: Database migration

**Files:**
- Create: `supabase/migrations/20260415150000_add_push_subscriptions.sql`

**Context:** ClubOS has automatic migration deploy on push: when a file under `supabase/migrations/**` lands on `develop` or `main`, GitHub Actions applies it to the respective Supabase project. The migration file must be syntactically valid SQL and idempotent within a single run.

- [ ] **Step 1: Create the migration file**

Write to `supabase/migrations/20260415150000_add_push_subscriptions.sql`:

```sql
-- Push subscriptions for Web Push API
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

CREATE POLICY "Service role manages push subscriptions"
  ON push_subscriptions FOR ALL
  USING (auth.role() = 'service_role');
```

- [ ] **Step 2: Apply the migration locally**

If you have Supabase CLI with a local db:
```bash
supabase db push
```

If you're pointing at the staging/production project (per `.env.local`), skip local apply — the migration lands when you push develop at Task 10. That is fine. Just do not run test subscribe/send until the migration has applied.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260415150000_add_push_subscriptions.sql
git commit -m "feat(push): add push_subscriptions table migration"
```

---

## Task 3: Service worker

**Files:**
- Create: `public/sw.js`

**Context:** The service worker is plain vanilla JavaScript, no TypeScript, no build step. Next.js serves `public/sw.js` unchanged. The worker handles two events: `push` (display a notification) and `notificationclick` (focus an existing tab or open a new one at the target URL).

**Middleware check:** The existing matcher in `middleware.ts` is:
```
"/((?!_next/static|_next/image|favicon.*\\.svg|favicon\\.ico|icon\\.ico|apple-icon\\.png|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|opengraph-image|logo.*\\.png|logo\\.svg).*)"
```
This does NOT exclude `sw.js`. The inner body has `if (segments.length === 0) return next` — a request to `/sw.js` has `segments = ["sw.js"]`, so it falls through the `clubSlug = "sw.js"` branch which is then treated as a club slug and redirected to `/sw.js/login`. BAD. We must skip `sw.js` explicitly.

- [ ] **Step 1: Create `public/sw.js`**

Write to `public/sw.js`:

```js
/* ClubOS service worker — web push */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Notification", body: event.data.text() };
  }
  const { title, body, url, icon, badge, tag } = payload;
  event.waitUntil(
    self.registration.showNotification(title || "Notification", {
      body: body || "",
      icon: icon || "/logo-192.png",
      badge: badge || "/logo-192.png",
      data: { url: url || "/" },
      tag: tag || "clubos-notification",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })(),
  );
});
```

- [ ] **Step 2: Allowlist `sw.js` in middleware**

Edit `middleware.ts`. Find:

```ts
  // Skip static files and API routes
  if (clubSlug.startsWith("_next") || clubSlug.startsWith("api") || clubSlug === "favicon.ico" || clubSlug === "a2hs") {
    return applyLocale(request, NextResponse.next());
  }
```

Replace with:

```ts
  // Skip static files and API routes
  if (
    clubSlug.startsWith("_next") ||
    clubSlug.startsWith("api") ||
    clubSlug === "favicon.ico" ||
    clubSlug === "a2hs" ||
    clubSlug === "sw.js"
  ) {
    return applyLocale(request, NextResponse.next());
  }
```

- [ ] **Step 3: Smoke test serving the SW**

```bash
pnpm dev
```

In another terminal:
```bash
curl -s -o /dev/null -w "HTTP %{http_code} | CT: %header{content-type} | bytes: %{size_download}\n" http://localhost:3000/sw.js
```

Expected: `HTTP 200 | CT: application/javascript | bytes: <the file size>`. If you see 307, middleware isn't allowlisting — fix Step 2.

Stop dev server.

- [ ] **Step 4: Build**

```bash
pnpm build
```

Expected: clean build.

- [ ] **Step 5: Commit**

```bash
git add public/sw.js middleware.ts
git commit -m "feat(push): add service worker for push + allowlist in middleware"
```

---

## Task 4: Client push helper

**Files:**
- Create: `lib/push/client.ts`

**Context:** Pure browser-side helpers. No React, no server code. Exports three functions: `registerServiceWorker`, `subscribeToPush`, and the internal `urlBase64ToUint8Array` converter the Web Push API requires.

- [ ] **Step 1: Create the file**

Write to `lib/push/client.ts`:

```ts
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export async function subscribeToPush(
  vapidPublicKey: string,
): Promise<PushSubscription | null> {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;
  if (!("PushManager" in window)) return null;

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const cleaned = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(cleaned);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
```

- [ ] **Step 2: Build**

```bash
pnpm build
```

Expected: clean build. Watch for any TypeScript errors around `PushSubscription` or `ServiceWorkerRegistration` types (these are DOM lib types, should Just Work).

- [ ] **Step 3: Commit**

```bash
git add lib/push/client.ts
git commit -m "feat(push): add client-side subscribe helpers"
```

---

## Task 5: Member subscribe server action

**Files:**
- Create: `app/[clubSlug]/(member)/push-actions.ts`

**Context:** Single server action `savePushSubscription` that accepts the browser's `PushSubscription` (serialized as plain JSON object), validates the member cookie, and upserts into `push_subscriptions`. Returns a discriminated result union for TypeScript narrowing on the client.

- [ ] **Step 1: Create the file**

Write to `app/[clubSlug]/(member)/push-actions.ts`:

```ts
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
```

- [ ] **Step 2: Build**

```bash
pnpm build
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add "app/[clubSlug]/(member)/push-actions.ts"
git commit -m "feat(push): add savePushSubscription server action"
```

---

## Task 6: Add i18n keys for subscribe state

**Files:**
- Modify: `lib/i18n/dictionaries/en.json`
- Modify: `lib/i18n/dictionaries/es.json`

**Context:** Six new keys for the evolved `AddToHomescreen` card. Insert after the existing `a2hs.close` key added in the earlier walkthrough-modal work.

- [ ] **Step 1: Extend `lib/i18n/dictionaries/en.json`**

Use Edit. Find:

```json
  "a2hs.close": "Close",
```

Replace with:

```json
  "a2hs.close": "Close",
  "a2hs.subscribeTitle": "Enable notifications",
  "a2hs.subscribeTagline": "Never miss events and offers",
  "a2hs.subscribe": "Subscribe",
  "a2hs.subscribing": "Subscribing…",
  "a2hs.subscribed": "Notifications enabled",
  "a2hs.blocked": "Notifications blocked. Enable them in your browser settings.",
```

- [ ] **Step 2: Extend `lib/i18n/dictionaries/es.json`**

Use Edit. Find:

```json
  "a2hs.close": "Cerrar",
```

Replace with:

```json
  "a2hs.close": "Cerrar",
  "a2hs.subscribeTitle": "Activar notificaciones",
  "a2hs.subscribeTagline": "No te pierdas eventos y ofertas",
  "a2hs.subscribe": "Suscribir",
  "a2hs.subscribing": "Suscribiendo…",
  "a2hs.subscribed": "Notificaciones activadas",
  "a2hs.blocked": "Notificaciones bloqueadas. Actívalas en los ajustes del navegador.",
```

- [ ] **Step 3: Validate JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('lib/i18n/dictionaries/en.json','utf8')); console.log('en ok');"
node -e "JSON.parse(require('fs').readFileSync('lib/i18n/dictionaries/es.json','utf8')); console.log('es ok');"
```

Expected: both print `ok`.

- [ ] **Step 4: Commit**

```bash
git add lib/i18n/dictionaries/en.json lib/i18n/dictionaries/es.json
git commit -m "feat(push): add i18n keys for subscribe state"
```

---

## Task 7: Evolve the AddToHomescreen card with subscribe state

**Files:**
- Modify: `components/club/add-to-homescreen.tsx`

**Context:** The component currently has two visibility modes: iOS-not-standalone (show install banner) and standalone (hide). We add a third state: standalone-but-not-subscribed (show Subscribe button). The existing modal trigger + dismiss logic stays. The `A2HS_TEST_MODE` flag still only gates the install state.

**Current full file content:**

```tsx
"use client";

import { useState, useEffect } from "react";
import { Share, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/provider";
import { AddToHomescreenModal } from "./add-to-homescreen-modal";

// Set to `true` during QA: banner shows on every member-home load, ignoring
// the once-only flag. Flip to `false` in a follow-up one-line PR once Mikita
// signs off on staging.
const A2HS_TEST_MODE = true;

export function AddToHomescreen({ clubSlug }: { clubSlug: string }) {
  const [show, setShow] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    // Already installed → never show
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // iOS-specific standalone flag (Safari sets this on home-screen launches)
    if ((navigator as unknown as { standalone?: boolean }).standalone) return;

    // iOS only — Android gets its own install prompt flow (future work)
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    if (!isIOS) return;

    if (A2HS_TEST_MODE) {
      setShow(true);
      return;
    }

    // Production: show once per club per device. Record the sighting
    // immediately on mount so navigating away counts as "seen".
    const key = `clubos-a2hs-${clubSlug}-seen`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    setShow(true);
  }, [clubSlug]);

  function dismiss() {
    setShow(false);
  }

  if (!show) return null;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-3">
        <div className="shrink-0 w-9 h-9 rounded-full club-tint-bg flex items-center justify-center">
          <Share className="w-5 h-5 club-primary" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{t("a2hs.title")}</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {t("a2hs.tagline")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="shrink-0 text-xs font-semibold club-primary hover:opacity-70 transition-opacity px-2 py-1"
        >
          {t("a2hs.showMe")}
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("a2hs.dismiss")}
          className="shrink-0 -mr-1 p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <AddToHomescreenModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
```

- [ ] **Step 1: Read the file**

Use Read to load the file (Write tool requires it).

- [ ] **Step 2: Replace the full file contents**

Use the Write tool to replace with:

```tsx
"use client";

import { useState, useEffect } from "react";
import { Share, Bell, X } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/provider";
import { AddToHomescreenModal } from "./add-to-homescreen-modal";
import {
  registerServiceWorker,
  subscribeToPush,
  getExistingSubscription,
} from "@/lib/push/client";
import { savePushSubscription } from "@/app/[clubSlug]/(member)/push-actions";

// Set to `true` during QA: install banner shows on every member-home load,
// ignoring the once-only flag. Flip to `false` in a follow-up one-line PR once
// Mikita signs off on staging. Does NOT gate the subscribe state — that state
// always shows until the user has subscribed, then hides forever.
const A2HS_TEST_MODE = true;

type Mode = "hidden" | "install" | "subscribe";

export function AddToHomescreen({ clubSlug }: { clubSlug: string }) {
  const [mode, setMode] = useState<Mode>("hidden");
  const [modalOpen, setModalOpen] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    let cancelled = false;

    async function detect() {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true;

      if (isStandalone) {
        // Standalone: check push subscription state
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          // Browser doesn't support push — nothing to show
          return;
        }
        // Make sure the worker is registered so we can query for existing subs
        await registerServiceWorker();
        const existing = await getExistingSubscription();
        if (cancelled) return;
        if (existing) {
          // Already subscribed — card is done
          return;
        }
        setMode("subscribe");
        return;
      }

      // Not standalone: show the install card on iOS
      const ua = navigator.userAgent;
      const isIOS = /iPhone|iPad|iPod/.test(ua);
      if (!isIOS) return;

      if (A2HS_TEST_MODE) {
        setMode("install");
        return;
      }

      const key = `clubos-a2hs-${clubSlug}-seen`;
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
      setMode("install");
    }

    void detect();
    return () => {
      cancelled = true;
    };
  }, [clubSlug]);

  function dismiss() {
    setMode("hidden");
  }

  async function handleSubscribe() {
    setSubscribing(true);
    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        toast.error("Push not configured");
        return;
      }
      const sub = await subscribeToPush(vapidKey);
      if (!sub) {
        toast.error(t("a2hs.blocked"));
        return;
      }
      const json = sub.toJSON() as {
        endpoint: string;
        keys?: { p256dh?: string; auth?: string };
      };
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        toast.error("Subscription incomplete");
        return;
      }
      const result = await savePushSubscription({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        userAgent: navigator.userAgent,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("a2hs.subscribed"));
      setMode("hidden");
    } catch {
      toast.error(t("a2hs.blocked"));
    } finally {
      setSubscribing(false);
    }
  }

  if (mode === "hidden") return null;

  if (mode === "subscribe") {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-3">
        <div className="shrink-0 w-9 h-9 rounded-full club-tint-bg flex items-center justify-center">
          <Bell className="w-5 h-5 club-primary" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">
            {t("a2hs.subscribeTitle")}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {t("a2hs.subscribeTagline")}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSubscribe}
          disabled={subscribing}
          className="shrink-0 text-xs font-semibold club-primary hover:opacity-70 transition-opacity px-2 py-1 disabled:opacity-50"
        >
          {subscribing ? t("a2hs.subscribing") : t("a2hs.subscribe")}
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("a2hs.dismiss")}
          className="shrink-0 -mr-1 p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // mode === "install"
  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-3">
        <div className="shrink-0 w-9 h-9 rounded-full club-tint-bg flex items-center justify-center">
          <Share className="w-5 h-5 club-primary" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{t("a2hs.title")}</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {t("a2hs.tagline")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="shrink-0 text-xs font-semibold club-primary hover:opacity-70 transition-opacity px-2 py-1"
        >
          {t("a2hs.showMe")}
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("a2hs.dismiss")}
          className="shrink-0 -mr-1 p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <AddToHomescreenModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
```

- [ ] **Step 3: Build**

```bash
pnpm build
```

Expected: clean build. Any TypeScript errors likely come from the `savePushSubscription` import path or the `Bell` icon import — both are verified available.

- [ ] **Step 4: Commit**

```bash
git add components/club/add-to-homescreen.tsx
git commit -m "feat(push): evolve A2HS card with subscribe state"
```

---

## Task 8: Server-side sender

**Files:**
- Create: `lib/push/send.ts`

**Context:** Two public functions — `sendPushToClub` and `sendPushToMember`. Both return `{ sent, removed }`. Under the hood they share a single `sendToSubscriptions` helper that does the per-subscription try/catch, stale cleanup, and tally. `web-push` is initialised lazily on first call so import-time doesn't crash if env vars are missing at build time.

- [ ] **Step 1: Create the file**

Write to `lib/push/send.ts`:

```ts
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
```

- [ ] **Step 2: Build**

```bash
pnpm build
```

Expected: clean build. `web-push` has TypeScript types via `@types/web-push` installed in Task 1.

- [ ] **Step 3: Commit**

```bash
git add lib/push/send.ts
git commit -m "feat(push): add server-side push sender with stale cleanup"
```

---

## Task 9: Admin push page, form, and action

**Files:**
- Create: `app/[clubSlug]/admin/(panel)/push/page.tsx`
- Create: `app/[clubSlug]/admin/(panel)/push/push-form.tsx`
- Create: `app/[clubSlug]/admin/(panel)/push/actions.ts`

**Context:** A new admin page at `/[clubSlug]/admin/push`. The admin panel layout already enforces owner auth via middleware and the panel `layout.tsx`. The page reads the club id from `getOwnerFromCookie()`. Renders a client form component. The form submits via a server action that calls `sendPushToClub`.

- [ ] **Step 1: Create the server action**

Write to `app/[clubSlug]/admin/(panel)/push/actions.ts`:

```ts
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
```

- [ ] **Step 2: Create the form client component**

Write to `app/[clubSlug]/admin/(panel)/push/push-form.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { sendTestPush } from "./actions";

export function PushForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await sendTestPush({ title, body, url });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.sent === 0) {
        toast.info("No subscribed members yet");
        return;
      }
      const removedSuffix =
        result.removed > 0 ? `, cleaned up ${result.removed} stale` : "";
      toast.success(`Sent to ${result.sent} device${result.sent === 1 ? "" : "s"}${removedSuffix}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-lg">
      <div>
        <label htmlFor="push-title" className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          id="push-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          placeholder="New event this Saturday"
        />
        <p className="mt-1 text-xs text-gray-500">{title.length}/80</p>
      </div>

      <div>
        <label htmlFor="push-body" className="block text-sm font-medium text-gray-700 mb-1">
          Body
        </label>
        <textarea
          id="push-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={300}
          required
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          placeholder="Doors at 9pm. Free entry for members."
        />
        <p className="mt-1 text-xs text-gray-500">{body.length}/300</p>
      </div>

      <div>
        <label htmlFor="push-url" className="block text-sm font-medium text-gray-700 mb-1">
          Link (optional)
        </label>
        <input
          id="push-url"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          maxLength={500}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          placeholder="/events/123"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-gray-900 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {isPending ? "Sending…" : "Send test notification"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Create the page**

Write to `app/[clubSlug]/admin/(panel)/push/page.tsx`:

```tsx
import { PushForm } from "./push-form";

export default function PushPage() {
  return (
    <div className="p-6 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Push notifications</h1>
        <p className="mt-1 text-sm text-gray-500">
          Send a test notification to all members who have subscribed on this club.
        </p>
      </div>
      <PushForm />
    </div>
  );
}
```

- [ ] **Step 4: Build**

```bash
pnpm build
```

Expected: clean build. The new route `/[clubSlug]/admin/push` should appear in the build output.

- [ ] **Step 5: Commit**

```bash
git add "app/[clubSlug]/admin/(panel)/push/page.tsx" "app/[clubSlug]/admin/(panel)/push/push-form.tsx" "app/[clubSlug]/admin/(panel)/push/actions.ts"
git commit -m "feat(push): add admin push compose page with test send"
```

---

## Task 10: Link from Settings page + end-to-end verify + push

**Files:**
- Modify: `app/[clubSlug]/admin/(panel)/settings/page.tsx`

**Context:** The admin bottom nav has 4 slots and adding a 5th would crowd it. Instead, add a small card link on the Settings page that points to `/admin/push`. The Settings page already has a list of configuration cards — this matches the existing pattern.

- [ ] **Step 1: Inspect the Settings page**

Read `app/[clubSlug]/admin/(panel)/settings/page.tsx` to identify where other config cards render. The insertion point is wherever there's a list of `<Link>` cards to settings subsections.

- [ ] **Step 2: Add a Push card**

Locate the settings card list (it will be a `<div>` of `<Link>` elements or a wrapped list component). Add a new card/link at an appropriate location:

```tsx
<Link
  href={`/${clubSlug}/admin/push`}
  className="block rounded-2xl border border-gray-200 bg-white p-4 hover:border-gray-300 transition-colors"
>
  <h3 className="text-sm font-semibold text-gray-900">Push notifications</h3>
  <p className="mt-1 text-xs text-gray-500">
    Send test notifications to subscribed members.
  </p>
</Link>
```

If the settings page uses a shared `SettingsCard` component or similar abstraction, use that instead with the same copy. Match the existing visual style of its sibling cards.

Verify `clubSlug` is in scope at the insertion point. If the settings page already fetches params, reuse; if not, add the destructure.

- [ ] **Step 3: Build**

```bash
pnpm build
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add "app/[clubSlug]/admin/(panel)/settings/page.tsx"
git commit -m "feat(push): link to push page from admin settings"
```

- [ ] **Step 5: Local end-to-end smoke test**

Start the dev server:
```bash
pnpm dev
```

In Chrome (desktop is easiest for the first pass — iPhone testing comes on staging):

1. Open `http://localhost:3000/<some-club-slug>` (pick a club that exists in your Supabase data).
2. Log in as a member.
3. Install the site as a PWA via Chrome ⋮ → Install app. Relaunch from the installed PWA icon.
4. On the member home, verify the card shows "Enable notifications" with a Subscribe button. If it shows the Install state instead, you didn't install the PWA correctly.
5. Tap Subscribe. Grant browser permission.
6. Check the Supabase `push_subscriptions` table via Studio — a new row for your member should exist.
7. In a separate desktop Chrome tab, log in as that club's owner at `/<clubSlug>/admin/login`.
8. Navigate to `/<clubSlug>/admin/push` (use the Settings card link, or hit the URL directly).
9. Fill in Title = "Test", Body = "This is a test push", leave Link blank. Click Send.
10. Within a few seconds an OS notification should appear. Click it — it should focus the PWA tab.
11. Toast should say "Sent to 1 device".

If any step fails, stop and diagnose. Do NOT push broken code to develop.

Stop the dev server.

- [ ] **Step 6: Final production build**

```bash
pnpm build
```

Expected: clean build.

- [ ] **Step 7: Confirm Vercel env vars are set BEFORE pushing**

**CRITICAL.** Verify all four VAPID env vars are in Vercel staging (Preview) and production. Ask Jeff to confirm by running:

```bash
vercel env ls preview
vercel env ls production
```

Both lists must include `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.

If any are missing, STOP. Have Jeff add them before proceeding:

```bash
vercel env add VAPID_PUBLIC_KEY preview
vercel env add VAPID_PRIVATE_KEY preview
vercel env add VAPID_SUBJECT preview
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY preview
# then repeat with `production` for the final deploy
```

- [ ] **Step 8: Push to develop**

```bash
git push origin develop
```

Expected: all commits push. GitHub Actions will auto-apply the migration to Supabase staging. Vercel will auto-deploy the staging preview.

- [ ] **Step 9: Find or create the Trello card and hand off**

The card is at https://trello.com/c/yiDUoNJa — short id `yiDUoNJa`, full id `69d92582d38fdf94a572a856`.

Move it to QA:
```bash
trello move 69d92582d38fdf94a572a856 qa
```

Post the test instructions:
```bash
trello comment 69d92582d38fdf94a572a856 "@mikitatrayan web push members v1 deployed to staging. Test on iPhone Safari: (1) open any club, log in, install the PWA to home screen via the Show me how walkthrough if not already installed, (2) launch the PWA from the home screen icon, (3) on the member home tap 'Subscribe' on the Enable notifications card, grant permission, (4) on desktop log in as club owner, go to Admin → Settings → Push notifications, (5) fill in title + body, send, (6) verify the push arrives on the iPhone and tapping it opens the PWA. Also test Spanish locale. Also test on Android Chrome and desktop Chrome for parity. Staff push is out of scope for this phase — still use Telegram for staff."
```

- [ ] **Step 10: Done**

No further action until Mikita reports back.

---

## Self-Review Notes

**Spec coverage check:**

- ✅ VAPID keys, `web-push` package, env vars → Task 1
- ✅ `push_subscriptions` table + indexes + RLS → Task 2
- ✅ Service worker `public/sw.js` + middleware allowlist → Task 3
- ✅ Client push helpers (register, subscribe, getExisting) → Task 4
- ✅ `savePushSubscription` server action → Task 5
- ✅ i18n keys for subscribe state → Task 6
- ✅ Evolved A2HS card with 3 states → Task 7
- ✅ Server-side `sendPushToClub` + `sendPushToMember` + stale cleanup → Task 8
- ✅ Admin compose page + form + server action → Task 9
- ✅ Settings card link + end-to-end verify + push + Trello → Task 10
- ✅ Test mode preserved (install state only, not subscribe state) → Task 7 comment block
- ✅ Middleware skip for `/sw.js` → Task 3

**Identifier consistency check:**

- `savePushSubscription({ endpoint, keys: { p256dh, auth }, userAgent })` signature matches between Task 5 (definition) and Task 7 (caller).
- `sendPushToClub(clubId, { title, body, url })` / `sendPushToMember(memberId, payload)` signatures match between Task 8 (definition) and Task 9 (caller).
- `PushPayload`, `SendResult`, `SendTestPushResult` types defined once each and referenced correctly.
- `PushForm` component exported from `push-form.tsx` and imported from `page.tsx` — both same directory.
- `i18n` key names `a2hs.subscribeTitle`, `a2hs.subscribeTagline`, `a2hs.subscribe`, `a2hs.subscribing`, `a2hs.subscribed`, `a2hs.blocked` match between Task 6 (dictionary) and Task 7 (component).

**Discovered during planning:**

- `middleware.ts` catch-all would intercept `/sw.js` without the Task 3 skip — same class of bug as `/a2hs/*` and `/manifest.webmanifest`. Explicitly called out with a test curl in Task 3.
- Admin bottom nav has 4 slots; adding a 5th would crowd. Plan routes the Push page through the Settings card list instead (Task 10).
- VAPID keys are a hard gating dependency for Vercel deploys. Task 10 Step 7 has an explicit check + halt before push.
- The existing `A2HS_TEST_MODE` flag needed clarification: it only gates the install state, NOT the subscribe state. Otherwise production members would see the subscribe card on every load after subscribing. Comment block in Task 7 makes this explicit.

**Out of scope (explicit):**

- Staff push, Telegram replacement, member→staff triggers, staff→member triggers, admin segmentation, scheduled sends, analytics, notification actions/images, subscriber list UI, automated tests.
