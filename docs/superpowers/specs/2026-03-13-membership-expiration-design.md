# P2: Membership Expiration System — Design Spec

## Context

ClubOS already has `valid_till` (date, nullable) on the members table, membership periods configured by admin, and color-coded expiry display in member profile and staff member rows. However, expiration is purely informational — expired members can still log in and use all features. Staff extension is limited to a "+Xmo" button tied to the member's period, lacking flexibility.

## Requirements

1. **Hard block expired members at login** — if `valid_till` is set and in the past, reject login with a specific error message
2. **Flexible staff date picker** — replace "+Xmo" button with a date picker for full control over expiry dates
3. **Mid-session expiry protection** — redirect already-logged-in expired members on page load
4. **Activity logging** — all date changes logged and visible in admin activity log

## Design

### 1. Login enforcement

**File:** `app/[clubSlug]/(member)/login/actions.ts`

After looking up the member by code and checking `status === "active"`, add:

```
if (member.valid_till) {
  const expiry = new Date(member.valid_till + "T00:00:00");
  if (expiry < new Date()) {
    return { error: t(locale, "login.membershipExpired", { date: formatted }) };
  }
}
```

- Query must include `valid_till` in the select: `select("id, status, valid_till")`
- Error message shows the expiration date formatted in the user's locale
- Same check added to `app/[clubSlug]/staff/login/actions.ts` for staff members

**i18n keys to add:**
- `login.membershipExpired`: "Your membership expired on {date}. Contact your club to renew."
- Spanish: "Tu membresía expiró el {date}. Contacta a tu club para renovar."

### 2. Middleware expiry check

**File:** `middleware.ts`

In the member routes section (after JWT verification), add a DB check for `valid_till`:

```
const { data: member } = await supabaseAdmin
  .from("members")
  .select("status, valid_till")
  .eq("id", payload.member_id)
  .single();

if (member?.valid_till) {
  const expiry = new Date(member.valid_till + "T00:00:00");
  if (expiry < new Date()) {
    const res = NextResponse.redirect(new URL(`/${clubSlug}/login?expired=1`, request.url));
    res.cookies.delete(MEMBER_COOKIE);
    return res;
  }
}
```

- Deletes the auth cookie so they must re-authenticate
- Redirects to login with `?expired=1` query param
- Login page reads the param and shows the expiry message
- Skip this check for server actions (same pattern as staff status check)
- Note: this adds a DB query per member page load. The staff routes already do this for status checks, so the pattern is established.

### 3. Staff date picker for membership extension

**File:** `app/[clubSlug]/staff/members/member-row.tsx`

Replace the current UI:
- Remove the "+{duration}mo" button (period-based extension)
- Remove the separate "edit" link for manual dates
- Unify into a single pattern:
  - If member has `valid_till`: show the date (with color coding), tappable to open inline date picker
  - If member has no `valid_till`: show "Set date" button that opens the same picker
  - Date picker: native `<input type="date">` (works well on mobile), min value = today
  - On change: call `updateMemberValidity(memberId, newDate, clubSlug)` server action

**File:** `app/[clubSlug]/staff/members/actions.ts`

- Rename/refactor: the existing `setManualValidTill()` becomes the single action for all date updates
- Remove `prolongateMembership()` — no longer needed since staff always picks a date directly
- The action clears `membership_period_id` (since it's now a manual date) and sets `valid_till`
- Logs activity: action `"validity_updated"`, details `"Valid till {date}"`

### 4. Activity logging

All validity date changes go through the single `updateMemberValidity` action which logs:
- `action`: `"validity_updated"`
- `details`: `"Valid till 2026-12-31"` (the new date)
- `member_id`: the affected member
- `performed_by`: the staff member making the change

Admin activity log page (`app/[clubSlug]/admin/(panel)/logs/page.tsx`) already renders all activity entries — no changes needed.

### 5. Login page expired param handling

**File:** `app/[clubSlug]/(member)/login/page.tsx`

Read `searchParams.expired` — if `"1"`, show the expiry error message at the top of the form (before the member enters their code). This handles the case where middleware redirected an already-logged-in expired member.

## Files to modify

| File | Change |
|------|--------|
| `app/[clubSlug]/(member)/login/actions.ts` | Add `valid_till` check after status check |
| `app/[clubSlug]/(member)/login/page.tsx` | Handle `?expired=1` query param |
| `app/[clubSlug]/staff/login/actions.ts` | Add `valid_till` check for staff login |
| `middleware.ts` | Add `valid_till` DB check for member routes |
| `app/[clubSlug]/staff/members/member-row.tsx` | Replace "+Xmo" and "edit" with unified date picker |
| `app/[clubSlug]/staff/members/actions.ts` | Remove `prolongateMembership`, update `setManualValidTill` |
| `lib/i18n/dictionaries/en.json` | Add `login.membershipExpired` key |
| `lib/i18n/dictionaries/es.json` | Add `login.membershipExpired` key |

## Out of scope

- Bulk renewal (extending multiple members at once)
- Automatic email/notification before expiry
- Admin UI for `valid_till` visibility (admin delegates to staff)
- Expiry enforcement for admin portal (admin uses email+password, not member codes)
