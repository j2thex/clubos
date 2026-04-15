# iOS Add to Home Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the member portal installable as a per-club PWA on iOS so the home screen icon shows the club's logo and tapping it launches that club's member home.

**Architecture:** Two new dynamic route handlers under `app/[clubSlug]/` emit a per-club web manifest and per-club 180×180 apple-touch-icon. The member layout's `generateMetadata` points iOS at both. The existing (currently unused) `AddToHomescreen` banner component is rewritten for iOS-only, member-home-only, once-per-club, with a test-mode constant for QA, and is rendered on the member home page.

**Tech Stack:** Next.js 16 App Router, Route Handlers, `next/og` `ImageResponse`, Supabase (via existing `getClub()`), React 19, Tailwind CSS, existing `useLanguage()` i18n provider.

**Spec:** `docs/superpowers/specs/2026-04-15-ios-add-to-homescreen-design.md`

**Testing model:** ClubOS has no automated test framework. Verification is `pnpm build` + manual QA on staging (Mikita). Each task ends with `pnpm build` and spot-check, not red/green tests.

**Commit cadence:** One commit per task. All commits go to `develop` (direct push OK per CLAUDE.md workflow).

---

## File Structure

**New files:**

- `app/[clubSlug]/manifest.webmanifest/route.ts` — GET handler returning per-club web manifest JSON
- `app/[clubSlug]/icon.png/route.ts` — GET handler returning per-club 180/512 PNG via `next/og` `ImageResponse`

**Modified files:**

- `app/[clubSlug]/(member)/layout.tsx` — extend `generateMetadata` with `manifest`, `appleWebApp`, and `icons.apple`
- `app/[clubSlug]/(member)/page.tsx` — render `<AddToHomescreen />` near the top of the return
- `components/club/add-to-homescreen.tsx` — rewrite: iOS-only, test-mode constant, club-scoped once-only flag, animated share arrow

**Untouched:**

- `app/manifest.ts`, `app/apple-icon.png` — remain as global osocios.club fallbacks
- Staff/admin layouts
- i18n dictionaries (unused `a2hs.android` key stays; YAGNI, not cleanup)

---

## Task 1: Per-club web manifest route

**Files:**
- Create: `app/[clubSlug]/manifest.webmanifest/route.ts`

- [ ] **Step 1: Create the route file**

```ts
// app/[clubSlug]/manifest.webmanifest/route.ts
import { getClub } from "@/lib/data/club";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clubSlug: string }> },
) {
  const { clubSlug } = await params;
  const club = await getClub(clubSlug);

  if (!club) {
    return new Response("Not found", { status: 404 });
  }

  const branding = Array.isArray(club.club_branding)
    ? club.club_branding[0]
    : club.club_branding;

  const themeColor = branding?.primary_color ?? "#16a34a";
  const shortName = club.name.length > 12 ? club.name.slice(0, 12) : club.name;

  const manifest = {
    name: club.name,
    short_name: shortName,
    start_url: `/${clubSlug}`,
    scope: `/${clubSlug}/`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: themeColor,
    icons: [
      {
        src: `/${clubSlug}/icon.png`,
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `/${clubSlug}/icon.png?size=512`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };

  return Response.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control":
        "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
```

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: clean build, no TypeScript errors. The new route should appear in the build output as `ƒ /[clubSlug]/manifest.webmanifest` (dynamic).

- [ ] **Step 3: Local smoke test**

Run: `pnpm dev` in one terminal, then in another:

```bash
curl -i http://localhost:3000/redsessions/manifest.webmanifest
```

Expected: HTTP 200, `Content-Type: application/manifest+json`, body contains `"name": "Red Sessions"`, `"start_url": "/redsessions"`, `"scope": "/redsessions/"`. If `redsessions` doesn't exist locally, substitute any club slug from your local DB. Then test 404:

```bash
curl -i http://localhost:3000/does-not-exist/manifest.webmanifest
```

Expected: HTTP 404.

- [ ] **Step 4: Commit**

```bash
git add "app/[clubSlug]/manifest.webmanifest/route.ts"
git commit -m "feat(a2hs): add per-club dynamic web manifest route"
```

---

## Task 2: Per-club apple-touch-icon route

**Files:**
- Create: `app/[clubSlug]/icon.png/route.ts`

Context notes before coding:
- `next/og`'s `ImageResponse` renders JSX to PNG/SVG. It accepts remote `<img>` sources but reliability varies; the safe pattern is to fetch the logo bytes server-side and pass a `data:` URL.
- `logo_url` from `club_branding` may be an SVG, JPG, PNG, or WebP, or may be null. If fetch fails or the URL is missing, fall back to a monogram tile.
- Two sizes from one route via `?size=` query param. Default 180, only accept 180 or 512.

- [ ] **Step 1: Create the route file**

```tsx
// app/[clubSlug]/icon.png/route.ts
import { ImageResponse } from "next/og";
import { getClub } from "@/lib/data/club";

export const runtime = "nodejs";

async function fetchLogoAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "image/png";
    const buf = await res.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

function monogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ clubSlug: string }> },
) {
  const { clubSlug } = await params;
  const club = await getClub(clubSlug);

  if (!club) {
    return new Response("Not found", { status: 404 });
  }

  const url = new URL(req.url);
  const sizeParam = url.searchParams.get("size");
  const size = sizeParam === "512" ? 512 : 180;

  const branding = Array.isArray(club.club_branding)
    ? club.club_branding[0]
    : club.club_branding;

  const primaryColor = branding?.primary_color ?? "#16a34a";
  const logoUrl: string | null = branding?.logo_url ?? null;

  const logoDataUrl = logoUrl ? await fetchLogoAsDataUrl(logoUrl) : null;

  const monogramText = monogram(club.name);
  const monogramFontSize = Math.floor(size * 0.42);

  const body = logoDataUrl ? (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: primaryColor,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoDataUrl}
        width={Math.floor(size * 0.8)}
        height={Math.floor(size * 0.8)}
        style={{ objectFit: "contain" }}
        alt=""
      />
    </div>
  ) : (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: primaryColor,
        color: "#ffffff",
        fontSize: monogramFontSize,
        fontWeight: 700,
        fontFamily: "sans-serif",
        letterSpacing: -2,
      }}
    >
      {monogramText}
    </div>
  );

  return new ImageResponse(body, {
    width: size,
    height: size,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control":
        "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
```

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: clean build, no TypeScript errors. New dynamic route `ƒ /[clubSlug]/icon.png` visible in output.

- [ ] **Step 3: Local smoke test**

Run: `pnpm dev`, then in another terminal:

```bash
curl -i "http://localhost:3000/redsessions/icon.png" -o /tmp/icon-180.png
file /tmp/icon-180.png
```

Expected: HTTP 200, `Content-Type: image/png`, `file` reports `PNG image data, 180 x 180`. Open `/tmp/icon-180.png` — it should be the club's logo centered on the primary color, OR (if the club has no logo) a solid color tile with white monogram initials.

Test 512 variant:

```bash
curl -i "http://localhost:3000/redsessions/icon.png?size=512" -o /tmp/icon-512.png
file /tmp/icon-512.png
```

Expected: `PNG image data, 512 x 512`.

Test 404:

```bash
curl -i "http://localhost:3000/does-not-exist/icon.png"
```

Expected: HTTP 404.

Test monogram fallback: pick a club in the local DB with `logo_url` null (or temporarily null one out in Supabase Studio), re-run the 180 curl, verify monogram renders instead of a broken image.

- [ ] **Step 4: Commit**

```bash
git add "app/[clubSlug]/icon.png/route.ts"
git commit -m "feat(a2hs): add per-club dynamic apple-touch-icon route"
```

---

## Task 3: Wire the member layout

**Files:**
- Modify: `app/[clubSlug]/(member)/layout.tsx`

Current `generateMetadata` (lines 8–20):

```ts
export async function generateMetadata({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}): Promise<Metadata> {
  const { clubSlug } = await params;
  const club = await getClub(clubSlug);

  return {
    title: club ? `Member | ${club.name}` : "Member Portal",
    icons: { icon: "/favicon-member.svg" },
  };
}
```

We extend it to also advertise the manifest and apple-touch-icon.

- [ ] **Step 1: Replace `generateMetadata`**

Find the existing function and replace with:

```ts
export async function generateMetadata({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}): Promise<Metadata> {
  const { clubSlug } = await params;
  const club = await getClub(clubSlug);

  return {
    title: club ? `Member | ${club.name}` : "Member Portal",
    manifest: `/${clubSlug}/manifest.webmanifest`,
    appleWebApp: {
      capable: true,
      title: club?.name ?? "Member Portal",
      statusBarStyle: "default",
    },
    icons: {
      icon: "/favicon-member.svg",
      apple: [{ url: `/${clubSlug}/icon.png`, sizes: "180x180" }],
    },
  };
}
```

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: clean build, no TypeScript errors.

- [ ] **Step 3: Local smoke test**

Run: `pnpm dev`, then:

```bash
curl -s http://localhost:3000/redsessions | grep -E 'manifest|apple-touch-icon|apple-mobile-web-app'
```

Expected: output contains `<link rel="manifest" href="/redsessions/manifest.webmanifest"/>`, `<link rel="apple-touch-icon" href="/redsessions/icon.png" sizes="180x180"/>`, `<meta name="apple-mobile-web-app-capable" content="yes"/>`, and `<meta name="apple-mobile-web-app-title" content="Red Sessions"/>` (substitute your actual club name).

Note: depending on auth state the curl may return a login page — check the HTML `<head>` regardless, since `generateMetadata` runs on the layout for all member routes.

- [ ] **Step 4: Commit**

```bash
git add "app/[clubSlug]/(member)/layout.tsx"
git commit -m "feat(a2hs): wire per-club manifest + apple-touch-icon in member layout"
```

---

## Task 4: Rewrite the AddToHomescreen banner

**Files:**
- Modify: `components/club/add-to-homescreen.tsx` (full rewrite)

Changes from current version:
- Drop Android path entirely
- Add `A2HS_TEST_MODE` module constant
- Accept `clubSlug` prop so the once-only flag is club-scoped
- Add an animated share-icon arrow pointing downward (Safari's share button on iPhone is bottom-center)
- In production mode, show once per club per device; first mount sets the flag

- [ ] **Step 1: Replace the file contents**

```tsx
// components/club/add-to-homescreen.tsx
"use client";

import { useState, useEffect } from "react";
import { Share } from "lucide-react";
import { useLanguage } from "@/lib/i18n/provider";

// Set to `true` during QA: banner shows on every member-home load, ignoring
// the once-only flag. Flip to `false` in a follow-up one-line PR once Mikita
// signs off on staging.
const A2HS_TEST_MODE = true;

export function AddToHomescreen({ clubSlug }: { clubSlug: string }) {
  const [show, setShow] = useState(false);
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
    <div className="bg-white rounded-2xl shadow-lg p-4 flex items-start gap-3 relative overflow-hidden">
      <div className="shrink-0 w-9 h-9 rounded-full club-tint-bg flex items-center justify-center mt-0.5">
        <Share className="w-5 h-5 club-primary" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{t("a2hs.title")}</p>
        <p className="text-xs text-gray-500 mt-0.5">{t("a2hs.ios")}</p>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium club-primary">
          <Share className="w-3.5 h-3.5 animate-a2hs-bounce" strokeWidth={2.5} />
          <span className="animate-a2hs-bounce">↓</span>
        </div>
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 text-xs font-semibold club-primary hover:opacity-70 transition-opacity mt-1"
      >
        {t("a2hs.dismiss")}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Add the `a2hs-bounce` keyframe**

Open `app/globals.css`. Append at the bottom:

```css
@keyframes a2hs-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(4px); }
}
.animate-a2hs-bounce {
  animation: a2hs-bounce 1.4s ease-in-out infinite;
}
```

The bounce is downward (toward where Safari's share button lives on iPhone), gentle (1.4s cycle, 4px amplitude), and infinite. Kept in globals.css rather than tailwind.config because it's a one-off.

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: clean build. Watch specifically for TypeScript errors on the `navigator.standalone` cast and the `Share` import from `lucide-react`.

- [ ] **Step 4: Commit**

```bash
git add components/club/add-to-homescreen.tsx app/globals.css
git commit -m "feat(a2hs): rewrite banner for iOS-only + test mode + club-scoped"
```

---

## Task 5: Render the banner on the member home page

**Files:**
- Modify: `app/[clubSlug]/(member)/page.tsx`

Place the banner below the hero and above the bento strip, so it's one of the first things the member sees on a fresh load but doesn't obscure the greeting.

- [ ] **Step 1: Add import**

At the top of the file with the other imports (after `BentoStatTile`), add:

```ts
import { AddToHomescreen } from "@/components/club/add-to-homescreen";
```

- [ ] **Step 2: Render the banner**

Find the block that starts with `<div className="relative z-10 mx-auto -mt-6 max-w-md px-5">` (around line 180). The first child is the bento grid `<div className="grid grid-cols-3 gap-3">`. Insert the banner **before** the bento grid:

```tsx
<div className="relative z-10 mx-auto -mt-6 max-w-md px-5">
  <div className="mb-4">
    <AddToHomescreen clubSlug={clubSlug} />
  </div>
  {/* Bento stat strip — one row, next event double-wide + membership single-wide */}
  <div className="grid grid-cols-3 gap-3">
```

The wrapper `<div className="mb-4">` gives breathing room when the banner is visible. When it renders `null` (non-iOS, standalone, or already seen in prod), the empty `mb-4` div has zero height — no layout shift.

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: clean build.

- [ ] **Step 4: Dev-server spot check**

Run: `pnpm dev`, open `http://localhost:3000/redsessions` in a desktop browser (not iOS). Since desktop UA isn't iPhone, the banner should NOT render — verify the member home looks identical to before (no empty space issue).

Then simulate iOS: open Chrome DevTools → Device toolbar → iPhone → reload. The banner should now appear above the bento strip with the animated downward-bouncing share arrow. Dismiss it → it hides for this render. Refresh → in test mode it reappears.

- [ ] **Step 5: Commit**

```bash
git add "app/[clubSlug]/(member)/page.tsx"
git commit -m "feat(a2hs): render banner on member home page"
```

---

## Task 6: Push and hand off to QA

- [ ] **Step 1: Push to develop**

```bash
git push origin develop
```

Expected: pushes 5 commits. Vercel auto-deploys preview/staging.

- [ ] **Step 2: Find or create the Trello card**

Run: `trello list critical`
Look for an existing card about "save to homescreen" or "iOS install". If none, create one:

```bash
trello add qa "iOS add to home screen — per-club PWA" "Per-club manifest + apple-touch-icon + testing-mode banner. Spec: docs/superpowers/specs/2026-04-15-ios-add-to-homescreen-design.md"
```

If the card already existed in CRITICAL, move it:

```bash
trello move <card-id> qa
```

- [ ] **Step 3: Comment testing instructions for Mikita**

```bash
trello comment <card-id> "@mikitatrayan test on iPhone Safari: open any club member page on staging, log in, tap Share → Add to Home Screen. Verify: (1) home icon is club logo on club color, not osocios green; (2) label under icon is club name; (3) tapping icon opens that club's home, not osocios.club landing; (4) banner shows on every refresh (test mode). Try 2+ different clubs and one with no logo (should show initials). Also confirm nothing changes in staff/admin."
```

- [ ] **Step 4: Wait for QA sign-off**

No further action until Mikita reports back. If he finds issues, iterate on a new feature branch → PR into develop.

---

## Task 7: Production flip (separate follow-up PR, after QA passes)

**Do not execute this task until Mikita signs off on Task 6.**

**Files:**
- Modify: `components/club/add-to-homescreen.tsx`

- [ ] **Step 1: Flip the constant**

Change line near the top of the file from:

```ts
const A2HS_TEST_MODE = true;
```

to:

```ts
const A2HS_TEST_MODE = false;
```

- [ ] **Step 2: Build**

Run: `pnpm build`

- [ ] **Step 3: Commit and push**

```bash
git add components/club/add-to-homescreen.tsx
git commit -m "feat(a2hs): switch banner to production mode (once per club)"
git push origin develop
```

- [ ] **Step 4: Promote to main**

Create a PR from `develop` → `main` via `gh`:

```bash
gh pr create --base main --head develop --title "iOS add to home screen — production rollout" --body "$(cat <<'EOF'
## Summary
- Per-club PWA manifest + apple-touch-icon (Tasks 1–5 already merged to develop)
- Flips A2HS_TEST_MODE to false — banner now shows once per club per device instead of every load

## Test plan
- [x] Verified on staging by Mikita (see Trello card)
- [ ] Verify on production: open a club on a fresh device, confirm banner appears exactly once
EOF
)"
```

---

## Self-Review Notes

**Spec coverage check:**

- ✅ Section 2 (dynamic manifest) → Task 1
- ✅ Section 3 (dynamic icon with `ImageResponse` + monogram fallback) → Task 2
- ✅ Section 4 (wire member layout via `generateMetadata`) → Task 3
- ✅ Section 5 (banner rewrite, iOS-only, test mode, once-per-club, animated arrow) → Tasks 4 & 5
- ✅ Section 6 (testing plan) → Task 6
- ✅ Production flip → Task 7

**Discovered during planning (not in spec):**

- `AddToHomescreen` is dead code today — no existing render to remove, only add. Plan reflects this.
- Member layout already has `generateMetadata`; we extend rather than add.
- `getClub()` already joins `club_branding` and is `React.cache`'d. Routes call it directly.
- `club_branding.primary_color` and `logo_url` confirmed as the correct columns.
- i18n keys `a2hs.title`, `a2hs.ios`, `a2hs.dismiss` already exist in both dictionaries; `a2hs.android` stays unused (YAGNI).

**Out of scope (explicit):**

- Android `beforeinstallprompt` flow
- Staff/admin PWA install
- Web Push notifications
- Club-owner "upload an app icon" UI
- Automated tests (repo has no test framework)
