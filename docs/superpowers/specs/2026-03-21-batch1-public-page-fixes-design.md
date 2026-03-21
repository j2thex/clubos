# Batch 1: Public Page Quick Fixes

**Date:** 2026-03-21
**Trello Cards:** #78, #80, #85

## Overview

Three small, related changes to the public club page (`app/[clubSlug]/public/page.tsx`): a text update, a new admin toggle, and adding the existing language switcher.

---

## Task #78: Change contact text on invite-only page

**Problem:** The invite-only public page shows "Contact us through:" which is vague. Users need to understand they should contact osocios (the platform) to get their member ID.

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

**Files changed:**
- `supabase/migrations/<timestamp>_add_hide_member_login.sql` — new migration
- `lib/types/database.ts` — add `hide_member_login` to Club type
- `app/[clubSlug]/admin/login-mode-manager.tsx` — sub-checkbox UI
- `app/[clubSlug]/public/page.tsx` — conditional rendering of login form

**Data flow:**
1. Admin checks "Invite only" → sub-checkbox appears: "Hide member login from public page"
2. Admin checks sub-checkbox → server action updates `clubs.hide_member_login = true`
3. Public page fetches `hide_member_login` alongside other club data
4. Login form renders only if `!(club.invite_only && club.hide_member_login)`

---

## Task #85: Language switcher on public page

**Problem:** The public club page has no language toggle. Every other layout (member, staff, admin, landing, platform) already has one.

**Design:**
- Import `LanguageSwitcher` from `lib/i18n/switcher.tsx`
- Place it top-right, above the hero section
- Use `variant="light"` since it overlays the dark hero area
- The public page needs to be wrapped in `LanguageProvider` for the client-side switcher to work (verify if already wrapped)

**Files changed:**
- `app/[clubSlug]/public/page.tsx` — add switcher and ensure provider wrapping

---

## Testing Plan

1. **#78:** Visit any invite-only club's public page in both EN and ES, verify new text appears
2. **#80:**
   - Admin panel: toggle invite-only ON → verify sub-checkbox appears
   - Check sub-checkbox → save → visit public page → login form should be hidden
   - Uncheck invite-only → sub-checkbox disappears, login form reappears
   - Direct login URL still works regardless of toggle
3. **#85:** Visit public page → language switcher visible top-right → click ES → page re-renders in Spanish → click EN → back to English

## Out of Scope

- No changes to the member login page itself (only the public page form)
- No changes to the invite form/social buttons behavior
- No new API routes — uses existing server action pattern
