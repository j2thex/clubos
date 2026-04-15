# A2HS Walkthrough Modal — Visual Install Guide

**Status:** Design approved, pending implementation plan
**Date:** 2026-04-15
**Scope:** Improves the member-portal Add to Home Screen banner shipped earlier today (`2026-04-15-ios-add-to-homescreen-design.md`). Adds a visual 4-step walkthrough triggered from the compact banner.

## Problem

The current A2HS banner uses a single line of text — `"Tap the Share button, then Add to Home Screen for quick access."` — which is wrong for modern iPhone Safari. The real install flow is **four taps**, and critically, "Add to Home Screen" is not visible in the default share sheet; users must tap "View More" to reveal it. Most members will give up before finding it.

Without clear visual guidance, installs will not happen, and the per-club PWA icon work we just shipped is wasted effort.

## Goals

- Give members a visual, unambiguous walkthrough of the four taps required to install the member portal on their iOS home screen.
- Keep the banner itself compact — the walkthrough lives behind a "Show me how" button so the member home stays uncluttered.
- Use real iPhone Safari screenshots (not mockups) so users recognize their own UI and trust the instructions.
- Support both English and Spanish captions.

## Non-Goals

- Android walkthrough — the banner is already iOS-only.
- Animated GIF or video — heavier payload, harder to localize, harder to update when iOS changes.
- Swipe-through slideshow — scrolling a stacked column is simpler.
- Dark-mode screenshot variants.
- Editing or annotating the raw screenshots — captions carry the guidance.

## Architecture

Three pieces:

### 1. Banner changes

**File:** `components/club/add-to-homescreen.tsx`

The banner becomes compact. Drop the bouncing share-arrow and the `a2hs.ios` instructional line. Keep:

- Share icon (left)
- Title: `t("a2hs.title")` — "Add to Home Screen"
- Tagline (new key): `t("a2hs.tagline")` — "Install for quick access"
- **"Show me how" button** (new) — click opens the modal
- Dismiss × (unchanged)

The banner owns an `open` state for the modal. Clicking "Show me how" sets `open: true`. Closing the modal does not dismiss the banner — the member can re-open the walkthrough.

### 2. Walkthrough modal

**File:** `components/club/add-to-homescreen-modal.tsx` (new, client component)

A bottom sheet that slides up from the bottom of the viewport. Structure:

- Fixed backdrop (`bg-black/50`, tap to close)
- Sheet container: `rounded-t-3xl bg-white`, full-width, `max-h-[85vh]`, `overflow-y-auto`
- Decorative drag handle (gray rounded bar, top-center) — visual hint only, no actual swipe gesture
- Title: `t("a2hs.stepsTitle")` — "Add to Home Screen in 4 steps"
- Close × button (top right), `aria-label={t("a2hs.close")}`
- Four step cards stacked vertically
- Subtle bottom fade (gradient from transparent to white) to indicate scrollability when content overflows

**Step card:**

- Circular step-number badge on the left (club primary color background, white number)
- Caption text (`t("a2hs.stepN")`)
- Screenshot image below caption, `width: 100%`, `rounded-xl`, gray border

**Behavior:**

- Opens via `open` prop from parent
- Closes on: backdrop tap, close × tap, Escape key
- Body scroll locked while open (toggle `document.body.style.overflow = "hidden"` on mount, restore on unmount)
- Mount animation: sheet `translateY(100%) → 0` with `transition-transform duration-300 ease-out`; backdrop opacity 0 → 1
- Close animation: reverse, then unmount

**Accessibility:**

- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the title element
- Focus moves into the modal on open (first focusable element — the close button)
- Focus returns to the "Show me how" trigger button on close
- Screenshots use empty `alt=""` because the step caption already describes their content (decorative images rule)

### 3. Static assets

**Files:**

- `public/a2hs/step-1.png` — Safari bottom bar with ⋯ menu button visible
- `public/a2hs/step-2.png` — ⋯ menu popup open, "Share" row visible at top
- `public/a2hs/step-3.png` — iOS share sheet, scrolled to show "View More" button
- `public/a2hs/step-4.png` — Expanded share sheet showing "Add to Home Screen" row

Source screenshots provided by Jeff (currently at repo root as `homescreen-1.PNG` through `homescreen-4.PNG`). They move into `public/a2hs/` and are renamed to lowercase `step-N.png`. No annotation overlay — the captions direct the user's attention to the relevant UI element, and each target is clearly visible in the raw screenshot.

Served as static files under `/a2hs/step-N.png`. No Next.js `Image` component optimization — these are small PNGs already sized for the modal. `<img src="/a2hs/step-1.png" />` is fine.

## Data Flow

```
Member lands on member home page
  └─> AddToHomescreen renders (iOS + not standalone + test-mode or unseen)
        └─> Banner shows: icon + title + tagline + [Show me how] + [×]

Member taps "Show me how"
  └─> Banner setState({ open: true })
        └─> AddToHomescreenModal mounts, slides up
              └─> 4 step cards render with captions + screenshots from /a2hs/

Member reads, closes modal
  └─> Modal unmounts, focus returns to "Show me how" button
  └─> Banner stays visible (can be reopened or dismissed separately)
```

## Copy (i18n keys)

**New keys added to both `lib/i18n/dictionaries/en.json` and `es.json`:**

### English

```json
"a2hs.tagline": "Install for quick access",
"a2hs.showMe": "Show me how",
"a2hs.stepsTitle": "Add to Home Screen in 4 steps",
"a2hs.step1": "Tap the ⋯ menu in Safari's bottom bar",
"a2hs.step2": "Tap \"Share\"",
"a2hs.step3": "Scroll and tap \"View More\"",
"a2hs.step4": "Tap \"Add to Home Screen\"",
"a2hs.close": "Close"
```

### Spanish

```json
"a2hs.tagline": "Instala para acceso rápido",
"a2hs.showMe": "Cómo hacerlo",
"a2hs.stepsTitle": "Añadir a pantalla de inicio en 4 pasos",
"a2hs.step1": "Toca el menú ⋯ en la barra inferior de Safari",
"a2hs.step2": "Toca \"Compartir\"",
"a2hs.step3": "Desplázate y toca \"Ver más\"",
"a2hs.step4": "Toca \"Añadir a pantalla de inicio\"",
"a2hs.close": "Cerrar"
```

**Unchanged existing keys:** `a2hs.title` ("Add to Home Screen" / "Añadir a pantalla de inicio"), `a2hs.dismiss` ("Got it" / "Entendido").

**Deprecated but not removed:** `a2hs.ios`, `a2hs.android` — stay in the dictionaries as dead keys. YAGNI cleanup.

## Files Touched

**New:**

- `components/club/add-to-homescreen-modal.tsx`
- `public/a2hs/step-1.png`
- `public/a2hs/step-2.png`
- `public/a2hs/step-3.png`
- `public/a2hs/step-4.png`

**Edited:**

- `components/club/add-to-homescreen.tsx` — replace bouncing-arrow block with compact tagline + "Show me how" button, add modal state
- `lib/i18n/dictionaries/en.json` — add 8 new keys
- `lib/i18n/dictionaries/es.json` — add 8 new keys

**Deleted:**

- `homescreen-1.PNG`, `homescreen-2.PNG`, `homescreen-3.PNG`, `homescreen-4.PNG` at repo root — moved into `public/a2hs/`

**Untouched:**

- `app/globals.css` — the `a2hs-bounce` keyframe from the earlier PR becomes unused. Leaving it in place is harmless (a few lines of dead CSS, not worth a follow-up commit). If we want to clean it up, that's a separate unrelated task.
- Manifest and icon route handlers from the earlier PR — this change does not touch PWA install mechanics.

## Testing Plan

Manual only (ClubOS has no automated test framework).

**On the dev server:**

1. `pnpm dev`, open `http://localhost:3000/red-sessions` in Chrome DevTools with iPhone device emulation.
2. Member home loads → banner appears (test mode).
3. Verify compact banner layout: share icon, "Add to Home Screen" title, "Install for quick access" tagline, "Show me how" button, × dismiss.
4. Tap "Show me how" → modal slides up from the bottom.
5. Verify title "Add to Home Screen in 4 steps", four step cards with numbered badges, captions, and screenshots in order.
6. Scroll the modal to confirm step 4 is reachable.
7. Tap backdrop → modal closes.
8. Tap "Show me how" again → modal reopens (banner still visible).
9. Tap close ×  inside the modal → closes the same way.
10. Press Escape → modal closes.
11. Switch language toggle to Spanish → reopen modal, verify captions are translated.
12. Verify on real iPhone Safari on staging after push.
13. Verify the `×` dismiss on the banner still hides the banner (test mode = session-only; prod mode = once-only).

## Out of Scope

- Editing or annotating the screenshots with red circles / arrows / text
- Dark-mode screenshot variants
- Swipe-down-to-dismiss gesture on the modal
- Analytics / funnel tracking ("how many people tapped Show me how")
- Cleaning up the now-unused `a2hs-bounce` CSS keyframe
- Cleaning up the now-unused `a2hs.ios` / `a2hs.android` i18n keys
