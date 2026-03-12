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

## Public Club Profiles

**Request:** Add a public-facing landing page for each club showing public content, with admin toggle to mark entities as public or private.

**Changes:**
- Added `is_public boolean NOT NULL DEFAULT false` column to `quests`, `events`, and `services` tables via migration `20260311000000_add_is_public`
- Added middleware bypass for `/{clubSlug}/public` route (unauthenticated access)
- Updated all 6 CRUD server actions (`addQuest`, `updateQuest`, `addEvent`, `updateEvent`, `addService`, `updateService`) to extract and persist `is_public` from FormData
- Added "Show on public profile" checkbox to all three admin manager components (both create and edit forms), plus a blue "Public" badge in list views
- Updated admin page queries for quests, events, and services to include `is_public` in select and pass it to manager components
- Created new public profile page at `app/[clubSlug]/public/page.tsx`
- Added "Public Page" link (opens in new tab) to both admin and staff layout headers

**How it works:** Each quest, event, and service has an `is_public` flag (default false). Admin toggles this via a checkbox when creating or editing. The public page at `/{clubSlug}/public` is a Server Component that fetches club branding plus all entities where `active=true AND is_public=true`. Events are filtered to future dates only. The page inherits club branding CSS variables from the parent `[clubSlug]/layout.tsx`. No authentication required — middleware allows `/public` path through. The page shows: hero with cover image/gradient + logo + club name, member login button, then sections for events, quests, and services (only rendered if public items exist), and a "Powered by osocios" footer.

**Key files:**
- `supabase/migrations/20260311000000_add_is_public.sql` — adds `is_public` column to 3 tables
- `middleware.ts` — public route bypass at line 70
- `app/[clubSlug]/admin/actions.ts` — all 6 CRUD actions handle `is_public`
- `app/[clubSlug]/admin/quest-manager.tsx` — checkbox + badge for quests
- `app/[clubSlug]/admin/event-manager.tsx` — checkbox + badge for events
- `app/[clubSlug]/admin/service-manager.tsx` — checkbox + badge for services
- `app/[clubSlug]/admin/(panel)/quests/page.tsx` — passes `is_public` to quest manager
- `app/[clubSlug]/admin/(panel)/events/page.tsx` — passes `is_public` to event manager
- `app/[clubSlug]/admin/(panel)/services/page.tsx` — passes `is_public` to service manager
- `app/[clubSlug]/public/page.tsx` — public profile landing page
- `app/[clubSlug]/admin/(panel)/layout.tsx` — admin header with "Public Page" link
- `app/[clubSlug]/staff/(console)/layout.tsx` — staff header with "Public Page" link

## Service Card Style (Compact Row)

**Request:** Make services look like quests — compact row layout instead of large cards with full-width images.

**Changes:** Replaced the full-width hero image card layout in `service-list-client.tsx` and the public page services section with a compact row layout matching quest cards: small circular image (w-10 h-10 rounded-full) or flask icon placeholder, title + description + link inline, price and action button on the right.

**How it works:** Services now render as compact rows identical to quests in both the member portal and public page. Each row has: circular image or placeholder icon, title/description/link stacked vertically, and price + action button aligned right. The "Request"/"Requested" buttons use rounded-full pill style matching quest's "Mark done" button.

**Key files:**
- `app/[clubSlug]/(member)/services/service-list-client.tsx` — member portal service list (compact row with action buttons)
- `app/[clubSlug]/public/page.tsx` — public page service section (compact row, no action buttons)

## Member Delete (Admin)

**Request:** Allow admin to delete members from the PeopleManager.

**Changes:** Added `deleteMember` server action to `actions.ts` that deletes a member by ID. Added a trash icon button to each member row in `people-manager.tsx` with a `window.confirm` dialog before deletion. Imported `deleteMember` in the component.

**How it works:** Each member/staff row now has a small trash icon button on the far right. Clicking it shows a browser confirm dialog ("Delete {code}? This cannot be undone."). On confirm, calls `deleteMember(person.id, clubSlug)` which runs a Supabase delete and revalidates the admin layout path.

**Key files:**
- `app/[clubSlug]/admin/actions.ts` — `deleteMember` action (delete by member ID)
- `app/[clubSlug]/admin/people-manager.tsx` — trash button per row with confirm dialog

## /document Skill

**Request:** Create a skill that documents completed work into an architecture reference file for future AI context.

**Changes:** Created `~/.claude/skills/document/SKILL.md` with instructions to review the conversation, identify completed tasks, and append structured entries to `architecture-work-done.md`. Format includes: request, changes, how it works, and key files.

**How it works:** Invoked via `/document` at the end of a conversation. Reads the existing `architecture-work-done.md`, checks for duplicate topics (updates existing entries rather than duplicating), and appends new entries for each task completed in the session. Entries are architectural knowledge — not changelogs — designed to help future AIs work faster.

**Key files:**
- `~/.claude/skills/document/SKILL.md` — skill definition
- `architecture-work-done.md` — the living architecture reference file (project root)

## Interactive Calendar with Event Details

**Request:** Make the calendar view in the member events page interactive — clicking dates with events should show event details inline.

**Changes:** Added `selectedDate` state to `EventsClient`. Date cells with events are now clickable and highlight with club-primary color. An inline event panel renders below the calendar grid showing compact event cards (thumbnail, title, time, price, spin reward, RSVP button). Auto-selects the nearest upcoming event date when switching to calendar view. Month navigation clears selection. Past event dates show gray dots; upcoming dates show club-primary dots.

**How it works:** The calendar is a custom grid inside `events-client.tsx` (no library). Tapping a date with events sets `selectedDate` state, which filters events for that date and renders cards below the grid inside the same white card container. Tapping the same date deselects. Each card links to the full event detail page. RSVP buttons work inline using the existing `handleRsvp` function. Past dates show events but without RSVP buttons, labeled "Past".

**Key files:**
- `app/[clubSlug]/(member)/events/events-client.tsx` — calendar grid, selectedDate state, inline event panel

## Past Event Protection (Timezone + Checkin)

**Request:** Fix bugs where members could see and sign up for past events, and could cancel RSVP after being checked in by staff.

**Changes:**
1. **Timezone fix:** Moved all upcoming/past date splitting from server-side (`page.tsx`) to client-side (`events-client.tsx`). The server was using `new Date().toISOString()` which returns UTC — causing events to appear as "upcoming" when they were already past in the user's timezone (e.g., UTC+1). Now the browser's `new Date()` handles the split correctly.
2. **Checkin protection (server):** `cancelRsvp` action now queries `event_checkins` first and rejects cancellation if the member is already checked in. `rsvpEvent` validates event date is not past. `checkinMember` and `checkinMemberById` reject past events.
3. **Checkin protection (UI):** Events page fetches checkin status alongside RSVPs. Checked-in events show a green "Checked In" badge instead of RSVP/cancel buttons — in both list view and event detail page.
4. **Event detail page:** `EventDetailClient` now receives `checkedIn` and `eventDate` props. Uses client-side date comparison to show "This event has passed" for past events, "Checked In" for checked-in events.
5. **revalidatePath:** Added `revalidatePath("/")` calls after RSVP and cancel mutations to bust Next.js page cache.

**How it works:** `page.tsx` fetches ALL active events (no date filter), all member RSVPs, and all member checkins. Passes a single `events` array with `hasRsvp` and `checkedIn` booleans to `EventsClient`. The client component splits into upcoming/past using browser-local date. List view shows only upcoming events. Calendar view shows all events with visual distinction (gray dots for past, club-primary for upcoming). Checked-in events are locked — no cancel/re-signup possible at either UI or server level.

**Important: timezone caveat.** Never use `new Date().toISOString().split("T")[0]` on the server for "today" comparisons against user-facing dates — it returns UTC which can be a day off from the user's timezone. Always do date splitting on the client side or use a club-level timezone setting.

**Key files:**
- `app/[clubSlug]/(member)/events/page.tsx` — fetches events + RSVPs + checkins, passes all to client
- `app/[clubSlug]/(member)/events/events-client.tsx` — client-side date split, checkedIn badge, list/calendar rendering
- `app/[clubSlug]/(member)/events/actions.ts` — `rsvpEvent` validates future date, `cancelRsvp` rejects if checked in, both call `revalidatePath`
- `app/[clubSlug]/(member)/events/[eventId]/event-detail-client.tsx` — client-side past check, checkedIn display
- `app/[clubSlug]/staff/events/actions.ts` — `checkinMember` and `checkinMemberById` reject past events
