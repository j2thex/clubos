# iOS Add to Home Screen — Per-Club PWA Install

**Status:** Design approved, pending implementation plan
**Date:** 2026-04-15
**Scope:** Member portal only (iOS). Staff/admin deferred.

## Problem

The member portal has an "Add to Home Screen" banner (`components/club/add-to-homescreen.tsx`) that teaches iOS users the Share → A2HS gesture. But when a user actually follows the instructions today:

1. The installed home-screen icon is the generic green osocios.club icon, not the club's logo.
2. Tapping the installed icon launches `osocios.club/` (the marketing landing page), not the club's member portal.

Root cause: `app/manifest.ts` is a single static manifest with `start_url: "/"` and hardcoded osocios icons, and there are no per-club `apple-touch-icon` links in the member layout. On iOS 16.4+, Safari reads `start_url` from the manifest, which overrides the current URL at install time — so every install launches `/`.

This also blocks future work: iOS Web Push requires the site to be installed as a proper PWA. Fixing A2HS now unblocks push notifications later (relevant for eventually replacing the staff Telegram informer bot).

## Goals

- An iOS member who taps Share → Add to Home Screen on any club member page gets a home screen icon showing **that club's** logo on **that club's** primary color.
- Tapping the installed icon launches the club's member portal (`/{clubSlug}`), not the osocios landing page.
- The install banner is less intrusive: shown only on the member home page, and in production, only once per club per device.
- A testing mode lets us force the banner on every load until QA signs off, then a one-line flip ships the production behavior.

## Non-Goals

- Android install UX (`beforeinstallprompt`). Deferred — the Android path in the current component is removed.
- Staff/admin portal PWA install. Deferred; intentionally leaves the global `app/manifest.ts` untouched for these routes.
- Web Push notifications. Separate future spec; this unblocks them but does not implement them.
- Club-owner-facing "upload an app icon" field. We derive from existing `club_branding.logo_url` with a monogram fallback.

## Architecture

Four moving parts:

### 1. Dynamic per-club manifest

**New file:** `app/[clubSlug]/manifest.webmanifest/route.ts`

Next.js App Router Route Handler, `GET` only.

- Reads `clubSlug` from route params.
- Queries Supabase for `clubs` (name) joined with `club_branding` (primary_color, logo_url). Returns 404 if the club is missing.
- Returns JSON:
  ```ts
  {
    name: club.name,
    short_name: club.name.slice(0, 12),
    start_url: `/${clubSlug}`,
    scope: `/${clubSlug}/`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: branding.primary_color ?? "#16a34a",
    icons: [
      { src: `/${clubSlug}/icon.png`, sizes: "180x180", type: "image/png", purpose: "any" },
      { src: `/${clubSlug}/icon.png?size=512`, sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  }
  ```
- Response headers: `Content-Type: application/manifest+json`, `Cache-Control: public, max-age=300, s-maxage=3600, stale-while-revalidate=86400`.

**Why a route handler, not `manifest.ts`:** Next.js's built-in `manifest.ts` convention supports only one manifest per app. We need per-slug dynamic manifests.

**Why `scope: /{clubSlug}/`:** Constrains the installed PWA. External links inside the app open in Safari instead of the standalone shell — the installed app only owns its own club's pages.

**Why `start_url: /{clubSlug}`** (not `/{clubSlug}/member/home`): The existing middleware redirects unauthenticated users to login and authenticated users to their home. Launching to the slug root Just Works in both auth states.

### 2. Dynamic per-club apple-touch-icon

**New file:** `app/[clubSlug]/icon.png/route.ts`

Route Handler that generates a 180×180 (or 512×512 via `?size=512`) PNG.

- Reads `clubSlug` and optional `?size` query param (default 180).
- Queries `club_branding.logo_url` and `primary_color`. 404 if club missing.
- Composites using Next.js's `ImageResponse` from `next/og`:
  - Outer container: `size × size`, `backgroundColor: primary_color`, flex-center.
  - If `logo_url` is set and fetchable: inner `<img src={logo_url}>` with `maxWidth: 80%`, `maxHeight: 80%`, `objectFit: contain`.
  - Fallback (no logo or fetch failure): monogram — first 1–2 letters of the club name, white, large sans-serif font, centered.
- Response: PNG, same cache headers as the manifest route.

**Why `ImageResponse`:** Already used in `opengraph-image.tsx`, no new dep, runs on Vercel's image pipeline.

**Why a solid color background (not transparent):** iOS renders transparency as black on the home screen. A solid fill guarantees every club's icon looks intentional.

**Why a monogram fallback:** Some clubs onboard before uploading a logo; a colored tile with the club's initials looks like a deliberate placeholder, not a broken icon.

**Why two sizes from one route:** 180 is what iOS needs for `apple-touch-icon`; 512 is advertised in the manifest for Android and future uses. One codepath, one query param.

### 3. Wire the member layout

**File to edit:** `app/[clubSlug]/(member)/layout.tsx`

Add (or extend) `generateMetadata({ params })`:

```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  const { clubSlug } = await params;
  const club = await fetchClub(clubSlug); // likely already loaded in the layout
  return {
    manifest: `/${clubSlug}/manifest.webmanifest`,
    appleWebApp: {
      capable: true,
      title: club.name,
      statusBarStyle: "default",
    },
    icons: {
      apple: [{ url: `/${clubSlug}/icon.png`, sizes: "180x180" }],
    },
  };
}
```

Next.js emits the correct `<link rel="manifest">`, `<link rel="apple-touch-icon">`, `<meta name="apple-mobile-web-app-capable">`, and `<meta name="apple-mobile-web-app-title">` tags automatically.

If the layout already fetches the club for branding/nav, reuse that query. Otherwise add one lightweight fetch in `generateMetadata`.

### 4. Banner UX rework

**File to edit:** `components/club/add-to-homescreen.tsx` (rewrite).

Module-level constant at the top:

```ts
const A2HS_TEST_MODE = true; // TODO: flip to false after QA sign-off
```

Behavior on mount:

1. If `display-mode: standalone` or `navigator.standalone` → never show. (Even in test mode — nothing to test once installed.)
2. If the UA is not iPhone/iPad/iPod → never show. Android path deleted.
3. If `A2HS_TEST_MODE === true` → always show.
4. If `A2HS_TEST_MODE === false` → check `localStorage["clubos-a2hs-{clubSlug}-seen"]`. If set, hide. Otherwise show and immediately set the flag (first sighting is the only sighting).

Visual:

- Keep the existing card layout and i18n strings `a2hs.title`, `a2hs.ios`, `a2hs.dismiss`. Drop `a2hs.android`.
- Add a small animated share-icon arrow pointing toward the bottom of the viewport (where Safari's share button lives on iPhone). Subtle bounce keyframe, Lucide `Share` or similar icon. Not strobing — gentle.
- Dismiss button remains. In production mode it is redundant with the once-only flag but costs nothing. In test mode, dismiss hides the banner for the current render only (no persistence), so we can still test the dismiss interaction.

**Placement change:** The `<AddToHomescreen />` render moves from its current (global-ish) location to the member home page only. Exact current render location to be confirmed during planning.

## Data Flow

```
iOS Safari visits /redsessions
  └─> member layout's generateMetadata()
        ├─> <link rel="manifest" href="/redsessions/manifest.webmanifest">
        ├─> <link rel="apple-touch-icon" href="/redsessions/icon.png">
        └─> <meta name="apple-mobile-web-app-title" content="Red Sessions">

User navigates to member home (/redsessions)
  └─> AddToHomescreen component mounts
        └─> iOS + not standalone + (test mode OR not yet seen)
              └─> banner renders with animated share arrow

User taps Share → Add to Home Screen
  └─> iOS fetches /redsessions/icon.png (180x180 PNG, club logo on primary color)
  └─> iOS reads /redsessions/manifest.webmanifest
        └─> name: "Red Sessions", start_url: /redsessions, theme_color: <primary>

User taps home screen icon
  └─> launches standalone at /redsessions
        └─> middleware: authed → member home, unauthed → login
```

## Caching

Both the manifest and icon routes use `Cache-Control: public, max-age=300, s-maxage=3600, stale-while-revalidate=86400`. A branding edit in admin propagates to new visitors within ~5 minutes at the browser and within an hour at Vercel's edge, with stale-while-revalidate smoothing the refresh.

Explicit tag-based revalidation on branding updates is out of scope for v1 — short TTL is good enough for a feature that changes rarely.

## Testing Plan

**On staging with `A2HS_TEST_MODE = true`:**

1. iPhone Safari → `staging.osocios.club/redsessions` → log in → land on member home → banner appears on every refresh.
2. Tap Share → Add to Home Screen.
3. Verify:
   - Home screen icon is the Red Sessions logo on the club's primary color, not the osocios green icon.
   - Label under the icon is "Red Sessions", not "osocios".
   - Tapping the icon launches `/redsessions` (club home), not `/`.
   - Standalone chrome: no Safari address bar, theme color matches branding.
4. Repeat on a second club with a different logo and primary color to verify per-club isolation.
5. Edge case: a club with `logo_url` null → verify monogram fallback renders (colored tile with initials).
6. Verify the dismiss button hides the banner in the current render.
7. Verify the banner does not appear on non-member-home pages (offers, wheel, events, etc.).
8. Verify the banner does not appear once the app is already installed (standalone detection).

**Production rollout:**

One-line follow-up PR: flip `A2HS_TEST_MODE` to `false`. That is the entire production flip — no env var, no feature flag, because this is a two-week testing window, not a permanent config.

## Files Touched

**New:**

- `app/[clubSlug]/manifest.webmanifest/route.ts`
- `app/[clubSlug]/icon.png/route.ts`

**Edited:**

- `app/[clubSlug]/(member)/layout.tsx` — add/extend `generateMetadata`
- `components/club/add-to-homescreen.tsx` — rewrite per above
- Member home page file (TBD during planning) — add `<AddToHomescreen />` render
- Wherever `<AddToHomescreen />` currently renders (TBD during planning) — remove

**Untouched:**

- `app/manifest.ts` — stays as the global osocios.club manifest for non-club paths
- `app/apple-icon.png` — stays as global fallback
- Staff and admin layouts — future work

## Open Questions Resolved

- **Icon generation strategy:** runtime via `ImageResponse`, not pre-bake on upload.
- **Portals covered:** member only; staff/admin deferred.
- **Banner timing:** member home page, after login implied by location, once per club in production.
- **Test mode:** module-level constant, defaults true in this PR, flipped off in a follow-up.
- **Android:** out of scope, path removed.
