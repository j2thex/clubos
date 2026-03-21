# Batch 3: Referral Quest — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the existing `referral` quest type to a member-facing share flow and auto-completion when staff creates a referred member.

**Architecture:** Three independent changes: (1) share button UI on referral quests in the member portal, (2) `?ref=` param handling on the public page with contextual banners, (3) auto-complete referral quests + award spins in the `createMember` staff action. No new tables or columns.

**Tech Stack:** Next.js 16 App Router, Supabase, Server Actions, navigator.share API, i18n dictionaries

**Spec:** `docs/superpowers/specs/2026-03-21-batch3-referral-quest-design.md`

**Branch:** `feat/batch3-referral-quest` (off `develop`)

---

### Task 1: Create feature branch

- [ ] **Step 1: Create branch off develop**

```bash
git checkout develop
git pull origin develop
git checkout -b feat/batch3-referral-quest
```

---

### Task 2: Add i18n keys

**Files:**
- Modify: `lib/i18n/dictionaries/en.json`
- Modify: `lib/i18n/dictionaries/es.json`

- [ ] **Step 1: Add English keys**

Add near other `quests.*` keys in `en.json`:
```json
"quests.inviteFriend": "Invite a Friend",
"quests.linkCopied": "Link copied!",
"quests.shareText": "Join me at {clubName}!"
```

Add near other `public.*` keys:
```json
"public.invitedByMember": "You were invited by a member!",
"public.mentionReferralCode": "Mention referral code {code} when you sign up!"
```

- [ ] **Step 2: Add Spanish keys**

Same locations in `es.json`:
```json
"quests.inviteFriend": "Invitar a un amigo",
"quests.linkCopied": "¡Enlace copiado!",
"quests.shareText": "¡Únete a {clubName}!"
```

```json
"public.invitedByMember": "¡Un socio te ha invitado!",
"public.mentionReferralCode": "¡Menciona el código de referencia {code} al registrarte!"
```

- [ ] **Step 3: Commit**

```bash
git add lib/i18n/dictionaries/en.json lib/i18n/dictionaries/es.json
git commit -m "feat: add i18n keys for referral quest (#83)"
```

---

### Task 3: Add share button to referral quests in member portal

**Files:**
- Modify: `app/[clubSlug]/(member)/quest-list.tsx` (lines 26-39 props, lines 160-191 action button area)
- Modify: `app/[clubSlug]/(member)/page.tsx` (lines 185-192 QuestList usage)

- [ ] **Step 1: Add memberCode and clubName props to QuestList**

In `app/[clubSlug]/(member)/quest-list.tsx`, update the function signature (lines 26-40). Add `memberCode` and `clubName`:

```typescript
export function QuestList({
  quests,
  completionCounts,
  pendingQuestIds,
  memberId,
  memberCode,
  clubName,
  clubSlug,
  locale,
}: {
  quests: Quest[];
  completionCounts: Record<string, number>;
  pendingQuestIds: string[];
  memberId: string;
  memberCode: string;
  clubName: string;
  clubSlug: string;
  locale: Locale;
}) {
```

- [ ] **Step 2: Add share handler and toast state**

After the existing `const { t } = useLanguage();` (line 45), add:

```typescript
  const [copiedToast, setCopiedToast] = useState(false);

  async function handleShare() {
    const shareUrl = `${window.location.origin}/${clubSlug}/public?ref=${memberCode}`;
    const shareText = t("quests.shareText", { clubName });

    if (navigator.share) {
      try {
        await navigator.share({ url: shareUrl, title: clubName, text: shareText });
      } catch {
        // User cancelled share dialog — no action needed
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    }
  }
```

- [ ] **Step 3: Add referral quest button in the render**

In the action button area (lines 160-191), the current logic is:

```tsx
{done && !isMultiUse ? (
  <span ...>Done</span>
) : isPendingQuest ? (
  ...pending badges...
) : (
  ...mark done button...
)}
```

Add a check for `quest_type === 'referral'` at the beginning of this block. Replace lines 160-191 with:

```tsx
              <div className="shrink-0 flex flex-col items-end gap-1">
                {/* Completion badges */}
                {done && !isMultiUse && qType !== "referral" && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full club-tint-bg club-tint-text">
                    {t("quest.done")}
                  </span>
                )}
                {isPendingQuest && (
                  <>
                    {isMultiUse && count > 0 && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full club-tint-bg club-tint-text">
                        {t("quest.doneCount", { count })}
                      </span>
                    )}
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-600">
                      {t("quest.pending")}
                    </span>
                  </>
                )}

                {/* Referral quest — always show share button (unless pending) */}
                {qType === "referral" && !isPendingQuest && (
                  <>
                    {count > 0 && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full club-tint-bg club-tint-text">
                        {isMultiUse ? t("quest.doneCount", { count }) : t("quest.done")}
                      </span>
                    )}
                    <button
                      onClick={handleShare}
                      disabled={isPending}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full club-btn disabled:opacity-50 transition-colors"
                    >
                      {t("quests.inviteFriend")}
                    </button>
                  </>
                )}

                {/* Non-referral quests — mark done button */}
                {qType !== "referral" && !isPendingQuest && !(done && !isMultiUse) && (
                  <>
                    {isMultiUse && count > 0 && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full club-tint-bg club-tint-text">
                        {t("quest.doneCount", { count })}
                      </span>
                    )}
                    <button
                      onClick={() => handleMarkDone(q)}
                      disabled={isPending}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      {isFeedback ? t("quest.shareFeedback") : t("quest.markDone")}
                    </button>
                  </>
                )}
              </div>
```

- [ ] **Step 4: Add copied toast at the bottom of the component**

Just before the closing `</div>` of the component's return (line 243), add:

```tsx
      {/* Copied toast */}
      {copiedToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-4 py-2 rounded-full shadow-lg z-50">
          {t("quests.linkCopied")}
        </div>
      )}
```

- [ ] **Step 5: Add referral icon to renderIcon function**

In the `renderIcon` function (lines 73-118), add a case for `qType === "referral"` after the tutorial check (line 109):

```typescript
    if (qType === "referral") {
      return (
        <div className={`${baseClass} ${colorClass}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
      );
    }
```

- [ ] **Step 6: Pass new props from parent page**

In `app/[clubSlug]/(member)/page.tsx`, update the `<QuestList>` usage (lines 185-192) to pass `memberCode` and `clubName`:

```tsx
            <QuestList
              quests={activeQuests}
              completionCounts={questCompletionCounts}
              pendingQuestIds={pendingQuestIds}
              memberId={session.member_id}
              memberCode={member?.member_code ?? ""}
              clubName={clubName}
              clubSlug={clubSlug}
              locale={locale}
            />
```

Both `member?.member_code` (line 27) and `clubName` (line 59) are already fetched in this page.

- [ ] **Step 7: Verify build**

```bash
pnpm build
```

- [ ] **Step 8: Commit**

```bash
git add 'app/[clubSlug]/(member)/quest-list.tsx' 'app/[clubSlug]/(member)/page.tsx'
git commit -m "feat: add share button to referral quests in member portal (#83)"
```

---

### Task 4: Handle `?ref=` param on public page

**Files:**
- Modify: `app/[clubSlug]/public/page.tsx` (function signature + banner rendering)
- Modify: `app/[clubSlug]/public/invite-form.tsx` (accept referrerCode prop)

- [ ] **Step 1: Update public page to accept searchParams**

In `app/[clubSlug]/public/page.tsx`, update the function signature (lines 35-38):

```typescript
export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
```

After `const { clubSlug } = await params;` (line 39), add:

```typescript
  const { ref: referrerCode } = await searchParams;
```

- [ ] **Step 2: Add referral banner for non-invite clubs**

In the content area of the public page, after the gallery section and before the member login section (~line 194), add:

```tsx
        {/* Referral banner (non-invite-only clubs) */}
        {referrerCode && !(club.invite_only) && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
            <p className="text-sm font-medium text-amber-800">
              {localized(
                `Mention referral code ${referrerCode} when you sign up!`,
                `¡Menciona el código de referencia ${referrerCode} al registrarte!`,
                locale
              )}
            </p>
          </div>
        )}
```

- [ ] **Step 3: Add referral banner for invite-only clubs with form**

In the quests section where the `InviteForm` is rendered (~line 280), update the `InviteForm` usage to pass `referrerCode`:

```tsx
                <InviteForm clubId={club.id} clubName={club.name} referrerCode={referrerCode} />
```

- [ ] **Step 4: Add referral banner for invite-only clubs with social mode**

After the `InviteSocialButtons` rendering and before the regular quests, add a banner when `referrerCode` is present and invite mode is social:

```tsx
              {club.invite_only && club.invite_mode === "social" && referrerCode && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                  <p className="text-sm font-medium text-amber-800">
                    {localized(
                      `Mention referral code ${referrerCode} when you sign up!`,
                      `¡Menciona el código de referencia ${referrerCode} al registrarte!`,
                      locale
                    )}
                  </p>
                </div>
              )}
```

- [ ] **Step 5: Update InviteForm to accept and use referrerCode**

In `app/[clubSlug]/public/invite-form.tsx`, update the props (line 7):

```typescript
export function InviteForm({ clubId, clubName, referrerCode }: { clubId: string; clubName: string; referrerCode?: string }) {
```

Add a referral banner inside the form, right after the opening `<div className="bg-white rounded-2xl shadow p-4">` (line 32), before the flex row:

```tsx
      {referrerCode && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-3 text-center">
          <p className="text-xs font-medium text-amber-700">{t("public.invitedByMember")}</p>
        </div>
      )}
```

Update the `handleSubmit` function (line 18-29) to append referrer info to the message:

```typescript
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fullMessage = referrerCode
      ? `${message ? message + "\n" : ""}Referred by: ${referrerCode}`
      : message || undefined;
    startTransition(async () => {
      const result = await requestInvite(clubId, clubName, name, contact, fullMessage);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSent(true);
      }
    });
  }
```

- [ ] **Step 6: Verify build**

```bash
pnpm build
```

- [ ] **Step 7: Commit**

```bash
git add 'app/[clubSlug]/public/page.tsx' 'app/[clubSlug]/public/invite-form.tsx'
git commit -m "feat: handle ?ref= param on public page with contextual banners (#83)"
```

---

### Task 5: Auto-complete referral quests in createMember

**Files:**
- Modify: `app/[clubSlug]/staff/members/actions.ts` (lines 113-152, inside createMember)

- [ ] **Step 1: Add referral quest auto-completion logic**

In `app/[clubSlug]/staff/members/actions.ts`, inside the `createMember` function, after the premium referral reward block (after line 135: closing `}` of the premium reward `if`), and still inside the `if (referredByCode)` block, add:

```typescript
    // Auto-complete referral quests for the referrer
    const { data: referralQuests } = await supabase
      .from("quests")
      .select("id, reward_spins, multi_use, badge_id")
      .eq("club_id", clubId)
      .eq("quest_type", "referral")
      .eq("active", true);

    if (referralQuests && referralQuests.length > 0) {
      // Re-fetch referrer to get current spin_balance (may have been updated by premium reward above)
      const { data: currentReferrer } = await supabase
        .from("members")
        .select("id, spin_balance")
        .eq("club_id", clubId)
        .eq("member_code", referredByCode)
        .single();

      if (currentReferrer) {
        let totalSpinsToAdd = 0;

        for (const quest of referralQuests) {
          if (!quest.multi_use) {
            // Check if already completed
            const { count } = await supabase
              .from("member_quests")
              .select("*", { count: "exact", head: true })
              .eq("member_id", currentReferrer.id)
              .eq("quest_id", quest.id)
              .eq("status", "verified");
            if ((count ?? 0) > 0) continue; // Already completed single-use quest
          }

          // Insert quest completion
          await supabase.from("member_quests").insert({
            quest_id: quest.id,
            member_id: currentReferrer.id,
            status: "verified",
            verified_by: staff?.member_id ?? null,
            referral_member_code: code,
          });

          totalSpinsToAdd += quest.reward_spins;

          // Award badge if quest has one
          if (quest.badge_id) {
            await supabase.from("member_badges").upsert(
              { member_id: currentReferrer.id, badge_id: quest.badge_id, quest_id: quest.id },
              { onConflict: "member_id,badge_id", ignoreDuplicates: true }
            );
          }

          await logActivity({
            clubId,
            action: "quest_auto_completed",
            targetMemberCode: referredByCode,
            details: `Referral quest completed: referred ${code}, +${quest.reward_spins} spins`,
          });
        }

        // Award all spins at once using Postgres increment
        if (totalSpinsToAdd > 0) {
          await supabase
            .from("members")
            .update({ spin_balance: currentReferrer.spin_balance + totalSpinsToAdd })
            .eq("id", currentReferrer.id);
        }
      }
    }
```

Note: The `staff` variable is already declared above at line 137 (`const staff = await getStaffFromCookie()`). The `code` variable is the new member's code (line 50). The `referredByCode` is the referrer's member code (line 62-77).

- [ ] **Step 2: Add revalidation for member dashboard**

After the existing `revalidatePath` call at line 151, add:

```typescript
  revalidatePath(`/${clubSlug}`, "layout"); // Refresh member dashboard to show quest completion
```

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add 'app/[clubSlug]/staff/members/actions.ts'
git commit -m "feat: auto-complete referral quests when staff creates referred member (#83)"
```

---

### Task 6: Manual verification + push

- [ ] **Step 1: Full build**

```bash
pnpm build
```

- [ ] **Step 2: Start dev server and test**

```bash
pnpm dev
```

Test checklist:
1. Create a quest with `quest_type: 'referral'` in admin (or use existing)
2. Log in as member → quest shows "Invite a Friend" button (not "Mark Done")
3. Click button → share dialog (mobile) or "Link copied!" toast (desktop)
4. Visit the shared URL on a non-invite-only club → referral code banner visible
5. Visit the shared URL on an invite-only club with form → "Invited by a member!" banner on invite form
6. Visit the shared URL on an invite-only club with social mode → referral code banner visible
7. Visit the public page without `?ref=` → no banner (normal page)
8. In staff console, create a new member with `referred_by` matching the referrer's code → check referrer's quest auto-completes, spins awarded
9. Check activity log for `quest_auto_completed` entry
10. Test single-use: second referral should NOT re-complete
11. Test multi-use: second referral SHOULD create new completion
12. Test in ES: all strings translate properly

- [ ] **Step 3: Push branch**

```bash
git push -u origin feat/batch3-referral-quest
```
