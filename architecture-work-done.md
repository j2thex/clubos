# ClubOS Architecture Reference

## Manual Validity Date Assignment (Staff)

Staff can set an exact expiration date on members who don't have one yet, bypassing the period-based calculation. This is useful when onboarding clubs with existing members who have known expiration dates. Members with a manually-set date (no period) show an "edit" link to change the date inline.

**Key files:**
- `app/[clubSlug]/staff/members/actions.ts` — `setManualValidTill` action sets `valid_till` directly without a membership period
- `app/[clubSlug]/staff/members/member-row.tsx` — date picker UI for both new assignment and editing existing manual dates

## Role Visibility

Roles are managed by admin (creation) and assigned by staff. Members cannot see or change their own role — the role selector was removed from the member profile page.

**Key files:**
- `app/[clubSlug]/staff/members/member-row.tsx` — staff assigns roles via dropdown per member row
- `app/[clubSlug]/admin/` — admin creates/manages roles
- `app/[clubSlug]/(member)/profile/page.tsx` — role section removed, no role data fetched

## Event Spin Rewards Allow Zero

Events can be created with 0 spins reward (matching quest behavior). The `min` attribute on the spins input was changed from `1` to `0` on both create and edit forms. Server-side already accepted 0.

**Key files:**
- `app/[clubSlug]/admin/event-manager.tsx` — create and edit forms with `min="0"` on spins input

## Quest Link Visibility After Completion

Quest links (URLs/emails) remain visible after a quest is marked done. Previously the link was hidden when `done && !isMultiUse`. Now the link renders unconditionally whenever `q.link` exists.

**Key files:**
- `app/[clubSlug]/(member)/quest-list.tsx` — link rendering on line 84, no longer gated by completion state

## Admin/Staff Layout Cover Overlap

**Request:** Fix dark header/cover area bleeding into page content on admin and staff layouts.

**Changes:** In both admin and staff layout files, the content wrapper was split into two divs. The outer div gets `bg-gray-50 rounded-t-3xl pt-6` (only in the no-cover-image case) to create a solid gray sheet that overlaps the dark header. The inner div retains `px-4 pb-10 max-w-2xl mx-auto space-y-6`.

**How it works:** The header uses `pb-20` padding and the content uses `-mt-12` negative margin to create an overlap effect. Previously this left transparent gaps where the dark gradient showed through. Now the content wrapper has a `bg-gray-50 rounded-t-3xl` background that covers the overlap zone. When a cover image is set, the content just uses `mt-4` with no special background.

**Key files:**
- `app/[clubSlug]/admin/(panel)/layout.tsx` — admin layout with cover header and content wrapper
- `app/[clubSlug]/staff/(console)/layout.tsx` — staff layout, same pattern

## Quest Reward Spins Allow Zero

**Request:** Allow admin to create quests with 0 spins reward.

**Changes:** In `actions.ts`, changed `Number(formData.get("reward_spins")) || 1` to a null-safe parse that preserves 0 (using ternary check for null/empty). Changed validation from `rewardSpins < 1` to `rewardSpins < 0`. Applied to all three functions that handle quest spins: `addQuest`, `updateQuest`, and a third quest-related function. In `quest-manager.tsx`, changed `min="1"` to `min="0"` on both add and edit form inputs.

**How it works:** The `|| 1` pattern coerced 0 to 1 because 0 is falsy. Now uses explicit null/empty check: `rawSpins !== null && rawSpins !== "" ? Number(rawSpins) : 1`. Server rejects negative values but allows 0. Client input allows 0 via `min="0"`.

**Key files:**
- `app/[clubSlug]/admin/actions.ts` — server actions `addQuest`, `updateQuest` with reward_spins parsing and validation
- `app/[clubSlug]/admin/quest-manager.tsx` — client form with spins input fields

## Mobile Viewport and Horizontal Scroll Fix

**Request:** Fix admin panel overflowing horizontally on mobile Safari — content wider than screen, nav icons cut off.

**Changes:** Added `export const viewport: Viewport` to root layout with `width: "device-width", initialScale: 1, maximumScale: 1`. Added `overflow-x-hidden` to `html, body` in `globals.css`. Reduced admin nav item padding from `px-3` to `px-1.5`. Reduced PeopleManager card internal padding from `px-5` to `px-4` and row gap from `gap-4` to `gap-3`.

**How it works:** The missing viewport meta tag caused mobile Safari to render at ~980px default width then scale down. The `Viewport` export in Next.js 14+ generates the proper `<meta name="viewport">` tag. Global `overflow-x-hidden` on html/body prevents any remaining horizontal scroll. Tighter nav padding fits 5 icons on narrow screens.

**Key files:**
- `app/layout.tsx` — root layout with `viewport` export (width, initialScale, maximumScale)
- `app/globals.css` — global `overflow-x-hidden` on `html, body`
- `components/club/admin-nav.tsx` — bottom nav with 5 items, `px-1.5` padding
- `app/[clubSlug]/admin/people-manager.tsx` — member management card with `px-4` padding
