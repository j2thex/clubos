# ClubOS — Architecture & Feature Reference

> Last updated: 2026-04-08
> Purpose: Single source of truth for all platform capabilities AND implementation details. Used by the `/document` skill, website copy, tutorials, documentation, and sales materials.

---

## Platform Feature Inventory

### A. MEMBER PORTAL (what end users get)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Member Code Login** | Code-only or code+expiry (DDMM) authentication |
| 2 | **Personalized Dashboard** | Club-branded hero, stats (spins remaining, completed, level), quests, gallery |
| 3 | **Welcome Overlay** | First-visit tutorial explaining quests, spin wheel, and events |
| 4 | **Spin the Wheel** | Weighted probability wheel with configurable segments, confetti on win, result overlay |
| 5 | **Spin Balance & History** | Track remaining spins, full history with outcomes, dedicated history page |
| 6 | **Quests — Default** | Simple task tracking, staff validates completion |
| 7 | **Quests — Tutorial** | Step-by-step guides with checkboxes (progress saved locally) |
| 8 | **Quests — Feedback** | Text submission/feedback collection from members |
| 9 | **Quests — Referral** | Share link via WhatsApp/Telegram/Instagram/TikTok, auto-complete on new signup |
| 10 | **Quests — Email Collect** | Members enter email to complete quest and earn spins; email saved to profile |
| 11 | **Quest Proof Modes** | None (trust), Optional (can attach), Required (must attach URL/text) |
| 12 | **Quest Deadlines** | Auto-expire with countdown badge ("Until Apr 10"), red if <=3 days |
| 13 | **Optimistic Quest UI** | Instant "Pending" badge on submission before server confirms; error rollback |
| 14 | **Badge Collection** | Earn badges from quests, see locked vs unlocked badges with unlock hints |
| 15 | **Events — List View** | Browse upcoming events with images, dates, times, prices, RSVP button |
| 16 | **Events — Calendar View** | Month navigator, day grid with event dots, date selection |
| 17 | **Events — Detail Page** | Full image, description, location, RSVP/cancel, check-in status, reward spins |
| 18 | **Events — RSVP** | Sign up / cancel for events, prevented for past events or if already checked in |
| 19 | **Event End Time** | Optional end time for events, shows duration |
| 20 | **Offers** | Browse club offers grouped by subtype, request/cancel orders |
| 21 | **Referral System** | Shareable link, track referred members, WhatsApp/Telegram/Instagram/TikTok buttons |
| 22 | **Member Profile** | QR code, member code, validity dates, badges, spin history, referrals, logout |
| 23 | **Profile Email Field** | Members can add/update their email directly on profile page |
| 24 | **Photo Gallery** | Horizontal scroll with lightbox zoom and captions |
| 25 | **Social Links** | Instagram, WhatsApp, Telegram, Google Maps, Website — auto-formatted |
| 26 | **Membership Expiry** | Color-coded validity (green/amber/red), auto-check on login, expired redirect |
| 27 | **Level System** | Level 1-10 based on total spin count (1 level per 5 spins) |
| 28 | **Bilingual UI** | Full EN/ES with cookie-based switching on all pages |
| 29 | **Mobile-First Design** | Bottom nav (5 tabs), safe area insets, touch-friendly 44px+ targets |

### B. STAFF CONSOLE (what staff members get)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Spin Wheel for Members** | Look up member by code, spin on their behalf, see balance |
| 2 | **Prize Fulfillment Queue** | Pending prizes from member self-spins, mark as fulfilled |
| 3 | **Quest Validation** | Approve/decline pending quest submissions, view proof URLs |
| 4 | **Manual Quest Completion** | Complete any quest for a member directly, award spins instantly |
| 5 | **Event Check-In** | Check in members by code or from RSVP list, award event spins |
| 6 | **Offer Order Fulfillment** | Process pending offer orders, create walk-in orders |
| 7 | **Member Creation** | Add new members with codes, roles, membership periods, referral tracking |
| 8 | **Staff Account Creation** | Create staff with 4-digit PIN authentication |
| 9 | **Referral Rewards** | Auto-complete referral quests when new member signs up with referral code |
| 10 | **Activity Logging** | All actions logged with timestamps, actor, target, and details |
| 11 | **Telegram Notifications** | Real-time alerts for RSVPs, quest submissions, offer orders, spin wins, email collections |

### C. ADMIN PANEL (what club owners get)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **People Manager** | CRUD members, staff, referral sources; role assignment; premium referrer config |
| 2 | **Quest Builder** | Create/edit quests: 5 types, 3 proof modes, icons (100+), images, deadlines, badges |
| 3 | **Quest Templates** | Quick-add: Instagram, TikTok, YouTube, WhatsApp, Google Review, Photo, Event, Check-In, Referral, Feedback, Tutorial, Email Collect |
| 4 | **Event Manager** | Create/edit events: bilingual content, pricing, images, icons, recurring (RRULE), location, rewards, end time |
| 5 | **Offer Manager** | Two-tier catalog (platform + club-specific), per-club pricing, 7 subtypes, archiving |
| ~~6~~ | ~~**Badge Manager**~~ | **Removed in Phase 4 AI revision.** Badges are now created implicitly via the "Award badge on completion" checkbox on the quest form. The linked badge row inherits `name`, `icon`, and `image_url` from the quest. No standalone badge CRUD UI. |
| 7 | **Spin Wheel Config** | Segments: colors, probabilities, bilingual labels, spin cost, display decimals |
| 8 | **Branding Manager** | Logo, cover image, primary/secondary colors, hero text, social links, Google Place ID |
| 9 | **Gallery Manager** | Upload/order/delete club images with captions |
| 10 | **Login Mode Config** | Code-only vs code+expiry, invite-only toggle, hide member login option |
| 11 | **Invite Button Builder** | Custom invite buttons: WhatsApp, Telegram, direct link, form — with labels, URLs, icons |
| 12 | **Role Manager** | Custom member roles with display order |
| 13 | **Membership Periods** | Duration-based plans (monthly, annual, custom) |
| 14 | **Working Hours** | Per-day open/close times, timezone-aware display |
| 15 | **Location Manager** | Address, city, country, lat/lng, Google Maps URL parser |
| 16 | **Tags/Categories** | 15 predefined tags: bar, restaurant, coffee-shop, nightclub, coworking, sports-club, smoking-club, rooftop, salon, dentist, photographer, tour-guide, gym, events, community |
| 17 | **Telegram Config** | Bot token + chat ID setup, test notification |
| 18 | **Notification Light** | Hardware webhook integration (ESP32) with regenerable secret |
| 19 | **Activity Log Viewer** | Full audit trail: member creation, spins, check-ins, quest validation, orders, email collections |
| 20 | **Referral Tree** | Visualize referral chains, premium referrer management with custom reward amounts |
| 21 | **Email Campaign Manager** | Compose & send branded HTML emails to segmented audiences via Resend |
| 22 | **Audience Segmentation** | Filter recipients by status, membership expiry, role, quest completion, event attendance, offer interest, spin count |
| 23 | **Campaign History** | Track sent campaigns with subject, date, recipient count |
| 24 | **Unsubscribe Management** | JWT-signed unsubscribe links, per-member opt-out tracking |
| 25 | **Telegram Bot Integration** | Configure club for external Telegram registration bot: enable/disable, referral contact name, registration price, welcome message |

### D. PLATFORM ADMIN / TOWER (what we control)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Dashboard Metrics** | Total clubs/members/spins/quests/events, growth (today/week/month), expiring memberships |
| 2 | **Club Management** | View all clubs with metrics, approve/reject, per-club analytics |
| 3 | **AI Club Parser** | Create club from Google Maps URL — auto-extract name, coordinates, resolve shortened URLs |
| 4 | **Manual Club Creation** | Name, slug, colors, logo, cover upload |
| 5 | **Login as Admin** | One-click impersonation into any club's admin panel (JWT cookie) |
| 6 | **Standard Content Setup** | Seed quests + events by club type: smoke, bar, sports, coworking, coffee, general |
| 7 | **Offer Approval** | Approve/reject custom catalog offers submitted by clubs |
| 8 | **Activity Feed** | Recent 50 actions across all clubs |
| 9 | **Invite Request Queue** | Pending club join requests with contact info |
| 10 | **Bulk Quest Import** | Paste CSV from quest planning spreadsheets, preview parsed quests in table, bulk-import into any club with auto badge creation |
| 11 | **Telegram Bot API** | Bearer-auth endpoint serving invite-only club configs to external Telegram registration bot |

### E. PUBLIC & DISCOVERY

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Homepage** | Map hero + tab navigation + curated sections (events, offers, quests, clubs, memberships) |
| 2 | **Discover Page** | Full interactive map + tabs (clubs/events/offers/quests) + filters + collapsible search + near-me |
| 3 | **Deep-Link Offers** | Homepage offer tiles link to /discover#offers:Name with filter pre-selected |
| 4 | **Public Club Page** | Gallery, public quests, events, offers, login form, invite flow, working hours, social links |
| 5 | **Examples (10 verticals)** | Sports, coworking, coffee, tours, regional tours, bars, nightclubs, events calendar + more |
| 6 | **Onboarding (3 steps)** | Create club + tags -> branding + colors -> done. Under 2 minutes. |
| 7 | **SEO** | JSON-LD (Organization, Website, Club, ItemList), OpenGraph, canonical URLs, sitemap |
| 8 | **Legal** | Privacy policy + Terms of Use, bilingual EN/ES, GDPR-compliant, data processor listing |
| 9 | **Pre-registration** | Email-based pre-registration with optional auto-registration (auto-creates inactive member) |
| 10 | **Light/Dark Mode** | Theme toggle with next-themes, persistent preference, auto-detect from OS |
| 11 | **Theme-Aware Map** | Map switches between CARTO Voyager (light) and Dark Matter (dark) basemaps |
| 12 | **Feedback Widget** | Floating feedback button on all pages; categories (bug/idea/question), screenshot upload, sends to Trello |

### F. DESIGN SYSTEM & INFRASTRUCTURE

| # | Feature | Description |
|---|---------|-------------|
| 1 | **OKLch Color System** | Perceptually uniform color space for landing page theming (light/dark) |
| 2 | **Semantic CSS Tokens** | `landing-surface`, `landing-text`, `landing-border` etc. — 7 variables with light/dark variants |
| 3 | **SVG Icon System** | Lucide icons replacing emojis on discover tabs (Building2, CalendarDays, Gift, Target) |
| 4 | **Landing Animations** | 15+ animations: float, rotate, particle, breathe, pulse, twinkle, morph-blob, smoke, spark-ray |
| 5 | **Active Club Filtering** | All public content queries filter by active/approved club IDs — no deactivated club content leaks |

### Technical Feature Counts (for marketing)

- **100+ features** across 5 portals + design system
- **5 quest types** (default, tutorial, feedback, referral, email collect) with 3 proof modes
- **12+ quest templates** (Instagram, TikTok, Google Review, Email Collect, etc.)
- **15 club categories** supported
- **10 example verticals** showcased
- **7 offer subtypes** (food, drink, merch, service, experience, discount, digital)
- **6 club type templates** for instant content setup
- **2 languages** (English + Spanish)
- **2 themes** (Light + Dark mode with OS auto-detect)
- **3-step onboarding** (under 2 minutes)
- **Email marketing** with audience segmentation and branded templates
- **Real-time notifications** via Telegram
- **Feedback widget** with Trello integration
- **Hardware integration** (ESP32 notification light)
- **GDPR-compliant** with full privacy policy + unsubscribe management

---

## Website Content Plan

### Presentation Comparison (Trello card #72)
Source: https://docs.google.com/presentation/d/17VyCeXqLptlNuuYKUXI75EEZtw2242Noz0CYC3kAh4I/edit

| Slide | Theme | Built? | On Website? | Gap |
|-------|-------|--------|-------------|-----|
| 1 | Hook: "Your members walked in today" | N/A | No storytelling hook | **Need compelling hero copy** |
| 2 | Problem: "No names. No data. No way back." | N/A | No pain-point framing | **Need problem statement** |
| 3 | Shift: "They build a loop" | Built | Loop not visualized | **Need engagement loop diagram** |
| 4 | Meet osocios: Three pillars | Built | PlatformOverview | Could be stronger |
| 5 | Loyalty: "Spin. Win. Return." | Built | Mentioned in FeatureGrid | **Need dedicated showcase** |
| 6 | Quests: "Members = marketing team" | Built | Mentioned in features | **Need quest showcase** |
| 7 | Branding: "Looks like you, not us" | Built | /examples shows this | Covered |
| 8 | Events & Services | Built | Mentioned in features | **Need visual showcase** |
| 9 | Three Portals | Built | PlatformOverview with mockups | Covered |
| 10 | Smoking Clubs | Built | /examples has vertical | Covered |
| 11 | Any Club: Vertical grid | Built | /examples page | Covered well |
| 12 | Onboarding: "2 minutes" | Built | HowItWorks section | Covered |
| 13 | Social Proof: Live stats | Built | Hero stats | Covered |
| 14 | CTA: "Your members are waiting" | N/A | FinalCta component | Covered |
| Bonus | Contact | Feedback widget | Floating button | **Still need dedicated contact page** |

### Gaps & Recommendations

**HIGH:** Storytelling on /for-clubs (pain-point hook, engagement loop), feature deep-dives (spin/quests/events/email), contact page, pricing page
**MEDIUM:** Homepage hero tagline, testimonials, getting-started tutorials, documentation site
**LOW:** Blog, API docs, video walkthrough

### Website Structure

```
/ — Map hero + curated sections (events, offers, quests, clubs, memberships)
/for-clubs — B2B landing (NEEDS REWORK: storytelling, feature showcases, pricing, contact)
/discover — Full map experience
/examples — 10 vertical showcases
/onboarding — 3-step club creation
/privacy + /terms
```

### Content Matrix (/for-clubs)

| Section | Copy | Visual |
|---------|------|--------|
| Hero hook | "Your members walked in. You don't know their names." | Dark hero |
| Problem | No data, no retention, no way back | Illustrations |
| The Loop | Visit -> Quest -> Spin -> Return | Animated diagram |
| Spin Wheel | Config, segments, psychology | Wheel animation |
| Quests | 5 types, referral growth, email collect | Card mockups |
| Events | Calendar, RSVP, check-in, rewards | Screenshots |
| Email Marketing | Campaigns, segmentation, templates | Composer screenshot |
| White Label | "Looks like you, not us" | Branded examples |
| Three Portals | Capabilities list | Mockups (exist) |
| Verticals | 10+ club types | UseCases component |
| Pricing | Free tier? Contact? | Pricing table/CTA |
| CTA + Contact | "Your members are waiting" | Form/WhatsApp |

### Tutorials to Write

| Tutorial | Audience |
|----------|----------|
| Getting Started | Club owners — create club, set branding, add members |
| Quest Setup | Club owners — all 5 types, proof modes, badges |
| Spin Wheel Config | Club owners — segments, probabilities, colors |
| Event Management | Club owners — create, RSVPs, check-in |
| Offer Catalog | Club owners — browse, enable, price |
| Email Campaigns | Club owners — compose, segment, track |
| Staff Training | Staff — spin, validate, check-in, fulfill |
| Member Guide | Members — quests, spin, RSVP, email |

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-04-05 | Initial audit — 80+ features across 5 portals |
| 2026-04-07 | Added: email marketing, email collect quest, profile email, light/dark theme, OKLch tokens, feedback widget, optimistic quest UI, collapsible search, map theming, event end time, shortened URL resolver. 100+ features. |
| 2026-04-08 | Added: Telegram bot integration, bulk quest import, auto-registration. Merged master-feature-audit.md into this file. |

---

# Implementation Details

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

## Public Page Enhancements

### Language Switcher on Public Page

**Request:** Add EN/ES language toggle to the public club page — it was the only page missing one.

**Changes:** Imported `LanguageSwitcher` from `lib/i18n/switcher.tsx` into `app/[clubSlug]/public/page.tsx`. Placed it inside the hero `div` with absolute positioning (`absolute top-3 right-3 z-20`) using `variant="light"` for visibility over the dark hero background. `LanguageProvider` was already in the root layout, so no wrapping needed.

**How it works:** The EN/ES toggle floats in the top-right corner of the hero image on every public club page. Clicking it writes the `clubos-lang` cookie and triggers `router.refresh()`, re-rendering all server-rendered content in the selected language.

**Key files:**
- `app/[clubSlug]/public/page.tsx` — switcher placement inside hero div

### Public Page Full Localization

**Request:** All hardcoded English strings on the public page needed to be localized — they were left in English even after adding the language switcher.

**Changes:** Replaced 7 hardcoded English strings with `localized()` calls: "Upcoming Events"→"Próximos Eventos", "Quests"→"Misiones", "Offers"→"Ofertas", "Free"→"Gratis", "Learn more"→"Más info", "at"→"a las". Updated `formatDate()` to use locale-aware formatting (`es-ES` vs `en-US`).

**How it works:** All section headers, labels, and date formatting on the public page now respect the user's language setting. Uses inline `localized(en, es, locale)` calls rather than dictionary keys since these are page-specific strings.

**Key files:**
- `app/[clubSlug]/public/page.tsx` — all section headers and labels localized

### Hide Member Login on Invite-Only Clubs

**Request:** Admin toggle to hide the member login form from the public page when a club is invite-only.

**Changes:** Added `hide_member_login boolean DEFAULT false` column to `clubs` table. Created `updateHideMemberLogin` server action. Added sub-checkbox in `LoginModeManager` (only visible when invite-only is checked): "Hide member login from public page". Public page wraps login form in `{!(club.invite_only && club.hide_member_login) && (...)}`. Added `hide_member_login` to settings page query, admin component props, and public page query.

**How it works:** When admin enables invite-only AND checks "Hide member login", the login form disappears from the public page. The direct login URL (`/[clubSlug]/login`) still works — this only affects the public page. When invite-only is unchecked, the hide setting is preserved in DB but has no effect (both flags required). Added i18n keys for EN/ES.

**Key files:**
- `supabase/migrations/20260321100000_add_hide_member_login.sql` — new column
- `lib/types/database.ts` — `hide_member_login` in Row/Insert/Update types
- `app/[clubSlug]/admin/login-mode-manager.tsx` — sub-checkbox UI + handler
- `app/[clubSlug]/admin/actions.ts` — `updateHideMemberLogin` action
- `app/[clubSlug]/admin/(panel)/settings/page.tsx` — query + prop passing
- `app/[clubSlug]/public/page.tsx` — conditional rendering of login form

### Contact Text Update (osocios branding)

**Request:** Change invite-only public page text from "Contact us through:" to reference osocios as the platform that handles member onboarding.

**Changes:** Updated `public.contactThrough` i18n key in both dictionaries. EN: "Contact osocios to get your member ID:", ES: "Contacta osocios para obtener tu ID de socio:".

**How it works:** On invite-only clubs using social buttons mode, the text now directs users to contact osocios (the platform) rather than vaguely saying "contact us". This supports the monetization model where osocios handles member acquisition.

**Key files:**
- `lib/i18n/dictionaries/en.json` — `public.contactThrough` key
- `lib/i18n/dictionaries/es.json` — same key in Spanish

## Offers System

### Offers Tile Grid View (Public + Member Pages)

**Request:** Replace the vertical list layout for offers with a compact tile/icon grid on both public and member pages.

**Changes:** Replaced the `divide-y` list layout in the public page offers section with a responsive `grid grid-cols-2 sm:grid-cols-3 gap-2` tile grid. Each tile: centered icon/image (w-10 h-10 rounded-full), name below, compact `rounded-xl shadow` card. Same grid applied to member page `offer-list-client.tsx` but with interactive features: price badge (absolute top-right), tap-to-request/cancel (onClick handler on the tile div), and "Requested" status pill.

**How it works:** Offers display as app-icon-style tiles in a 2-3 column responsive grid, grouped by subtype with localized headers. On the member page, orderable tiles are tappable — clicking triggers request/cancel. Price shows as a small badge in the top-right corner. Non-orderable tiles have no click handler. Descriptions are omitted from tile view for compactness.

**Key files:**
- `app/[clubSlug]/public/page.tsx` — tile grid in offers section
- `app/[clubSlug]/(member)/offers/offer-list-client.tsx` — interactive tile grid with request/cancel

### Admin Offers Collapse/Expand (Accordion)

**Request:** Admin offers page shows all enabled offers fully expanded with all config fields — overwhelming with many offers. Collapse by default, expand on "Edit".

**Changes:** Refactored `OfferManager` component with `expandedOfferId` state for accordion behavior. `OfferRow` now has two states: collapsed (icon + name + toggle + status badges + Edit button) and expanded (full config form). Clicking Edit expands that offer and collapses any other. Save collapses back to preview. Added `isExpanded`, `onToggleExpand`, `onArchive`, and `t` props to `OfferRow`.

**How it works:** All enabled offers show collapsed by default — compact row with icon, name, and small status badges ("Orderable", "Public", price). Clicking "Edit" expands to the full config form (descriptions, icon picker, image upload, etc.). Only one offer can be expanded at a time (accordion). After saving, the offer auto-collapses.

**Key files:**
- `app/[clubSlug]/admin/offer-manager.tsx` — `OfferManager` + `OfferRow` with accordion state

### Admin Offers Archive

**Request:** Admin needs a way to soft-hide offers without permanently deleting them (toggle-off does a hard delete). Add archive/restore with a dedicated tab.

**Changes:** Added `archived boolean DEFAULT false` to `club_offers`. Created `archiveOffer` and `restoreOffer` server actions. Added "Archived" tab to `OfferManager` (appears when archived offers exist, shows count). Archive button in expanded edit view (red/destructive styling). Restore button on archived tab rows. All listing queries (member, public, staff) filter `.eq("archived", false)`.

**How it works:** Two paths to remove offers: toggle-off (hard DELETE, loses all config) vs archive (sets `archived=true`, preserves config). Archived offers disappear from member, public, and staff views but remain in admin under the "Archived" tab with a Restore button. Existing pending orders for archived offers can still be fulfilled by staff — archiving only affects browse/listing views.

**Key files:**
- `supabase/migrations/20260321200000_add_offer_archived.sql` — archived column
- `app/[clubSlug]/admin/offer-manager.tsx` — archived tab UI, archive/restore buttons
- `app/[clubSlug]/admin/actions.ts` — `archiveOffer`, `restoreOffer` actions
- `app/[clubSlug]/admin/(panel)/offers/page.tsx` — passes `archived` to component
- `app/[clubSlug]/(member)/offers/page.tsx` — filters archived
- `app/[clubSlug]/public/page.tsx` — filters archived
- `app/[clubSlug]/staff/(console)/offers/page.tsx` — filters archived

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

## SEO, Metadata & Structured Data

### Root Metadata Foundation

**Request:** Prepare the platform for public launch with proper SEO across all public pages.

**Changes:** Updated `app/layout.tsx` with `metadataBase` (from `NEXT_PUBLIC_SITE_URL` env var, defaults to `https://osocios.club`), title template `%s | osocios.club`, rich description with keywords, OpenGraph defaults (`type: "website"`, `siteName`, `locale`), Twitter card `summary_large_image`, and multi-format icon references (`.ico`, `.svg`, `.png`). Added dedicated `metadata` export to `app/page.tsx` with landing-specific title (absolute, overrides template), description, and canonical URL with hreflang alternates.

**How it works:** All pages inherit the root metadata template. Sub-pages only need to set `title: "Page Name"` and it renders as "Page Name | osocios.club". The landing page overrides with an absolute title. `metadataBase` enables relative URLs in all metadata (canonicals, OG images resolve against it automatically).

**Key files:**
- `app/layout.tsx` — `metadataBase`, title template, OG/Twitter defaults, icon config
- `app/page.tsx` — landing-specific metadata with absolute title

### robots.txt & Dynamic Sitemap

**Request:** Create robots.txt and sitemap.xml for search engine crawling and indexing.

**Changes:** Created `app/robots.ts` using Next.js Metadata API — allows crawling of public routes (`/`, `/discover`, `/examples/`, `/*/public`), blocks auth-required routes (`/*/staff/`, `/*/admin/`, `/*/login`, `/onboarding`, `/platform-admin`, `/api/`). Created `app/sitemap.ts` — dynamic sitemap that includes static pages with priorities (landing 1.0, discover 0.9, examples 0.5, legal 0.3), all vertical example slugs from `VERTICALS` array, and dynamically queries the `clubs` table for active+approved club slugs to generate `/{slug}/public` URLs (priority 0.7). Uses `createAdminClient` for the DB query.

**How it works:** Next.js auto-serves `/robots.txt` and `/sitemap.xml` from these route files. The sitemap regenerates on each request with live club data. The middleware matcher was updated to exclude `robots.txt`, `sitemap.xml`, and `manifest.webmanifest` from auth checks (they were being intercepted as club slugs).

**Key files:**
- `app/robots.ts` — allow/disallow rules, sitemap reference
- `app/sitemap.ts` — static pages + dynamic club profiles from DB
- `middleware.ts` — matcher updated to exclude metadata routes

### OG Images (Code-Generated)

**Request:** Create social sharing preview images for all public pages.

**Changes:** Created 4 `opengraph-image.tsx` files using Next.js `ImageResponse` from `next/og`. All use edge runtime and render 1200x630 PNG images: (1) `app/opengraph-image.tsx` — default landing image with logo mark, brand name, tagline, feature pills; (2) `app/discover/opengraph-image.tsx` — "Find clubs, events & services near you"; (3) `app/examples/opengraph-image.tsx` — "See it in action" with industry category pills; (4) `app/[clubSlug]/public/opengraph-image.tsx` — dynamic per-club image that fetches club name, primary color, and tags from DB, renders club initial in a colored square with tag pills.

**How it works:** Next.js automatically discovers `opengraph-image.tsx` files and generates `<meta property="og:image">` tags pointing to the generated image URL. The club OG image is dynamic — each club gets a unique preview with their branding color and tags. All images use a dark background with the green brand accent. No external image files needed — everything is rendered from JSX at request/build time.

**Key files:**
- `app/opengraph-image.tsx` — default/landing OG image
- `app/discover/opengraph-image.tsx` — discover page OG
- `app/examples/opengraph-image.tsx` — examples page OG
- `app/[clubSlug]/public/opengraph-image.tsx` — dynamic per-club OG (fetches from DB)

### JSON-LD Structured Data

**Request:** Add schema.org structured data for search engines and LLMs.

**Changes:** Created `lib/structured-data.ts` with 4 helper functions: `getOrganizationJsonLd()` (platform Organization schema with name, URL, logo, description, Barcelona founding location), `getWebSiteJsonLd()` (WebSite with SearchAction pointing to `/discover`), `getClubJsonLd(club)` (per-club Organization with name, URL, logo, tags as keywords, address if available, `memberOf` linking to platform), `getItemListJsonLd(items)` (ItemList for directory listings). Added JSON-LD `<script>` tags to: landing page (Organization + WebSite), club public page (Club schema), discover page (ItemList of clubs).

**How it works:** Each public page includes `<script type="application/ld+json">` blocks with structured data. Google and LLMs can parse these to understand: osocios.club is an organization based in Barcelona, it has a search feature at `/discover`, each club is a sub-organization with its own profile, and the discover page lists clubs as an ItemList. The helpers return plain objects — pages stringify them inline.

**Key files:**
- `lib/structured-data.ts` — all JSON-LD helper functions
- `app/page.tsx` — Organization + WebSite JSON-LD
- `app/[clubSlug]/public/page.tsx` — Club JSON-LD
- `app/discover/page.tsx` — ItemList JSON-LD

### Page-Level Metadata Enrichment

**Request:** Add canonical URLs, hreflang alternates, and descriptions to all public pages.

**Changes:** Updated metadata exports on 6 pages: discover (changed title from "Discover | osocios.club" to template-based "Discover", added richer description, canonical, hreflang), examples (same pattern), vertical examples (canonical with slug, hreflang), privacy (added description about GDPR/Spain, canonical, hreflang), terms (added description, canonical, hreflang), club public profile (enriched `generateMetadata` to fetch tags and logo, generate description from tags, add OG data with logo image, canonical, hreflang).

**How it works:** Since locale is cookie-based (not URL-based), hreflang `en`, `es`, and `x-default` all point to the same URL. This tells search engines both languages are served from the same path. Canonical URLs use relative paths (resolved against `metadataBase`). Club profiles now have dynamic descriptions like "Club Name on osocios.club — tag1, tag2, tag3".

**Key files:**
- `app/discover/page.tsx` — canonical, hreflang, richer description
- `app/examples/page.tsx` — canonical, hreflang
- `app/examples/[vertical]/page.tsx` — dynamic canonical with slug
- `app/(legal)/privacy/page.tsx` — description, canonical, hreflang
- `app/(legal)/terms/page.tsx` — description, canonical, hreflang
- `app/[clubSlug]/public/page.tsx` — dynamic description from tags, OG with logo, canonical

### Brand Icons & PWA Manifest

**Request:** Create proper favicon, apple-touch-icon, and PWA manifest for the platform.

**Changes:** Created `public/logo.svg` — green (#16a34a) rounded square with a ring (the "O") and 3 dots representing community members. Converted via ImageMagick to: `app/icon.ico` (multi-res 48/32/16), `app/apple-icon.png` (180x180), `public/logo-192.png` and `public/logo-512.png` (PWA sizes). Created `app/manifest.ts` — PWA manifest with `name: "osocios.club"`, `display: "standalone"`, green theme color, icon references. Updated `app/layout.tsx` icon config to reference all formats.

**How it works:** Next.js auto-discovers `icon.ico`, `apple-icon.png`, and `manifest.ts` from the `app/` directory and generates the appropriate `<link>` tags. The SVG favicon remains as a secondary icon format. The PWA manifest enables "Add to Home Screen" on mobile with the green brand theme. All icon formats derive from the same `logo.svg` source.

**Key files:**
- `public/logo.svg` — source logo (green rounded square + ring + 3 member dots)
- `app/icon.ico` — multi-resolution favicon
- `app/apple-icon.png` — 180x180 Apple touch icon
- `public/logo-192.png`, `public/logo-512.png` — PWA icons
- `app/manifest.ts` — PWA web app manifest

## Analytics & Monitoring

### Vercel Analytics + Speed Insights

**Request:** Add analytics and performance monitoring for launch.

**Changes:** Installed `@vercel/analytics` and `@vercel/speed-insights` via pnpm. Added `<Analytics />` and `<SpeedInsights />` components to `app/layout.tsx` inside `<body>`, after children. Decision: skip Google Analytics at launch (adds GDPR cookie consent complexity under Spanish AEPD), skip Sentry (add when traffic warrants). Vercel Analytics is privacy-friendly (no cookies, no consent banner needed).

**How it works:** Both components are zero-config — they activate automatically on Vercel deployments. `Analytics` tracks pageviews, unique visitors, referrers, top pages, countries, devices. `SpeedInsights` tracks Core Web Vitals (LCP, CLS, INP) from real users. Data appears in the Vercel Dashboard under the Analytics and Speed Insights tabs within minutes of first visit. No env vars or API keys needed.

**Key files:**
- `app/layout.tsx` — `<Analytics />` and `<SpeedInsights />` in body
- `package.json` — `@vercel/analytics`, `@vercel/speed-insights` dependencies

## PWA & Web Push

The base PWA manifest at `app/manifest.ts` (see "Brand Icons & PWA Manifest" under SEO) covers the marketing site. Per-club PWA install and web push live in this section.

### Per-Club PWA Install (iOS Add to Home Screen)

**Request:** When a member installs the club PWA on iOS, the home-screen icon should be the club's logo on the club's primary color (not the generic osocios green), and tapping the icon should launch into that club's member portal — not osocios.club's landing page. Existing static manifest had `start_url: "/"` and global icons, so on iOS 16.4+ Safari (which honors manifest start_url) every install opened the wrong place.

**Changes:**
- New dynamic route handler `app/[clubSlug]/manifest.webmanifest/route.ts` — reads `clubs + club_branding` via the cached `getClub()` helper and returns a per-club manifest with `name`, `start_url: /{clubSlug}`, `scope: /{clubSlug}/`, `theme_color` from `club_branding.primary_color`, and `icons` pointing at the per-club icon route.
- New dynamic route handler `app/[clubSlug]/icon.png/route.tsx` — uses `next/og`'s `ImageResponse` to composite the club's `logo_url` (fetched and embedded as a base64 data URL) onto a square canvas filled with the club's `primary_color`. Two sizes via `?size=180|512` query param. Falls back to a white-on-color monogram (first letters of the club name) when `logo_url` is null or fetch fails.
- Member layout's `generateMetadata` extended to emit `manifest`, `appleWebApp` (with the club name as the standalone title), and `icons.apple` referencing the per-club icon route.
- `components/club/add-to-homescreen.tsx` rewritten: previously dead code, now an iOS-only banner that shows on the member home page with a compact card (Share icon + title + tagline + "Show me how" button + dismiss). Module-level `A2HS_TEST_MODE` constant gates whether the banner shows on every load (test mode) or once-per-club via localStorage (production). Rendered from the member home page (`app/[clubSlug]/(member)/page.tsx`).
- `middleware.ts` allowlists `/{clubSlug}/manifest.webmanifest` and `/{clubSlug}/icon.png` so iOS Safari can fetch them anonymously without being redirected to the member login. Same fix later applied to `/a2hs/*` static assets and `/sw.js` (see web push entry below). Also added `a2hs` and `sw.js` to `lib/reserved-slugs.ts` so club onboarding can't collide with these reserved paths.

**How it works:** When iOS Safari renders a club page, the member layout injects `<link rel="manifest" href="/{slug}/manifest.webmanifest">`, `<link rel="apple-touch-icon" href="/{slug}/icon.png">`, and `<meta name="apple-mobile-web-app-title" content="{Club Name}">`. Both routes are fully dynamic (cached `public, max-age=300, s-maxage=3600, stale-while-revalidate=86400`), so a club owner editing their logo or color sees the new icon on new installs within ~5 minutes — no admin action, no migration, no per-club setup. Existing clubs adopt the feature automatically: clubs with `logo_url` get their real logo composited on their primary color; clubs without one get a clean monogram tile.

**Key files:**
- `app/[clubSlug]/manifest.webmanifest/route.ts` — per-club web manifest
- `app/[clubSlug]/icon.png/route.tsx` — per-club apple-touch-icon (180/512), monogram fallback
- `app/[clubSlug]/(member)/layout.tsx` — `generateMetadata` injects manifest + apple-touch-icon + appleWebApp meta
- `app/[clubSlug]/(member)/page.tsx` — renders `<AddToHomescreen clubSlug={clubSlug} />` above the bento grid
- `components/club/add-to-homescreen.tsx` — banner with three modes (install / subscribe / hidden), test-mode flag, club-scoped once-only localStorage key
- `middleware.ts` — allowlists `/manifest.webmanifest`, `/icon.png`, `/a2hs/*`, `/sw.js`
- `lib/reserved-slugs.ts` — reserves `a2hs` and `sw.js`

### A2HS Walkthrough Modal (4-Step Visual Guide)

**Request:** The single-line "Tap the Share button, then Add to Home Screen" copy on the install banner is wrong for modern iOS Safari — the real flow is four taps and "Add to Home Screen" is hidden behind the "View More" button in the share sheet by default. Members were giving up before finding it. Replace the one-line text with a tap-through visual walkthrough.

**Changes:**
- New `components/club/add-to-homescreen-modal.tsx` — a bottom-sheet dialog (slides up from the bottom, backdrop fades in) with a scrollable vertical stack of 4 step cards. Each card has a numbered badge + caption + iPhone Safari screenshot. Uses a separate `visible`/`animating` state pair so the close animation plays before unmount. Body scroll lock uses `position: fixed; top: -<scrollY>px` (iOS Safari ignores `overflow: hidden` for touch scrolling — the fixed-body trick is the canonical workaround). Inner scroll container has `overscroll-behavior: contain` to block rubber-band chaining at boundaries. Focus moves to the close button on open, returns to the trigger on close. Escape key closes. Drag handle is decorative (no swipe-to-dismiss in v1).
- 4 real iPhone screenshots cropped from raw 1206×2622 captures down to the relevant UI element only (Safari bar / Share popup / share-sheet bottom row with View More / expanded share sheet showing Add to Home Screen). Resized to 800px wide JPEG quality 90 via ImageMagick. Files at `public/a2hs/step-1.jpg` through `step-4.jpg`, ~35 KB each, ~160 KB total.
- 8 new i18n keys for both EN and ES: `a2hs.tagline`, `a2hs.showMe`, `a2hs.stepsTitle`, `a2hs.step1`–`a2hs.step4`, `a2hs.close`. Old `a2hs.ios` and `a2hs.android` keys left in the dictionaries as dead keys.
- Banner `components/club/add-to-homescreen.tsx` changed from a single inline-text card to a compact card with a "Show me how" button that opens the modal. The animated `animate-a2hs-bounce` arrow from the previous iteration is dead CSS in `app/globals.css` (left in place — harmless).

**How it works:** The install state of the A2HS card now reads "Add to Home Screen / Install for quick access" + a "Show me how" button. Tapping the button opens the bottom sheet with the four screenshots and captions. Captions use the modern iOS flow: tap ⋯ → tap Share → scroll and tap View More → tap Add to Home Screen. Modal is fully accessible (`role="dialog"`, focus trap, Escape, backdrop tap), and body scroll is properly locked on iOS — earlier iterations had a sporadic scroll-chaining bug where touches leaked to the page underneath, fixed by switching from `body.style.overflow = "hidden"` to the position-fixed-and-restore-scroll pattern.

**Key files:**
- `components/club/add-to-homescreen-modal.tsx` — bottom-sheet dialog with 4 step cards, focus management, body scroll lock
- `components/club/add-to-homescreen.tsx` — banner trigger ("Show me how" button)
- `public/a2hs/step-1.jpg` — Safari bottom bar with ⋯
- `public/a2hs/step-2.jpg` — ⋯ popup with Share row
- `public/a2hs/step-3.jpg` — share sheet bottom row with View More
- `public/a2hs/step-4.jpg` — expanded share sheet with Add to Home Screen
- `lib/i18n/dictionaries/en.json`, `lib/i18n/dictionaries/es.json` — `a2hs.*` keys

### Web Push Notifications (Members v1)

**Request:** Members on iOS PWA install should be able to subscribe to web push notifications, and an admin should be able to send a test push from a new admin page that arrives on every subscribed member's device. Self-hosted, no third-party SDK, full data ownership. Phase 1 is members only — staff push and transactional triggers (member→staff on order, staff→member on approval, admin segmentation) are deferred to follow-up phases.

**Changes:**
- New Supabase migration `20260415150000_add_push_subscriptions.sql` creates `push_subscriptions` (id, member_id, club_id, endpoint, p256dh, auth, user_agent, created_at, last_seen_at), unique on `endpoint`, indexes on `member_id` and `club_id`, RLS policy permitting only the service role.
- `web-push` and `@types/web-push` added as dependencies. VAPID keypair generated via `npx web-push generate-vapid-keys` and stored in `.env.local` and Vercel preview(develop) + production as `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (mailto: jnamed@gmail.com), `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.
- New global service worker `public/sw.js` (hand-written vanilla JS, no build step). Handles `push` events (decodes payload, calls `showNotification` with title/body/icon/data) and `notificationclick` events (focuses an existing PWA tab pointing at the click URL or opens a new one). Uses `skipWaiting` + `clients.claim` so updates take effect immediately. `middleware.ts` allowlists `/sw.js` so it serves at root scope `/`.
- `lib/push/client.ts` — browser helpers: `registerServiceWorker()`, `getExistingSubscription()`, `subscribeToPush(vapidKey)` (idempotent, returns existing subscription if present, otherwise asks `Notification.requestPermission()` then calls `pushManager.subscribe`). Internal `urlBase64ToUint8Array` for the VAPID key conversion the Web Push API requires.
- `lib/push/send.ts` — server-side sender. Two public functions: `sendPushToClub(clubId, payload)` and `sendPushToMember(memberId, payload)`, both returning `{ sent, removed }`. Internal `sendToSubscriptions` helper does the per-subscription try/catch with parallel `Promise.all`, lazily initialises `web-push` on first call (so missing env vars don't crash at import time), and deletes stale subscriptions in a single batch when the push service returns 404 or 410.
- `app/[clubSlug]/(member)/push-actions.ts` — `savePushSubscription` server action. Validates the member cookie via `getMemberFromCookie()`, validates the subscription has the three required fields, upserts into `push_subscriptions` keyed by `endpoint` (so re-subscribing from the same device is idempotent). Returns a `{ ok: true } | { ok: false, error }` discriminated union.
- `components/club/add-to-homescreen.tsx` evolved into a 3-state progressive install card: `install` (iOS, not standalone) shows the existing "Show me how" walkthrough; `subscribe` (standalone, not subscribed) shows a Bell icon + "Enable notifications" + "Never miss events and offers" + a Subscribe button that runs `subscribeToPush` → `savePushSubscription` → toast → hide; `hidden` once subscribed (forever — not gated by `A2HS_TEST_MODE`, which only gates the install state). Sonner toast for success/blocked/error states.
- 6 new i18n keys for both EN and ES: `a2hs.subscribeTitle`, `a2hs.subscribeTagline`, `a2hs.subscribe`, `a2hs.subscribing`, `a2hs.subscribed`, `a2hs.blocked`.
- New admin page at `/[clubSlug]/admin/push` — server component renders a `PushForm` client component with title (max 80) / body (max 300) / optional link inputs and a "Send test notification" button. `sendTestPush` server action validates the owner cookie via `getOwnerFromCookie()`, validates lengths, calls `sendPushToClub(session.club_id, payload)`, returns `{ ok: true, sent, removed }` or `{ ok: false, error }`. Sonner toast reports the outcome.
- The admin Settings page (`app/[clubSlug]/admin/(panel)/settings/page.tsx`) gains a new `<CollapsibleSection title="Push Notifications">` (placed right after "Notification Light") containing a card link to `/admin/push`. The 4-tab admin bottom nav was deliberately not extended — the Settings card is the navigation entry point.

**How it works:** A member installs the club PWA via the existing walkthrough, launches it from the home screen, and lands on the member home page. The A2HS card detects standalone mode and queries the service worker for an existing push subscription. With no subscription found, it switches to the subscribe state. The member taps Subscribe; the browser shows the permission prompt; on grant, `pushManager.subscribe` returns a subscription object which is upserted into Supabase. The card hides and a toast confirms. Meanwhile the club owner opens Admin → Settings → Push Notifications, lands on the compose page, fills in title and body, and clicks Send. The action queries `push_subscriptions` for the club's rows, signs and POSTs the encrypted payload to each device's push service via `web-push`, and the service worker on each device wakes up and shows the notification. Stale subscriptions (404/410) are auto-deleted in the same call so the table self-cleans. Tapping the notification on the member device focuses an existing PWA tab at the click URL or opens a new one.

**Out of scope (deferred):** staff push subscription, member→staff transactional triggers (new order → push to staff), staff→member transactional triggers (approval → push to member), admin segmentation/scheduled sends/analytics, subscriber list UI, notification action buttons / images / badges. The Telegram informer (`/api/notify/[clubId]`) stays as the staff signal until a future phase.

**Key files:**
- `supabase/migrations/20260415150000_add_push_subscriptions.sql` — table + indexes + RLS
- `public/sw.js` — service worker (push + notificationclick handlers)
- `lib/push/client.ts` — browser helpers (register, subscribe, getExisting)
- `lib/push/send.ts` — server sender (`sendPushToClub`, `sendPushToMember`, stale cleanup)
- `app/[clubSlug]/(member)/push-actions.ts` — `savePushSubscription` server action
- `components/club/add-to-homescreen.tsx` — 3-state install / subscribe / hidden card
- `app/[clubSlug]/admin/(panel)/push/page.tsx` — admin compose page
- `app/[clubSlug]/admin/(panel)/push/push-form.tsx` — title/body/link form (client)
- `app/[clubSlug]/admin/(panel)/push/actions.ts` — `sendTestPush` server action with input validation
- `app/[clubSlug]/admin/(panel)/settings/page.tsx` — collapsible section linking to `/admin/push`
- `middleware.ts` — `/sw.js` allowlist
- Vercel env: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (preview(develop) + production)

## GitHub Workflow

### gh CLI Token Fix

**Request:** Fix `gh` CLI not having PR creation permissions, making the workflow inconvenient.

**Changes:** Removed the `GITHUB_TOKEN` export from `~/.zshrc` — it was a fine-grained PAT that lacked PR/issue permissions and was overriding the better keychain-stored OAuth token (which has `repo`, `workflow`, `gist`, `read:org` scopes). The keychain token was already set up via `gh auth login` but was marked "inactive" because the env var took precedence.

**How it works:** With the env var removed, `gh` uses the keychain token (set via `gh auth login` OAuth flow). This token has full `repo` scope — PRs, issues, releases all work. New terminal sessions pick it up automatically. The keychain token is managed by macOS Keychain and `gh` handles refresh. No manual token management needed.

**Key files:**
- `~/.zshrc` — `GITHUB_TOKEN` line replaced with comment

## Trello CLI (token-efficient replacement for Trello MCP)

### Local `trello` CLI wrapping the REST API

**Request:** Stop using the `mcp__trello__*` tools in `/work`, `/clarify`, and `/feedback-work` because they return bloated payloads that burn context tokens. Use a CLI instead.

**Changes:** Created `~/.local/bin/trello`, a ~100-line bash script that wraps the Trello REST API with `curl` + `jq` and returns compact JSON shaped for LLM consumption. Supports `list`, `card`, `comment`, `move`, `add`, and `lists`. Accepts list aliases (`critical`, `feedback`, `inprogress`, `qa`) so list IDs stay out of prompts. Reads `TRELLO_API_KEY` and `TRELLO_TOKEN` from env (already persisted in `~/.zshrc`). Board ID hardcoded to `69b17b5c03c1268fdd0dd0eb` (osocios.club). Updated `.claude/commands/work.md`, `.claude/commands/clarify.md`, and `~/.claude/skills/feedback-work/SKILL.md` to call the CLI and explicitly forbid `mcp__trello__*`.

**How it works:** In a Claude session, instead of invoking an MCP tool that returns a large JSON blob with every field Trello knows, the model runs `trello list critical` / `trello card <id>` / `trello move <id> qa` / `trello comment <id> "@mikitatrayan test: ..."` via Bash. The script only requests and emits the fields the workflows actually need (id, name, labels, due, members, short desc, checklists, last 20 comments), shrinking per-call output roughly 5–10×. `trello help` prints the full surface. Fails fast if env vars are missing.

**Key files:**
- `~/.local/bin/trello` — the CLI script (curl + jq wrapper, list aliases, compact JSON output)
- `.claude/commands/work.md` — daily work session; now calls `trello list/card/move/comment`
- `.claude/commands/clarify.md` — clarify-unclear-cards flow; now calls `trello list/card/comment`
- `~/.claude/skills/feedback-work/SKILL.md` — feedback processing flow; now calls `trello list/card/move/comment`
- `~/.zshrc` — holds `TRELLO_API_KEY` and `TRELLO_TOKEN` so the CLI works in any shell/session
