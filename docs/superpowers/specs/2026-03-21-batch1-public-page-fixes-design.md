# Batch 1: Public Page Quick Fixes

**Date:** 2026-03-21
**Trello Cards:** #78, #80, #85

## Overview

Three small, related changes to the public club page (`app/[clubSlug]/public/page.tsx`): a text update, a new admin toggle, and adding the existing language switcher.

---

## Task #78: Change contact text on invite-only page

**Problem:** The invite-only public page shows "Contact us through:" which is vague. Users need to understand they should contact osocios (the platform) to get their member ID.

**Where the text appears:** The `public.contactThrough` key is rendered inside the `InviteSocialButtons` client component (`app/[clubSlug]/public/invite-social-buttons.tsx`), which is embedded in the public page when `invite_mode === "social"`.

**Note:** "osocios" is the platform brand, intentionally used here — osocios handles member onboarding on behalf of clubs as part of the monetization model.

**Change:**
- `en.json` key `public.contactThrough`: `"Contact us through:"` → `"Contact osocios to get your member ID:"`
- `es.json` key `public.contactThrough`: `"Contáctanos por:"` → `"Contacta osocios para obtener tu ID de socio:"`

**Files changed:** `lib/i18n/dictionaries/en.json`, `lib/i18n/dictionaries/es.json`

---

## Task #80: Hide member login on invite-only clubs

**Problem:** When a club is invite-only, the member login form still appears on the public page. Admins need the option to hide it.

**Design:**
- New column `hide_member_login boolean DEFAULT false` on the `clubs` table
- In admin `LoginModeManager`, when `invite_only` is checked, show a sub-checkbox: "Hide member login from public page"
- On the public page, hide the login form when both `invite_only` AND `hide_member_login` are true
- Existing members who know the direct login URL can still access it — this only hides the form from the public page

**Reset behavior:** When `invite_only` is unchecked, `hide_member_login` is preserved in the DB but has no effect (the public page condition requires both flags). This avoids ghost state surprises — if admin re-enables invite-only, they'll see the sub-checkbox still checked and can uncheck it if desired. The sub-checkbox is only visible when invite-only is ON, so the preserved value is transparent.

**Files changed:**
- `supabase/migrations/<timestamp>_add_hide_member_login.sql` — new migration
- `lib/types/database.ts` — add `hide_member_login` to Club type
- `app/[clubSlug]/admin/login-mode-manager.tsx` — sub-checkbox UI, new prop `hideMemberLogin`
- `app/[clubSlug]/admin/(panel)/settings/page.tsx` — add `hide_member_login` to Supabase query, pass as prop to LoginModeManager
- `app/[clubSlug]/admin/actions.ts` — extend `updateInviteOnly` action or add new `updateHideMemberLogin` action
- `app/[clubSlug]/public/page.tsx` — add `hide_member_login` to Supabase select, conditional rendering of login form

**i18n keys to add:**
- `admin.hideMemberLogin`: `"Hide member login from public page"` / `"Ocultar inicio de sesión de socio en la página pública"`

**Data flow:**
1. Admin checks "Invite only" → sub-checkbox appears: "Hide member login from public page"
2. Admin checks sub-checkbox → server action updates `clubs.hide_member_login = true`
3. Public page fetches `hide_member_login` alongside other club data (added to select)
4. Login form renders only if `!(club.invite_only && club.hide_member_login)`

---

## Task #85: Language switcher on public page

**Problem:** The public club page has no language toggle. Every other layout (member, staff, admin, landing, platform) already has one.

**Design:**
- Import `LanguageSwitcher` from `lib/i18n/switcher.tsx` (already a `"use client"` component — direct import works across the server/client boundary)
- Place it inside the hero `div`, positioned absolutely in the top-right corner — this overlays the dark hero background consistently with the cover image
- Use `variant="light"` since it sits over the dark hero area
- `LanguageProvider` is already present in the root layout (`app/layout.tsx`), so no additional wrapping is needed

**Files changed:**
- `app/[clubSlug]/public/page.tsx` — add switcher inside hero div with absolute positioning

**Note:** The public page has some hardcoded English strings (section headers like "Upcoming Events", "Quests", etc.) that are not yet localized. Adding the language switcher will make these more visible. This is a known limitation — localizing all public page strings is out of scope for this batch but should be a follow-up task.

---

## Testing Plan

1. **#78:** Visit any invite-only club's public page (with social buttons mode) in both EN and ES, verify new text appears in `InviteSocialButtons`
2. **#80:**
   - Admin panel: toggle invite-only ON → verify sub-checkbox appears
   - Check sub-checkbox → save → visit public page → login form should be hidden
   - Uncheck invite-only → sub-checkbox disappears, login form reappears on public page
   - Re-enable invite-only → sub-checkbox reappears with its previous state
   - Direct login URL (`/[clubSlug]/login`) still works regardless of toggle
3. **#85:** Visit public page → language switcher visible top-right over hero → click ES → page re-renders in Spanish → click EN → back to English

## Out of Scope

- No changes to the member login page itself (only the public page form)
- No changes to the invite form/social buttons behavior
- No new API routes — uses existing server action pattern
- Localizing hardcoded English strings on the public page (follow-up task)
