# A2HS Walkthrough Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current A2HS banner's one-line instructional text with a compact "Show me how" button that opens a bottom-sheet modal walking the member through the four-tap iOS install flow with real Safari screenshots.

**Architecture:** A new client component `AddToHomescreenModal` renders as a bottom-sheet dialog with a scrollable vertical stack of four step cards (number badge + caption + screenshot). The existing `AddToHomescreen` banner becomes compact, owns an `open` state, and renders the modal alongside itself. Four real iPhone screenshots provided by Jeff get resized/compressed and served as static files from `public/a2hs/`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, `lucide-react` icons, existing `useLanguage()` i18n provider. Macos `sips` for image processing (built-in, no new deps).

**Spec:** `docs/superpowers/specs/2026-04-15-a2hs-walkthrough-modal-design.md`

**Testing model:** No automated tests. Verification = `pnpm build` + manual spot-check in Chrome DevTools iPhone emulation → real iPhone on staging → Mikita QA.

**Commit cadence:** One commit per task on `develop`.

---

## File Structure

**New files:**

- `components/club/add-to-homescreen-modal.tsx` — bottom-sheet dialog with the 4-step walkthrough
- `public/a2hs/step-1.jpg` — ⋯ menu in Safari bottom bar
- `public/a2hs/step-2.jpg` — ⋯ popup with "Share" visible
- `public/a2hs/step-3.jpg` — share sheet with "View More"
- `public/a2hs/step-4.jpg` — expanded share sheet with "Add to Home Screen"

**Modified files:**

- `components/club/add-to-homescreen.tsx` — compact layout, "Show me how" button, renders modal
- `lib/i18n/dictionaries/en.json` — 8 new keys
- `lib/i18n/dictionaries/es.json` — 8 new keys

**Deleted files:**

- `homescreen-1.PNG`, `homescreen-2.PNG`, `homescreen-3.PNG`, `homescreen-4.PNG` (repo root — raw screenshots Jeff dropped in for this feature)

**Untouched:**

- `app/globals.css` — `a2hs-bounce` keyframe from the earlier PR becomes dead CSS, YAGNI cleanup
- Manifest + icon routes from the earlier PR — no changes here
- Existing `a2hs.ios` / `a2hs.android` i18n keys — stay in dictionaries as dead keys, YAGNI cleanup

---

## Task 1: Process and move the screenshots

**Files:**
- Create: `public/a2hs/step-1.jpg`, `public/a2hs/step-2.jpg`, `public/a2hs/step-3.jpg`, `public/a2hs/step-4.jpg`
- Delete: `homescreen-1.PNG`, `homescreen-2.PNG`, `homescreen-3.PNG`, `homescreen-4.PNG` (repo root)

**Context:** The raw screenshots are 1206×2622 PNGs, 521 KB–2.5 MB each (~4.5 MB total). That's way too heavy for a banner asset. Resize to 600 px wide (preserves aspect ratio → ~1304 px tall, plenty sharp for ~350 px rendered width on a retina iPhone), convert to JPEG quality 82 for ~80–150 KB per file. Use macOS built-in `sips` — no new dependencies.

- [ ] **Step 1: Create target directory**

Run:
```bash
mkdir -p public/a2hs
```

Expected: directory exists, no error.

- [ ] **Step 2: Resize and convert each screenshot**

Run these four commands:

```bash
sips -Z 600 -s format jpeg -s formatOptions 82 homescreen-1.PNG --out public/a2hs/step-1.jpg
sips -Z 600 -s format jpeg -s formatOptions 82 homescreen-2.PNG --out public/a2hs/step-2.jpg
sips -Z 600 -s format jpeg -s formatOptions 82 homescreen-3.PNG --out public/a2hs/step-3.jpg
sips -Z 600 -s format jpeg -s formatOptions 82 homescreen-4.PNG --out public/a2hs/step-4.jpg
```

Expected: each command reports the new dimensions. The `-Z 600` flag resamples to fit a 600 px bounding box; `-s format jpeg` sets JPEG output; `-s formatOptions 82` sets quality to 82/100.

- [ ] **Step 3: Verify output dimensions and file sizes**

Run:
```bash
ls -la public/a2hs/
file public/a2hs/step-*.jpg
```

Expected: four files present, each reported as `JPEG image data`, dimensions roughly `600 x 1304` (or similar — the source is 1206×2622 so the resize preserves aspect ratio), each file under 200 KB. If any file exceeds 200 KB, re-run `sips` with `formatOptions 75` for that one specifically.

- [ ] **Step 4: Visually verify each resized screenshot**

Open each of the four files in Preview:

```bash
open public/a2hs/step-1.jpg public/a2hs/step-2.jpg public/a2hs/step-3.jpg public/a2hs/step-4.jpg
```

Check that the UI elements described by the captions are clearly visible:
- `step-1.jpg`: `⋯` menu button visible in Safari's bottom bar
- `step-2.jpg`: popup menu open, "Share" row visible
- `step-3.jpg`: iOS share sheet open, "View More" button visible (bottom-right of icon grid)
- `step-4.jpg`: expanded share sheet, "Add to Home Screen" row visible

If any screenshot is too small to read at 600 px wide, re-run that one at 800 px: `sips -Z 800 ...` and re-check the size budget.

- [ ] **Step 5: Delete the raw screenshots**

Run:
```bash
rm homescreen-1.PNG homescreen-2.PNG homescreen-3.PNG homescreen-4.PNG
```

Expected: no output, files gone from repo root.

- [ ] **Step 6: Commit**

```bash
git add public/a2hs/step-1.jpg public/a2hs/step-2.jpg public/a2hs/step-3.jpg public/a2hs/step-4.jpg
git add -u homescreen-1.PNG homescreen-2.PNG homescreen-3.PNG homescreen-4.PNG
git commit -m "feat(a2hs): add resized iOS install walkthrough screenshots"
```

Note: `git add -u` on the deleted paths records the deletions without staging other modifications.

---

## Task 2: Add new i18n keys

**Files:**
- Modify: `lib/i18n/dictionaries/en.json`
- Modify: `lib/i18n/dictionaries/es.json`

**Context:** Both dictionaries are flat JSON objects. The existing a2hs keys sit at lines 248–251 followed by a blank line. Insert new keys after `a2hs.dismiss` (line 251) and before the blank line. Keep `a2hs.ios` and `a2hs.android` untouched — they become dead keys, YAGNI cleanup.

- [ ] **Step 1: Add 8 new keys to `lib/i18n/dictionaries/en.json`**

Use the Edit tool. Find:

```json
  "a2hs.title": "Add to Home Screen",
  "a2hs.ios": "Tap the Share button, then \"Add to Home Screen\" for quick access.",
  "a2hs.android": "Tap the menu (⋯), then \"Add to Home Screen\" for quick access.",
  "a2hs.dismiss": "Got it",
```

Replace with:

```json
  "a2hs.title": "Add to Home Screen",
  "a2hs.ios": "Tap the Share button, then \"Add to Home Screen\" for quick access.",
  "a2hs.android": "Tap the menu (⋯), then \"Add to Home Screen\" for quick access.",
  "a2hs.dismiss": "Got it",
  "a2hs.tagline": "Install for quick access",
  "a2hs.showMe": "Show me how",
  "a2hs.stepsTitle": "Add to Home Screen in 4 steps",
  "a2hs.step1": "Tap the ⋯ menu in Safari's bottom bar",
  "a2hs.step2": "Tap \"Share\"",
  "a2hs.step3": "Scroll and tap \"View More\"",
  "a2hs.step4": "Tap \"Add to Home Screen\"",
  "a2hs.close": "Close",
```

- [ ] **Step 2: Add 8 new keys to `lib/i18n/dictionaries/es.json`**

Find:

```json
  "a2hs.title": "Añadir a pantalla de inicio",
  "a2hs.ios": "Toca el botón Compartir, luego \"Añadir a pantalla de inicio\" para acceso rápido.",
  "a2hs.android": "Toca el menú (⋯), luego \"Añadir a pantalla de inicio\" para acceso rápido.",
  "a2hs.dismiss": "Entendido",
```

Replace with:

```json
  "a2hs.title": "Añadir a pantalla de inicio",
  "a2hs.ios": "Toca el botón Compartir, luego \"Añadir a pantalla de inicio\" para acceso rápido.",
  "a2hs.android": "Toca el menú (⋯), luego \"Añadir a pantalla de inicio\" para acceso rápido.",
  "a2hs.dismiss": "Entendido",
  "a2hs.tagline": "Instala para acceso rápido",
  "a2hs.showMe": "Cómo hacerlo",
  "a2hs.stepsTitle": "Añadir a pantalla de inicio en 4 pasos",
  "a2hs.step1": "Toca el menú ⋯ en la barra inferior de Safari",
  "a2hs.step2": "Toca \"Compartir\"",
  "a2hs.step3": "Desplázate y toca \"Ver más\"",
  "a2hs.step4": "Toca \"Añadir a pantalla de inicio\"",
  "a2hs.close": "Cerrar",
```

- [ ] **Step 3: Validate JSON**

Run:
```bash
node -e "JSON.parse(require('fs').readFileSync('lib/i18n/dictionaries/en.json', 'utf8')); console.log('en.json ok');"
node -e "JSON.parse(require('fs').readFileSync('lib/i18n/dictionaries/es.json', 'utf8')); console.log('es.json ok');"
```

Expected: both print `ok`. If either errors, fix the trailing-comma or quote issue and re-run.

- [ ] **Step 4: Commit**

```bash
git add lib/i18n/dictionaries/en.json lib/i18n/dictionaries/es.json
git commit -m "feat(a2hs): add i18n keys for 4-step walkthrough modal"
```

---

## Task 3: Create the walkthrough modal component

**Files:**
- Create: `components/club/add-to-homescreen-modal.tsx`

**Context:** A bottom-sheet dialog with backdrop, drag handle (decorative), title, close button, and 4 scrollable step cards. Body scroll lock while open. Mount/unmount animated via CSS transitions — the component uses a `mounted` ref pattern so it can play the slide-out animation before unmounting. Focus management: focus the close button on open, restore on close.

**Important:** This component is a client component (`"use client"`). It receives `open: boolean` and `onClose: () => void` from the parent banner. It renders nothing when `open` is false AND the close animation has finished.

- [ ] **Step 1: Create the file**

Write this exact content to `components/club/add-to-homescreen-modal.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/provider";

const STEPS = [
  { n: 1, imgKey: "/a2hs/step-1.jpg", captionKey: "a2hs.step1" },
  { n: 2, imgKey: "/a2hs/step-2.jpg", captionKey: "a2hs.step2" },
  { n: 3, imgKey: "/a2hs/step-3.jpg", captionKey: "a2hs.step3" },
  { n: 4, imgKey: "/a2hs/step-4.jpg", captionKey: "a2hs.step4" },
] as const;

export function AddToHomescreenModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const titleId = "a2hs-modal-title";

  // Mount/animate in when open flips true; animate out then unmount when open flips false.
  useEffect(() => {
    if (open) {
      setVisible(true);
      // Next frame: trigger the slide-in by setting animating=true.
      const raf = requestAnimationFrame(() => setAnimating(true));
      return () => cancelAnimationFrame(raf);
    }
    setAnimating(false);
    const timer = setTimeout(() => setVisible(false), 300);
    return () => clearTimeout(timer);
  }, [open]);

  // Lock body scroll while modal is visible.
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  // Focus close button on open; Escape key closes.
  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label={t("a2hs.close")}
        onClick={onClose}
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          animating ? "opacity-50" : "opacity-0"
        }`}
      />

      {/* Sheet */}
      <div
        className={`relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col transition-transform duration-300 ease-out ${
          animating ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Drag handle (decorative) */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-2 pb-3">
          <h2 id={titleId} className="text-base font-semibold text-gray-900">
            {t("a2hs.stepsTitle")}
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label={t("a2hs.close")}
            className="shrink-0 -mt-1 -mr-1 p-1 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable step list */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="rounded-2xl bg-gray-50 p-4 flex items-start gap-3"
            >
              <div className="shrink-0 w-7 h-7 rounded-full bg-[color:var(--club-primary,#16a34a)] text-white font-bold flex items-center justify-center text-sm">
                {step.n}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  {t(step.captionKey)}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={step.imgKey}
                  alt=""
                  className="w-full rounded-xl border border-gray-200"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom fade affordance */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build**

Run: `pnpm build`

Expected: clean build with zero new TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add components/club/add-to-homescreen-modal.tsx
git commit -m "feat(a2hs): add walkthrough modal component"
```

---

## Task 4: Update the banner to be compact and wire the modal

**Files:**
- Modify: `components/club/add-to-homescreen.tsx`

**Context:** Replace the current layout. Drop the bouncing arrow + `a2hs.ios` line. Add `a2hs.tagline` line, a "Show me how" button, and render the modal. The banner component now owns `modalOpen` state.

**Current full file content** (for reference, do not skip — Edit/Write tool needs the exact current state):

```tsx
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

- [ ] **Step 1: Replace the file content**

Use the Write tool (after reading the file to satisfy preconditions) to replace the full file with this exact content:

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

- [ ] **Step 2: Build**

Run: `pnpm build`

Expected: clean build, no new TypeScript errors. Specifically check that the new `X` icon import from `lucide-react` and the `AddToHomescreenModal` import both resolve.

- [ ] **Step 3: Commit**

```bash
git add components/club/add-to-homescreen.tsx
git commit -m "feat(a2hs): compact banner with 'Show me how' button + modal trigger"
```

---

## Task 5: End-to-end verification, push, QA handoff

**Files:** none modified in this task — verification and handoff only.

- [ ] **Step 1: Start dev server**

Run: `pnpm dev` in one terminal.

Expected: `Ready in <ms>` on port 3000.

- [ ] **Step 2: Test the banner and modal in iPhone emulation**

Open Chrome, navigate to `http://localhost:3000/red-sessions` with DevTools open and device toolbar set to iPhone 14 Pro (or any iPhone profile). Log in if prompted.

Verify on the member home page:

1. Banner visible — compact layout: share icon, "Add to Home Screen" title, "Install for quick access" tagline, "Show me how" button, × icon dismiss.
2. Click "Show me how" → modal slides up from the bottom with backdrop.
3. Modal title: "Add to Home Screen in 4 steps".
4. Four step cards visible, each with a green numbered badge (1, 2, 3, 4), caption text, and a screenshot image rendered inside a rounded border.
5. Scroll the modal — step 4 reaches the bottom, bottom fade visible.
6. Click the backdrop → modal slides down and unmounts.
7. Click "Show me how" again → modal reopens. Banner still visible.
8. Press Escape → modal closes.
9. Click the × inside the modal → closes the same way.
10. Click the × on the banner → banner disappears. No modal open state leaks.
11. Reload → banner reappears (test mode).

- [ ] **Step 3: Test in Spanish**

In DevTools → Application → Cookies, set `clubos-lang=es`, reload. Open the modal. Verify:

- Title: "Añadir a pantalla de inicio en 4 pasos"
- Captions in Spanish (step 1: "Toca el menú ⋯ ...", step 4: "Toca \"Añadir a pantalla de inicio\"")
- Banner tagline: "Instala para acceso rápido"
- "Show me how" button: "Cómo hacerlo"

- [ ] **Step 4: Test with a non-iOS user agent**

In DevTools, switch device to "Responsive" (desktop UA). Reload the page. Verify the banner does NOT render (it's iOS-only).

- [ ] **Step 5: Stop the dev server and do a final production build**

Stop `pnpm dev` (Ctrl+C). Run:

```bash
pnpm build
```

Expected: clean production build.

- [ ] **Step 6: Push to develop**

```bash
git push origin develop
```

Expected: pushes all new commits. Vercel auto-deploys staging preview.

- [ ] **Step 7: Comment on the existing Trello QA card**

The card is `69df7384255654ea73f08e0c` ("save to homescreen on ios"), already in the QA column from the earlier push.

Run:

```bash
trello comment 69df7384255654ea73f08e0c "@mikitatrayan update: banner now has a 'Show me how' button that opens a 4-step visual walkthrough with real iPhone screenshots. Test on real iPhone Safari staging.osocios.club: open any club, log in, verify compact banner → tap Show me how → verify 4 screenshots + captions match the actual Safari install flow → tap Add to Home Screen on the real share sheet and verify the club icon installs correctly (still testing the earlier fix too)."
```

- [ ] **Step 8: Done**

No further action until Mikita reports back. If he finds issues, fix on `develop` directly (no feature branch needed per CLAUDE.md workflow).

---

## Self-Review Notes

**Spec coverage check:**

- ✅ Banner compact layout (title + tagline + "Show me how" + dismiss) → Task 4
- ✅ Modal bottom-sheet with 4 step cards → Task 3
- ✅ Real iPhone screenshots moved to `public/a2hs/step-N.jpg` → Task 1
- ✅ 8 new i18n keys (EN + ES) → Task 2
- ✅ Focus management (focus close on open, return on close) → Task 3, Step 1 (`closeBtnRef`)
- ✅ Body scroll lock while open → Task 3, Step 1 (scroll-lock useEffect)
- ✅ Escape key closes → Task 3, Step 1 (keydown useEffect)
- ✅ Backdrop tap closes → Task 3, Step 1 (backdrop button element)
- ✅ Mount/unmount animations → Task 3, Step 1 (animating state + 300 ms timer)
- ✅ Decorative drag handle → Task 3, Step 1
- ✅ Scroll affordance (bottom fade) → Task 3, Step 1
- ✅ `role="dialog"` + `aria-modal="true"` + `aria-labelledby` → Task 3, Step 1
- ✅ Removed bouncing arrow + `a2hs.ios` line → Task 4, Step 1
- ✅ Raw screenshots deleted from repo root → Task 1, Step 5
- ✅ End-to-end manual verification including Spanish and non-iOS UA → Task 5
- ✅ Push and QA handoff → Task 5

**Discovered during planning:**

- Raw screenshots are 1206×2622 PNGs, 521 KB–2.5 MB each. Need to resize + convert to JPEG to stay under a reasonable asset budget. Resolved: `sips -Z 600 -s format jpeg -s formatOptions 82` (macOS built-in).
- Asset file extension changed from `.png` (in spec) to `.jpg` (in plan) because JPEG compresses photographic Safari screenshots much better than PNG. Spec reference paths stay readable; the plan is authoritative on the file extension.
- i18n dictionaries have `a2hs.ios` and `a2hs.android` existing keys. Plan keeps them (dead keys, YAGNI cleanup).

**Type/identifier consistency:**

- `AddToHomescreenModal` exported from `components/club/add-to-homescreen-modal.tsx`, imported in Task 4. ✓
- Props `open: boolean` and `onClose: () => void` match between Task 3 definition and Task 4 usage. ✓
- Image paths `/a2hs/step-1.jpg` through `/a2hs/step-4.jpg` match between Task 1 (asset creation) and Task 3 (STEPS const). ✓
- i18n keys `a2hs.tagline`, `a2hs.showMe`, `a2hs.stepsTitle`, `a2hs.step1`–`a2hs.step4`, `a2hs.close` added in Task 2 and used in Tasks 3 and 4. ✓

**Out of scope (explicit, not in any task):**

- Red-circle annotation overlays on the screenshots
- Dark-mode screenshot variants
- Swipe-down-to-dismiss gesture
- Analytics tracking
- Cleanup of dead `a2hs-bounce` CSS keyframe
- Cleanup of dead `a2hs.ios` / `a2hs.android` i18n keys
- Automated tests (repo has no test framework)
