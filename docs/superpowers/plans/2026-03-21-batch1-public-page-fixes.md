# Batch 1: Public Page Quick Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Three quick fixes to the public club page — update contact text, add admin toggle to hide login on invite-only clubs, and add language switcher.

**Architecture:** All changes touch the public page (`app/[clubSlug]/public/page.tsx`) and related admin components. Task #80 requires a new DB column, migration, server action, and admin UI. Tasks #78 and #85 are purely frontend.

**Tech Stack:** Next.js 16 App Router, Supabase (Postgres), Server Actions, i18n dictionaries (JSON), TypeScript

**Spec:** `docs/superpowers/specs/2026-03-21-batch1-public-page-fixes-design.md`

**Branch:** `feat/batch1-public-page-fixes` (off `develop`)

---

### Task 1: Create feature branch

- [ ] **Step 1: Create branch off develop**

```bash
git checkout develop
git pull origin develop
git checkout -b feat/batch1-public-page-fixes
```

---

### Task 2: Update contact text (#78)

**Files:**
- Modify: `lib/i18n/dictionaries/en.json:350`
- Modify: `lib/i18n/dictionaries/es.json:350`

- [ ] **Step 1: Update English dictionary**

In `lib/i18n/dictionaries/en.json`, change line 350:

```json
"public.contactThrough": "Contact osocios to get your member ID:",
```

- [ ] **Step 2: Update Spanish dictionary**

In `lib/i18n/dictionaries/es.json`, change line 350:

```json
"public.contactThrough": "Contacta osocios para obtener tu ID de socio:",
```

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

Expected: Build succeeds. The key is used in `app/[clubSlug]/public/invite-social-buttons.tsx:97`.

- [ ] **Step 4: Commit**

```bash
git add lib/i18n/dictionaries/en.json lib/i18n/dictionaries/es.json
git commit -m "fix: update contact text to reference osocios platform (#78)"
```

---

### Task 3: Add hide_member_login DB column (#80)

**Files:**
- Create: `supabase/migrations/20260321100000_add_hide_member_login.sql`

- [ ] **Step 1: Create migration**

Create file `supabase/migrations/20260321100000_add_hide_member_login.sql`:

```sql
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS hide_member_login boolean DEFAULT false;
```

- [ ] **Step 2: Update TypeScript types**

In `lib/types/database.ts`, add `hide_member_login` to the clubs type in three places:

Row type (after `invite_only: boolean;` ~line 49):
```typescript
hide_member_login: boolean;
```

Insert type (after `invite_only?: boolean;` ~line 64):
```typescript
hide_member_login?: boolean;
```

Update type (after `invite_only?: boolean;` ~line 79):
```typescript
hide_member_login?: boolean;
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260321100000_add_hide_member_login.sql lib/types/database.ts
git commit -m "feat: add hide_member_login column to clubs table (#80)"
```

---

### Task 4: Add i18n keys for hide member login (#80)

**Files:**
- Modify: `lib/i18n/dictionaries/en.json`
- Modify: `lib/i18n/dictionaries/es.json`

- [ ] **Step 1: Add English key**

Add to `en.json` (near the other `admin.invite*` keys):

```json
"admin.hideMemberLogin": "Hide member login from public page",
"admin.hideMemberLoginDesc": "Members can still log in via the direct login URL",
```

- [ ] **Step 2: Add Spanish key**

Add to `es.json` (same location):

```json
"admin.hideMemberLogin": "Ocultar inicio de sesión en la página pública",
"admin.hideMemberLoginDesc": "Los socios aún pueden iniciar sesión con el enlace directo",
```

- [ ] **Step 3: Commit**

```bash
git add lib/i18n/dictionaries/en.json lib/i18n/dictionaries/es.json
git commit -m "feat: add i18n keys for hide member login toggle (#80)"
```

---

### Task 5: Add server action for hide_member_login (#80)

**Files:**
- Modify: `app/[clubSlug]/admin/actions.ts` (add after `updateInviteOnly` function, ~line 53)

- [ ] **Step 1: Add updateHideMemberLogin action**

Add this function after `updateInviteOnly` in `app/[clubSlug]/admin/actions.ts`:

```typescript
export async function updateHideMemberLogin(
  clubId: string,
  hide: boolean,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("clubs")
    .update({ hide_member_login: hide })
    .eq("id", clubId);

  if (error) return { error: "Failed to update setting" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  revalidatePath(`/${clubSlug}/public`);
  return { ok: true };
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[clubSlug]/admin/actions.ts
git commit -m "feat: add updateHideMemberLogin server action (#80)"
```

---

### Task 6: Update admin UI — LoginModeManager (#80)

**Files:**
- Modify: `app/[clubSlug]/admin/login-mode-manager.tsx` (add prop + sub-checkbox)
- Modify: `app/[clubSlug]/admin/(panel)/settings/page.tsx` (query + prop passing)

- [ ] **Step 1: Add prop and import to LoginModeManager**

In `app/[clubSlug]/admin/login-mode-manager.tsx`:

Add `updateHideMemberLogin` to the import on line 4:

```typescript
import { updateLoginMode, updateInviteOnly, updateInviteMode, saveInviteButtons, updateHideMemberLogin } from "./actions";
```

Add `hideMemberLogin` to the props interface (line 23-37). Update the function signature:

```typescript
export function LoginModeManager({
  loginMode,
  inviteOnly,
  inviteMode,
  inviteButtons,
  hideMemberLogin,
  clubId,
  clubSlug,
}: {
  loginMode: string;
  inviteOnly: boolean;
  inviteMode: string;
  inviteButtons: InviteButton[];
  hideMemberLogin: boolean;
  clubId: string;
  clubSlug: string;
}) {
```

- [ ] **Step 2: Add hide login toggle handler**

Add this function after `handleInviteToggle` (~line 89):

```typescript
function handleHideLoginToggle(checked: boolean) {
  startTransition(async () => {
    await updateHideMemberLogin(clubId, checked, clubSlug);
  });
}
```

- [ ] **Step 3: Add sub-checkbox UI**

In the JSX, inside the `{inviteOnly && (` block (line 204), add the sub-checkbox **before** the invite mode label (before line 206). Insert right after `<div className="bg-gray-50 px-5 py-4 ml-8 space-y-4">`:

```tsx
<label
  className={`flex items-start gap-3 cursor-pointer ${isPending ? "opacity-50 pointer-events-none" : ""}`}
>
  <input
    type="checkbox"
    checked={hideMemberLogin}
    onChange={(e) => handleHideLoginToggle(e.target.checked)}
    className="mt-0.5 rounded border-gray-300 text-gray-800 focus:ring-gray-400"
  />
  <div>
    <p className="text-sm font-medium text-gray-900">{t("admin.hideMemberLogin")}</p>
    <p className="text-xs text-gray-400 mt-0.5">{t("admin.hideMemberLoginDesc")}</p>
  </div>
</label>
```

- [ ] **Step 4: Update settings page query and prop**

In `app/[clubSlug]/admin/(panel)/settings/page.tsx`, add `hide_member_login` to the Supabase select on line 23:

```typescript
.select("id, login_mode, invite_only, invite_mode, hide_member_login, telegram_bot_token, telegram_chat_id, notification_secret")
```

Add `hideMemberLogin` prop to the `<LoginModeManager>` component (after line 72, after `inviteMode`):

```tsx
hideMemberLogin={club.hide_member_login ?? false}
```

- [ ] **Step 5: Verify build**

```bash
pnpm build
```

Expected: Build succeeds with no type errors.

- [ ] **Step 6: Commit**

```bash
git add app/[clubSlug]/admin/login-mode-manager.tsx app/[clubSlug]/admin/(panel)/settings/page.tsx
git commit -m "feat: add hide member login sub-checkbox in admin settings (#80)"
```

---

### Task 7: Hide login form on public page (#80)

**Files:**
- Modify: `app/[clubSlug]/public/page.tsx` (query + conditional render)

- [ ] **Step 1: Add hide_member_login to the Supabase query**

In `app/[clubSlug]/public/page.tsx`, update the select on line 44 to include `hide_member_login`:

```typescript
.select("id, name, invite_only, invite_mode, login_mode, hide_member_login, club_branding(logo_url, cover_url, primary_color, secondary_color, social_instagram, social_whatsapp, social_telegram, social_google_maps, social_website)")
```

- [ ] **Step 2: Wrap login form in conditional**

On lines 191-195, wrap the login form div with a condition:

```tsx
{/* Member Login — inline form */}
{!(club.invite_only && club.hide_member_login) && (
  <div className="bg-white rounded-2xl shadow-lg p-5">
    <p className="text-sm text-gray-500 mb-3 text-center">{localized("Already a member?", "¿Ya eres socio?", locale)}</p>
    <PublicLoginForm loginMode={club.login_mode ?? "code_only"} clubSlug={clubSlug} />
  </div>
)}
```

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add app/[clubSlug]/public/page.tsx
git commit -m "feat: hide login form on public page when admin toggle is on (#80)"
```

---

### Task 8: Add language switcher to public page (#85)

**Files:**
- Modify: `app/[clubSlug]/public/page.tsx` (import + JSX)

- [ ] **Step 1: Add import**

Add to the imports at the top of `app/[clubSlug]/public/page.tsx`:

```typescript
import { LanguageSwitcher } from "@/lib/i18n/switcher";
```

- [ ] **Step 2: Add switcher inside hero div**

Inside the hero `div` (line 140), add the switcher as the first child, positioned absolutely in the top-right:

```tsx
<div
  className="relative px-6 pt-12 pb-16 text-center bg-cover bg-center overflow-hidden"
  style={
    branding?.cover_url
      ? { backgroundImage: `url(${branding.cover_url})` }
      : undefined
  }
>
  {/* Language Switcher */}
  <div className="absolute top-3 right-3 z-20">
    <LanguageSwitcher variant="light" />
  </div>

  {branding?.cover_url && (
```

Note: The `z-20` ensures it sits above the overlay (`z-10` on the content).

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

Expected: Build succeeds. `LanguageSwitcher` is a `"use client"` component — direct import in a Server Component is handled by Next.js automatically.

- [ ] **Step 4: Commit**

```bash
git add app/[clubSlug]/public/page.tsx
git commit -m "feat: add language switcher to public page (#85)"
```

---

### Task 9: Manual verification

- [ ] **Step 1: Start dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Test #78 — contact text**

Visit an invite-only club's public page with social buttons mode (e.g. `http://localhost:3000/think-different-club/public`). Verify the text reads "Contact osocios to get your member ID:" in EN and "Contacta osocios para obtener tu ID de socio:" in ES.

- [ ] **Step 3: Test #80 — hide login toggle**

1. Go to admin settings for an invite-only club
2. Under the invite-only checkbox, verify the "Hide member login from public page" sub-checkbox appears
3. Check it → save → visit the public page → login form should be gone
4. Uncheck it → public page shows login form again
5. Uncheck invite-only entirely → sub-checkbox disappears, login form always visible

- [ ] **Step 4: Test #85 — language switcher**

1. Visit a club's public page
2. EN/ES toggle visible in top-right corner over the hero
3. Click ES → page re-renders in Spanish (footer links, localized content)
4. Click EN → back to English

- [ ] **Step 5: Push branch**

```bash
git push -u origin feat/batch1-public-page-fixes
```
