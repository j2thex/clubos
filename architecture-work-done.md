# ClubOS Architecture Reference

## Membership Expiration System

### Login Enforcement (Expired Members Blocked)

**Request:** Hard-block expired members at login — if `valid_till` is set and in the past, reject login with a localized error message showing the expiration date.

**Changes:** Added `valid_till` to the member select query in both `loginMember` and `loginStaff` actions. After the status check, compares `valid_till` against current date. Returns `t(locale, "login.membershipExpired", { date: formatted })` on expiry. Both actions now accept a `locale` parameter (passed from client) for translated error messages. Added `login.membershipExpired` and `login.membershipExpiredGeneric` i18n keys to both EN and ES dictionaries.

**How it works:** When a member or staff member tries to log in, the server action checks `valid_till`. If the date is in the past, login is rejected with a localized message like "Your membership expired on March 10, 2026. Contact your club to renew." The login page also handles `?expired=1` query param (from middleware redirects) to show a generic expiry banner before the user enters their code.

**Key files:**
- `app/[clubSlug]/(member)/login/actions.ts` — `loginMember` checks `valid_till`, accepts `locale` param
- `app/[clubSlug]/staff/login/actions.ts` — `loginStaff` checks `valid_till`, accepts `locale` param
- `app/[clubSlug]/(member)/login/page.tsx` — reads `?expired=1` search param, shows generic expiry banner
- `lib/i18n/dictionaries/en.json` — `login.membershipExpired`, `login.membershipExpiredGeneric`
- `lib/i18n/dictionaries/es.json` — same keys in Spanish

### Middleware Expiry Check (Mid-Session Protection)

**Request:** Redirect already-logged-in expired members on page load, so expiry is enforced even for active sessions.

**Changes:** Added a DB check in the member routes section of `middleware.ts` (after JWT verification). Queries `status, valid_till` from members table. If `valid_till` is past, deletes the member cookie and redirects to `/{clubSlug}/login?expired=1`. Skips the check for server actions (same pattern as staff status check).

**How it works:** On every member page load (not server actions), middleware queries the DB for `valid_till`. If expired, the auth cookie is deleted and the member is redirected to login with `?expired=1`. This adds one DB query per member page load — the same pattern already used for staff status checks.

**Key files:**
- `middleware.ts` — member route section, DB check for `valid_till` after JWT verify

### Staff Date Picker (Unified)

**Request:** Replace the "+Xmo" period-based extension button and separate "edit" link with a single unified date picker for all membership date management.

**Changes:**
- Removed `prolongateMembership()` function from `actions.ts` entirely
- Removed `assignMembershipPeriod` import and period dropdown from `member-row.tsx`
- Removed `Period` interface, `periods` prop, `membershipPeriodId`, and `periodDurationMonths` from `MemberInfo`
- Simplified UI: members with `validTill` show the date as a tappable button (color-coded: red=expired, amber=expiring soon, green=valid) that toggles an inline date picker. Members without `validTill` show a date input with a "Set" button.
- `setManualValidTill` now also clears `membership_period_id` (since it's a manual date) and logs as `validity_updated` (was `validity_set_manual`)
- Updated parent page `staff/(console)/members/page.tsx` to remove `periodMap` and simplified props

**How it works:** Staff members see one unified interaction for all date management. Tap the colored date text → inline date picker appears with Save/Cancel. For members without a date, a date input is always visible. All changes go through `setManualValidTill` which sets the date, clears any period association, and logs `validity_updated` to the activity log. The old `prolongateMembership` ("+Xmo") flow is completely removed. Save/Cancel buttons are full-width rounded buttons (not tiny text links) with loading state for mobile-friendly tapping.

**Key files:**
- `app/[clubSlug]/staff/members/member-row.tsx` — unified date picker UI, simplified props (no periods)
- `app/[clubSlug]/staff/members/actions.ts` — `setManualValidTill` clears `membership_period_id`, logs `validity_updated`; `prolongateMembership` removed
- `app/[clubSlug]/staff/(console)/members/page.tsx` — simplified props passed to `StaffMemberRow`

## Premium Referrals

**Request:** Admin can designate members as "premium referrers" with a configurable spin reward per referral.

**Changes:**
- Added `is_premium_referrer boolean` and `referral_reward_spins integer` columns to `members` table via migration `20260316000000_add_premium_referrals.sql`
- Added `setPremiumReferrer` server action in admin actions
- Rewrote `referral-tree.tsx` — each referrer row now has a "Premium referrer" checkbox and spin reward input; premium referrers show an amber "PREMIUM · X spins" badge
- Added "Add Premium Referrer" button at top of referral tree to designate any member
- Referrals page fetches all members' premium fields and builds member lookup maps
- Auto-reward logic in `staff/members/actions.ts` — after inserting a new member with `referred_by`, checks if the referrer is premium and increments their `spin_balance`

**How it works:** Admin goes to Referrals page, expands a referrer, toggles "Premium referrer" and sets reward spins. When staff creates a new member with that referrer's code in "Referred by", the referrer's spin_balance is automatically incremented by the configured amount. Activity logged as `referral_reward`.

**Key files:**
- `supabase/migrations/20260316000000_add_premium_referrals.sql` — adds 2 columns to members
- `app/[clubSlug]/admin/referral-tree.tsx` — premium toggle UI, inline spin reward input
- `app/[clubSlug]/admin/(panel)/referrals/page.tsx` — fetches premium data, builds member maps
- `app/[clubSlug]/admin/actions.ts` — `setPremiumReferrer` action
- `app/[clubSlug]/staff/members/actions.ts` — auto-reward logic in `createMember`

## Homepage Examples

**Request:** Generate showcase pages for 8 business verticals (sports clubs, coworking, coffee shops, tourist guides, Catalonia tours, bars, nightclubs, Barcelona events) so potential customers can see what their portal would look like.

**Changes:**
- Created `app/examples/verticals.ts` — static data for 8 verticals with sample events/services/quests, branding colors, taglines
- Created `app/examples/page.tsx` — full-width dark grid of vertical cards with gradient hero bars, content badges, bottom CTA
- Created `app/examples/example-portal.tsx` — simulated member portal component with branded hero, stats, quests/events/services sections, CTA banner
- Created `app/examples/[vertical]/page.tsx` — detail page with `generateStaticParams`
- Added "See examples →" link to landing hero and "Examples" link to footer
- Use case cards on landing page now link to `/examples/[slug]`

**How it works:** Examples live at `/examples` (outside the `(platform)` route group to avoid its `max-w-lg` layout constraint). Each vertical is a static data object defining name, colors, and sample content. The index page shows a full-width dark grid matching the landing page style. Clicking a card opens a simulated member portal with that vertical's branding. CTAs link to `/onboarding`.

**Key files:**
- `app/examples/verticals.ts` — 8 vertical definitions with sample data
- `app/examples/page.tsx` — examples index (full-width dark layout)
- `app/examples/example-portal.tsx` — simulated portal component
- `app/examples/[vertical]/page.tsx` — detail page per vertical
- `app/_landing/use-cases.tsx` — cards link to examples
- `app/_landing/hero.tsx` — "See examples →" link
- `app/_landing/landing-footer.tsx` — "Examples" link

## Content Creation UX

### Icon Picker & Textarea Descriptions

**Request:** Improve admin UX for creating quests/events/services — add icon picker, upgrade description inputs to textareas.

**Changes:**
- Added `icon text` column to quests, events, and services tables via migration `20260316100000_add_icon_field.sql`
- Created `lib/icons.ts` — curated list of ~60 lucide-react icons (social, food, entertainment, sports, rewards, etc.)
- Created `components/icon-picker.tsx` — searchable expandable grid, returns icon name string
- Created `components/dynamic-icon.tsx` — renders lucide icon by kebab-case name string (converts to PascalCase)
- All 3 admin managers (`quest-manager.tsx`, `event-manager.tsx`, `service-manager.tsx`): description changed from `<input>` to `<textarea rows={3}>`, added `IconPicker` to create/edit forms, added `DynamicIcon` display in list rows (shows when icon set and no image)
- All 6 CRUD server actions updated to read `icon` from FormData
- All 3 admin pages updated to include `icon` in select queries and data mapping

**How it works:** Admin clicks "Choose icon..." to open a searchable grid of 60+ icons. Selecting one stores the lucide icon name (e.g. "music", "beer") in the `icon` column. Icons render in list rows as a gray square with the icon inside (image takes priority over icon if both set). The `DynamicIcon` component converts kebab-case names to PascalCase and looks up the icon from the lucide-react module.

**Key files:**
- `supabase/migrations/20260316100000_add_icon_field.sql` — adds `icon text` to 3 tables
- `lib/icons.ts` — `CONTENT_ICONS` array of curated icons
- `components/icon-picker.tsx` — searchable icon picker component
- `components/dynamic-icon.tsx` — renders icon by name string
- `app/[clubSlug]/admin/quest-manager.tsx` — icon picker + textarea
- `app/[clubSlug]/admin/event-manager.tsx` — icon picker + textarea
- `app/[clubSlug]/admin/service-manager.tsx` — icon picker + textarea
- `app/[clubSlug]/admin/actions.ts` — all CRUD actions handle `icon`

## Member Badges

**Request:** Members earn badges for completing quests. Admin creates badges and links them to quests. Auto-awarded on quest verification. One-time achievements.

**Changes:**
- Created `badges` table (id, club_id, name, description, icon, color, display_order) and `member_badges` table (member_id, badge_id, earned_at, quest_id, UNIQUE(member_id, badge_id)) via migration `20260316200000_add_badges.sql`
- Added `badge_id uuid` FK to quests table (links quest → badge)
- Created `badge-manager.tsx` — admin CRUD with icon picker, color picker, templates (First Visit, Social Butterfly, VIP Member, Event Regular, Top Referrer)
- Created `admin/(panel)/badges/page.tsx` — server component with earned counts per badge
- Added "Badges" card to content hub (`content/page.tsx`)
- Quest manager: added "Award Badge" dropdown (select from club's badges) in create/edit forms
- `addQuest`/`updateQuest` server actions now persist `badge_id`
- Staff quest actions (`completeQuest`, `approveQuest`): after awarding spins, if quest has `badge_id`, upsert into `member_badges` with `ON CONFLICT DO NOTHING` (one-time only)
- Created `badge-collection.tsx` — member-facing component showing earned badges (full color with date) and locked badges (grayed out with lock icon + "Complete [quest] to unlock")
- Profile page fetches club badges + member badges, renders `BadgeCollection` above spin history

**How it works:** Admin creates badges in Content → Badges with name, icon, color. Then links a badge to a quest via the "Award Badge" dropdown on the quest form. When staff verifies a quest completion (either direct or approve pending), the system checks if the quest has a `badge_id` and upserts into `member_badges`. The UNIQUE constraint ensures one badge per member. Members see their badges on Profile — earned ones in full color, locked ones grayed out with the quest name needed to unlock.

**Key files:**
- `supabase/migrations/20260316200000_add_badges.sql` — badges + member_badges tables, badge_id on quests
- `app/[clubSlug]/admin/badge-manager.tsx` — admin CRUD with templates
- `app/[clubSlug]/admin/(panel)/badges/page.tsx` — badges admin page
- `app/[clubSlug]/admin/(panel)/content/page.tsx` — badges card in content hub
- `app/[clubSlug]/admin/quest-manager.tsx` — "Award Badge" dropdown
- `app/[clubSlug]/admin/actions.ts` — addBadge/updateBadge/deleteBadge + badge_id in quest actions
- `app/[clubSlug]/staff/quest/actions.ts` — auto-award badge on verify
- `app/[clubSlug]/(member)/badge-collection.tsx` — earned/locked badge display
- `app/[clubSlug]/(member)/profile/page.tsx` — fetches and renders badges

## Configurable Member Login Mode

**Request:** Admin can choose login method for members: code only (current) or code + 4-digit expiry date (MMDD format) for extra security.

**Changes:**
- Added `login_mode text NOT NULL DEFAULT 'code_only'` to clubs table via migration `20260316300000_add_login_mode.sql`
- Created `login-mode-manager.tsx` — radio toggle in admin settings (code_only / code_and_expiry)
- Added `updateLoginMode` server action
- Settings page fetches `login_mode` from clubs, renders `LoginModeManager` at top
- Extracted login form into `login-form.tsx` client component that accepts `loginMode` prop
- `login/page.tsx` converted to server component — fetches club's `login_mode`, passes to `LoginForm`
- When `loginMode === "code_and_expiry"`: form shows second input (4-digit numeric, MMDD placeholder)
- Login action: if `code_and_expiry` mode, parses member's `valid_till` as MMDD, compares with submitted code
- Added 5 new i18n keys (EN/ES) for expiry code UI and error messages

**How it works:** Admin goes to Settings → "Member Login" (first section), chooses between "Code only" (default) and "Code + expiry date". When code+expiry is enabled, the login form shows a second field where members enter the month+day of their expiry as 4 digits (e.g. "1227" for Dec 27). The server parses `valid_till` → MMDD and compares. Members without `valid_till` get a clear error. Switching back to "Code only" hides the field.

**Key files:**
- `supabase/migrations/20260316300000_add_login_mode.sql` — login_mode column on clubs
- `app/[clubSlug]/admin/login-mode-manager.tsx` — radio toggle component
- `app/[clubSlug]/admin/actions.ts` — `updateLoginMode` action
- `app/[clubSlug]/admin/(panel)/settings/page.tsx` — fetches login_mode, renders manager
- `app/[clubSlug]/(member)/login/login-form.tsx` — extracted client form with conditional expiry input
- `app/[clubSlug]/(member)/login/page.tsx` — server component fetching login_mode
- `app/[clubSlug]/(member)/login/actions.ts` — MMDD validation logic

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

## Environment Separation (PROD/STAGE)

### Git Branching & Deployment Pipeline

**Request:** Separate staging and production environments across GitHub, Vercel, and Supabase so live clients are protected from untested changes.

**Changes:**
- Created `develop` branch as the staging branch, `main` remains production
- Created Supabase staging project `waiuymqdqzccatactrzo` with all migrations synced
- Created `.github/workflows/migrate-staging.yml` — auto-runs `supabase db push` on push to `develop` when migrations change
- Created `.github/workflows/migrate-production.yml` — same for `main` targeting production
- Created `supabase/seed.sql` with test data (demo club, test members, wheel configs)
- Added staging banner in `app/layout.tsx` using `NEXT_PUBLIC_VERCEL_ENV === "preview"`
- Vercel env vars scoped: Production uses prod Supabase, Preview uses staging Supabase
- `staging.osocios.club` domain assigned to `develop` branch in Vercel
- Branch protection on `main`: requires 1 PR approval

**How it works:** Feature branches are created from `develop`. PRs merge into `develop`, which auto-deploys to `staging.osocios.club` (with yellow STAGING banner) and uses the staging Supabase. When staging is verified, a PR from `develop` → `main` deploys to `osocios.club` (production). GitHub Actions auto-migrate the appropriate Supabase project when migration files change. All PR/merge operations are done via `gh` CLI from terminal.

**Key files:**
- `.github/workflows/migrate-staging.yml` — staging migration workflow
- `.github/workflows/migrate-production.yml` — production migration workflow
- `supabase/seed.sql` — test data for staging/local
- `app/layout.tsx` — staging banner (line 46-50)

### Storage Buckets Migration

**Request:** Fix "failed to upload image" error on staging — storage buckets existed on production but not staging (they were created manually in dashboard, not via migration).

**Changes:** Created migration `20260313000000_create_storage_buckets.sql` that creates `club-images` and `event-images` buckets with public access, 5MB limit, and image-only MIME types. Includes RLS policies for public read, service role write. Uses `ON CONFLICT DO NOTHING` so it's safe to run on production where buckets already exist.

**How it works:** Storage buckets are now managed via migration instead of manual dashboard setup. Both buckets are public (images served without auth), limited to 5MB, and restricted to image MIME types. Upload code in `lib/supabase/storage.ts` uses the admin client (service role) which bypasses RLS for writes.

**Key files:**
- `supabase/migrations/20260313000000_create_storage_buckets.sql` — bucket creation + policies
- `lib/supabase/storage.ts` — upload/delete functions using admin client

## Spin Wheel (Staff Console)

### Visual Upgrade & Fullscreen Mode

**Request:** Make the spin wheel look better (inspired by `spin-wheel` library's "Workout" theme), go fullscreen when spinning, add confetti on win, fix font, fix layout jumping, and fix double-spin bug.

**Changes:**
- Replaced plain canvas wheel with themed version using SVG overlay (outer ring + yellow pointer at top) and SVG hub (spiral heart centerpiece that spins with the wheel)
- SVGs loaded as `HTMLImageElement` via `new Image()` + onload promise — the `spin-wheel` library requires Image objects, not URL strings
- `pointerAngle: 0` positions pointer at top (library default is bottom)
- Labels uppercased via `.toUpperCase()` on segment labels
- Font set to `Arial, Helvetica, sans-serif` at `itemLabelFontSizeMax: 28` — Amatic SC was tried but illegible on canvas, Impact was too bold
- Added fullscreen mode: when spinning, wheel gets `fixed z-[9991]` positioning with `92vmin` size, dark backdrop at `z-[9990]`, result overlay in center, "tap to close" hint at bottom
- Fullscreen appears instantly (no CSS transition — user found slide animation distracting)
- Added `canvas-confetti` — fires on spin result when `rewardType !== "nothing"`
- Fixed layout jump in `staff-spin-client.tsx`: member info row always reserves space with `min-h-[36px]` even when empty
- Wheel container changed from fixed size to responsive `w-full max-w-[480px] aspect-square`
- Fixed double-spin bug: `useImperativeHandle` was exposing `isSpinning: () => spinning` which captured stale closure. Added `spinningRef = useRef(false)` synced with every `setSpinning` call; `isSpinning` now returns `spinningRef.current`
- `handleSpin` guard also uses `spinningRef.current` instead of `spinning` state

**How it works:** The wheel is a `forwardRef` component that exposes `spin(result)` and `isSpinning()` via `useImperativeHandle`. The parent (`StaffSpinClient`) calls `performSpinForMember` server action, gets back the result with `segmentIndex`, then calls `wheelRef.current.spin(result)`. The wheel enters fullscreen, spins to the target segment over 4 seconds, shows the result overlay, fires confetti if it's a win, and waits for user tap to dismiss. The `spinningRef` ensures the parent's `isSpinning()` check always reflects current state, preventing double spins even across React re-renders.

**Key files:**
- `components/club/spin-wheel.tsx` — core wheel component (fullscreen, confetti, spinningRef, SVG loading)
- `app/[clubSlug]/staff/spin/staff-spin-client.tsx` — staff spin page client (member code input, triggers spin via ref)
- `app/[clubSlug]/staff/spin/actions.ts` — `performSpinForMember` server action
- `public/wheel/overlay.svg` — outer ring with yellow pointer at top
- `public/wheel/hub.svg` — spiral heart centerpiece (from spin-wheel library examples)
- `types/spin-wheel.d.ts` — TypeScript declarations for the `spin-wheel` library

## Quest System — Feedback & Tutorial Types

### Feedback Quest Type

**Request:** Add a "feedback" quest type where members submit wishes/suggestions for the club, reviewed and approved by staff.

**Changes:**
- Added `feedback` as a new `quest_type` value (no schema change — `quest_type` is a text column accepting any value)
- Admin: added "Share Feedback" quick-add template and "Feedback" option in quest type dropdown
- Admin: when `quest_type === "feedback"`, auto-sets `multi_use: true` and `proof_mode: "required"`, disables repeatable checkbox, shows "Feedback Prompt" label instead of proof mode selector
- Member: feedback quests show "Share feedback" button instead of "Mark done", expands a `<textarea>` (multi-line) instead of single-line `<input>`. Feedback text stored in existing `proof_url` column
- Staff: feedback submissions display as a styled amber quote block (`bg-amber-50 border-l-2 border-amber-300`) instead of the default copy-to-clipboard display
- Member quest icon: speech bubble SVG for feedback type

**How it works:** Feedback quests reuse the existing proof submission flow. The `proof_url` column stores the feedback text (it's a text column, not validated as URL). Admin creates a feedback quest with an optional prompt (stored in `proof_placeholder`). Members see a textarea, submit feedback → goes to `member_quests` with `status: "pending"`. Staff reviews the feedback text in the pending validations section and approves/declines. Spins awarded on approve. Activity log includes the feedback text via existing `proof_url` logging. Multi-use by design — members can submit feedback repeatedly.

**Key files:**
- `app/[clubSlug]/admin/quest-manager.tsx` — template, type dropdown, conditional fields for feedback
- `app/[clubSlug]/admin/actions.ts` — enforces `multi_use: true`, `proof_mode: "required"` for feedback type
- `app/[clubSlug]/(member)/quest-list.tsx` — textarea UI, "Share feedback" button, speech bubble icon
- `app/[clubSlug]/staff/quest/staff-quest-client.tsx` — amber quote block display for feedback proof

### Tutorial Quest Type

**Request:** Add a "tutorial" quest type for new member onboarding — admin defines steps, member reviews and marks done, staff verifies completion.

**Changes:**
- Added `tutorial_steps jsonb` column to `quests` table via migration `20260314000000_add_tutorial_steps.sql`
- Admin: added "New Member Tutorial" quick-add template and "Tutorial" option in quest type dropdown
- Admin: when `quest_type === "tutorial"`, auto-sets `multi_use: false` and `proof_mode: "none"`, disables repeatable checkbox, shows a tutorial steps editor (numbered text inputs with add/remove)
- Admin: steps serialized to JSON in FormData, parsed server-side and stored as jsonb array of strings
- Member: tutorial quests display numbered steps list below description. "Mark done" submits as pending (no proof input — staff verifies in person)
- Member quest icon: book SVG for tutorial type
- Admin quest list: green "Tutorial" badge, amber "Feedback" badge, indigo "Referral" badge (type badges added for all non-default types)
- Admin quests page query updated to include `tutorial_steps`
- Member dashboard query updated to include `quest_type, tutorial_steps`

**How it works:** Admin creates a tutorial quest with an ordered list of steps (e.g., "Visit your Profile", "Check out Events", "Browse Services"). Steps are stored as a JSON array of strings in `quests.tutorial_steps`. Members see the steps as a numbered list and click "Mark done" when they've completed the tutorial. This creates a `member_quests` record with `status: "pending"`. Staff verifies completion in person (e.g., asks the member to demonstrate), then approves in the staff console. Single-use — tutorial disappears after completion.

**Key files:**
- `supabase/migrations/20260314000000_add_tutorial_steps.sql` — adds `tutorial_steps jsonb` column
- `app/[clubSlug]/admin/quest-manager.tsx` — template, type dropdown, steps editor, type badges
- `app/[clubSlug]/admin/actions.ts` — parses `tutorial_steps` JSON, enforces `multi_use: false`, `proof_mode: "none"`
- `app/[clubSlug]/admin/(panel)/quests/page.tsx` — includes `tutorial_steps` in query and data mapping
- `app/[clubSlug]/(member)/page.tsx` — includes `quest_type, tutorial_steps` in quests select
- `app/[clubSlug]/(member)/quest-list.tsx` — numbered steps display, book icon, type-aware submission logic
- `lib/i18n/dictionaries/en.json` — 14 new keys for feedback/tutorial UI
- `lib/i18n/dictionaries/es.json` — same keys in Spanish

### Migration History Repair (Staging)

**Request:** Fix CI migration failure — staging had an orphan migration `20260313145302` not present locally, causing `supabase db push` to fail.

**Changes:**
- Created `supabase/migrations/20260313145302_remote_hotfix_placeholder.sql` (empty placeholder) to match local history with remote
- Ran `supabase migration repair --status applied` for all 21 pre-existing migrations to register them in staging's migration history table
- Migration `20260314000000` (tutorial_steps) applied manually via `supabase db push` locally

**How it works:** The staging database had migrations applied directly (not via the CI workflow), so only `20260313145302` was in the migration history table. All earlier migrations existed in the schema but weren't tracked. The repair command marks all local migrations as "applied" in the remote `supabase_migrations.schema_migrations` table, syncing local and remote history. Future CI runs will only attempt to apply truly new migrations.

**Key files:**
- `supabase/migrations/20260313145302_remote_hotfix_placeholder.sql` — empty placeholder for remote-only migration
- `.github/workflows/migrate-staging.yml` — CI workflow (triggers on `supabase/migrations/**` changes to `develop`)

## Landing Page

### Editorial Dark Redesign (v2)

**Request:** Redesign the landing page with modern editorial typography, radical layout, service finder, membership discount browsing, and no janky effects.

**Changes:**
- Stripped all bad animations: `@keyframes float`, `animate-float`, `animate-pulse-glow`, `bg-dot-pattern`, `.glass`, `@keyframes gradient-shift` shimmer. Replaced with `.landing-dark` (oklch 0.06) and static `.text-gradient`
- Rewrote `scroll-reveal.tsx` — now fade-only (800ms CSS opacity transition, no translate/slide)
- Deleted `stats-bar.tsx` and `animated-counter.tsx` — stats moved inline to hero as understated monospace text
- Hero: `font-extralight` (200) brand name at `clamp(3.5rem,12vw,10rem)`, `font-black` (900) tagline keyword with static green gradient, clean round CTA button
- All sections use `landing-dark` background with `bg-white/[0.03]` cards and `border-white/[0.06]` borders
- Feature grid: removed category pills, smaller muted icons, `font-light opacity-40` descriptions
- How-it-works: watermark step numbers (`text-8xl font-extralight opacity-[0.04]`) behind content
- Use cases: dark cards with subtle hover, horizontal scroll on mobile
- Club directory: darkened with heavier cover overlays
- Final CTA: last word of heading gets `text-gradient font-medium` accent, no shimmer animation
- Created `service-finder.tsx` (client component) — searchable cross-club service directory
- Created `membership-explorer.tsx` — browse priced membership periods across clubs
- Migration `20260314100000_add_membership_price.sql` — adds `price numeric(10,2)` to `membership_periods`
- ~10 new i18n keys for service finder and membership explorer (EN/ES)

**How it works:** The entire landing page is dark-themed (oklch 0.06 background). Typography creates hierarchy through weight contrast (extralight 200 vs black 900) rather than size or color. The only animation is a clean opacity fade on scroll (IntersectionObserver, CSS transition, no translate).

The page fetches four data sets server-side with 1-hour cache (`revalidate = 3600`): stats (clubs/members/events counts), public clubs, public services, and priced membership periods. All use `createAdminClient()` which bypasses RLS.

Service Finder is a client component with live text filtering — searches service title, description, and club name. Each card links to the club's public profile. Membership Explorer shows periods that have a `price` set, with club branding.

Sections flow: Hero → Platform Overview → Feature Grid → How It Works → Use Cases → Service Finder → Membership Explorer → Club Directory → Final CTA → Footer.

**Key files:**
- `app/page.tsx` — main page, fetches stats/clubs/services/deals, composes sections
- `app/_landing/hero.tsx` — dark hero with editorial typography, inline stats
- `app/_landing/scroll-reveal.tsx` — fade-only IntersectionObserver wrapper (no slide)
- `app/_landing/service-finder.tsx` — client component, searchable service grid with live filtering
- `app/_landing/membership-explorer.tsx` — priced membership periods browser
- `app/_landing/platform-overview.tsx` — 3-portal bento with CSS mockups
- `app/_landing/feature-grid.tsx` — 12-item bento grid, dark cards
- `app/_landing/how-it-works.tsx` — timeline with watermark numbers
- `app/_landing/use-cases.tsx` — 5 club types, horizontal scroll on mobile
- `app/_landing/club-directory.tsx` — public club cards with cover/logo
- `app/_landing/final-cta.tsx` — closing CTA with gradient accent word
- `app/_landing/landing-footer.tsx` — minimal dark footer
- `app/_landing/portal-tabs.tsx` — mobile tab switcher for portal overview
- `app/globals.css` — `.landing-dark`, `.text-gradient` utilities (bad animations removed)
- `supabase/migrations/20260314100000_add_membership_price.sql` — price column on membership_periods

## i18n — Spanish Language Support

### Custom i18n System

**Request:** Add Spanish language support with browser auto-detection and manual EN/ES switcher in all portals.

**Changes:** Built a custom lightweight i18n system (no library) with: JSON dictionaries, `t()` translation function with parameter interpolation, React context provider for client components, server-side locale via middleware headers. Migrated ~285 hardcoded English strings across ~34 files to use translation keys.

**How it works:** The middleware reads `clubos-lang` cookie (or falls back to `Accept-Language` header for `es` detection) and sets an `x-lang` response header + persists the cookie. The root layout reads the header via `getServerLocale()`, sets `<html lang>` dynamically, and wraps everything in `<LanguageProvider initialLocale={locale}>`.

- **Server Components** use: `const locale = await getServerLocale(); t(locale, "key")`
- **Client Components** use: `const { t } = useLanguage(); t("key")`
- **Interpolation:** `t(locale, "member.welcome", { name: "Juan" })` → "Welcome back, Juan" / "Bienvenido, Juan"
- **Date formatting:** Uses `getDateLocale(locale)` → `"es-ES"` or `"en-US"` for `toLocaleDateString()`

The `LanguageSwitcher` component (EN|ES toggle) is placed in:
- Landing page: fixed top-right
- Onboarding: fixed top-right (via platform layout)
- Member portal: fixed top-right (via member layout)
- Staff console: in the header bar next to quick links
- Admin panel: in the header next to logout button

Switching locale writes the `clubos-lang` cookie and calls `router.refresh()` to re-render server components.

**Key files:**
- `lib/i18n/index.ts` — `t()` function, `Locale` type, `detectLocale()`, `getDateLocale()`
- `lib/i18n/server.ts` — `getServerLocale()` (server-only, reads `x-lang` header)
- `lib/i18n/provider.tsx` — `LanguageProvider` context + `useLanguage()` hook for client components
- `lib/i18n/switcher.tsx` — `LanguageSwitcher` component (EN|ES toggle, light/dark variants)
- `lib/i18n/dictionaries/en.json` — English dictionary (~285 keys)
- `lib/i18n/dictionaries/es.json` — Spanish dictionary (~285 keys)
- `middleware.ts` — `applyLocale()` helper detects locale, sets `x-lang` header + `clubos-lang` cookie
- `app/layout.tsx` — async root layout, dynamic `<html lang>`, wraps children in `LanguageProvider`
