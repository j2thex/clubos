# Batch 3: Referral Quest (#83)

**Date:** 2026-03-21
**Trello Card:** #83

## Overview

Connect the existing `referral` quest type to a member-facing share flow and auto-completion logic. When a quest has `quest_type === 'referral'`, the member portal shows a share button instead of "Mark Done". The quest auto-completes when staff creates a new member whose `referred_by` matches the referrer's code.

No new tables or columns needed — builds entirely on existing infrastructure.

---

## Member Portal — Share UI

**File:** `app/[clubSlug]/(member)/quest-list.tsx`

**New props required:** `QuestList` currently receives `memberId`, `clubSlug`, `locale`. Must add `memberCode: string` and `clubName: string` — both already available in the parent page component (`app/[clubSlug]/(member)/page.tsx`).

When `quest_type === 'referral'`:
- Replace "Mark Done" button with "Invite a Friend" button (club-primary styled)
- On tap: use `navigator.share({ url, title, text })` with fallback to `navigator.clipboard.writeText(url)` + toast "Link copied!"
- Share URL: `https://osocios.club/{clubSlug}/public?ref={memberCode}`
- Share text: localized "Join me at {clubName}!" / "¡Únete a {clubName}!"
- If quest is already done, show existing completion badges as normal
- If quest is `multi_use`, member can still share again after completion

The quest card keeps its existing icon/title/description/link/reward display. Only the action button changes.

**Security note:** Member codes are already semi-public (used in QR codes, printed on cards, shared verbally). Exposing them in a referral URL is acceptable and consistent with the existing auth model where member login is code-only.

---

## Public Page — `?ref=` param handling

**File:** `app/[clubSlug]/public/page.tsx` + `app/[clubSlug]/public/invite-form.tsx`

The public page function signature must be updated to accept `searchParams`:
```typescript
export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<{ ref?: string }>;
})
```

When `searchParams.ref` is present:

### Case 1: Club has invite form (invite_only + invite_mode === 'form')
- Show banner above invite form: "You were invited by a member!" / "¡Un socio te ha invitado!"
- Pass `referrerCode` prop to `InviteForm` (optional prop: `referrerCode?: string`)
- InviteForm appends "Referred by: {code}" to the message when submitting
- The `requestInvite` action in `app/[clubSlug]/public/actions.ts` does not need changes — the referrer info flows through the existing `message` field

### Case 2: Club has NO invite form (not invite-only, or social mode)
- Show a small banner in the content area: "Mention referral code **{ref}** when you sign up!" / "¡Menciona el código de referencia **{ref}** al registrarte!"
- No form, no interaction — just informational

### Case 3: No `?ref=` param
- No change, public page renders as normal

---

## Auto-completion — `createMember` hook

**File:** `app/[clubSlug]/staff/members/actions.ts`

In the existing `createMember()` function, after creating the member AND after the existing premium referral reward logic, if `referred_by` is set:

1. Look up the referrer member by `member_code` in the same club
2. Find all active quests with `quest_type = 'referral'` for that club
3. For each referral quest:
   - If `multi_use`: insert into `member_quests` with `status: 'verified'`, `referral_member_code: newMemberCode`, `verified_by: staffMemberId` (the staff member creating the new member), award spins
   - If NOT `multi_use`: check if already completed — if not, insert and award spins
4. **Spin awarding:** Use Postgres increment pattern (`spin_balance + N` in the update) rather than read-then-write, to avoid race conditions with the premium referral reward that may have just run
5. **Badge awarding:** If the referral quest has a `badge_id`, also upsert into `member_badges` (same pattern as existing `completeQuest`)
6. **Activity logging:** Log `quest_auto_completed` activity entry for each auto-completed quest
7. **Revalidation:** Add `revalidatePath` for the member's dashboard after quest completion

**`referral_member_code` clarification:** This column stores the **new member's code** (the person who was referred), not the referrer's code. The referrer is identified by `member_quests.member_id`.

---

## i18n keys to add (EN / ES)

- `quests.inviteFriend`: "Invite a Friend" / "Invitar a un amigo"
- `quests.linkCopied`: "Link copied!" / "¡Enlace copiado!"
- `quests.shareText`: "Join me at {clubName}!" / "¡Únete a {clubName}!"
- `public.invitedByMember`: "You were invited by a member!" / "¡Un socio te ha invitado!"
- `public.mentionReferralCode`: "Mention referral code {code} when you sign up!" / "¡Menciona el código de referencia {code} al registrarte!"

---

## Files changed

- `app/[clubSlug]/(member)/quest-list.tsx` — share button UI for referral quests, new `memberCode` + `clubName` props
- `app/[clubSlug]/(member)/page.tsx` — pass `memberCode` and `clubName` to QuestList
- `app/[clubSlug]/public/page.tsx` — accept `searchParams`, read `ref`, show contextual banner
- `app/[clubSlug]/public/invite-form.tsx` — accept optional `referrerCode` prop, append to message
- `app/[clubSlug]/staff/members/actions.ts` — auto-complete referral quests in `createMember`
- `lib/i18n/dictionaries/en.json` + `es.json` — new keys

## No new tables, no new columns

Uses existing: `quests.quest_type: 'referral'`, `member_quests.referral_member_code`, `members.referred_by`, `invite_requests` table.

---

## Testing Plan

1. **Admin setup:** Create a quest with `quest_type: 'referral'` and some reward spins
2. **Member share:** Log in as member → quest list shows "Invite a Friend" button instead of "Mark Done"
3. **Share flow:** Tap button → native share dialog (mobile) or "Link copied!" toast (desktop)
4. **Verify URL:** Shared URL is `/{clubSlug}/public?ref={memberCode}`
5. **Public page with ref (invite-only club):** Visit URL → "Invited by a member!" banner above invite form
6. **Public page with ref (non-invite club):** Visit URL → "Mention referral code {code} when you sign up!" banner
7. **Public page without ref:** No banner, normal page
8. **Auto-completion:** Staff creates new member with `referred_by` = referrer's code → referral quest auto-completes for the referrer, spins awarded
9. **Multi-use:** If quest is multi_use, referrer can earn again for each new referral
10. **Single-use:** If quest is NOT multi_use, second referral does not re-complete
11. **Badge:** If referral quest has a badge_id, badge is awarded on auto-completion
12. **Test in ES:** All new strings translate properly

## Out of Scope

- Tracking click-through analytics on referral links
- Referral-specific admin dashboard (existing referral tree page covers this)
- Automatic member creation from referral links (staff always creates members manually)
- Adding a dedicated `referred_by` column to `invite_requests` (referrer info flows through `message` field for now)
