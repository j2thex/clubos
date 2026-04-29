# ClubOS — Architecture & Feature Reference

> Last updated: 2026-04-25
> Engineering reference: feature inventory + thin implementation pointers. Marketing/strategy lives in `docs/website.md`. Maintained by the `/document` skill.

---

## Platform Feature Inventory

### A. MEMBER PORTAL

| # | Feature | Description |
|---|---------|-------------|
| 1 | Member Code Login | Code-only or code+expiry (DDMM) authentication |
| 2 | Personalized Dashboard | Club-branded hero, stats, quests, gallery |
| 3 | Welcome Overlay | First-visit tutorial |
| 4 | Spin the Wheel | Weighted segments, confetti, result overlay |
| 5 | Spin Balance & History | Remaining spins, full history page |
| 6 | Quests — Default | Simple task tracking, staff validates |
| 7 | Quests — Tutorial | Step-by-step with checkboxes (local progress) |
| 8 | Quests — Feedback | Text submission collection |
| 9 | Quests — Referral | Share link, auto-complete on new signup |
| 10 | Quests — Email Collect | Email entry → spins, saved to profile |
| 11 | Quest Proof Modes | None / Optional / Required (URL or text) |
| 12 | Quest Deadlines | Auto-expire with countdown badge |
| 13 | Optimistic Quest UI | Instant "Pending" badge with rollback |
| 14 | Badge Collection | Earn from quests, locked vs unlocked view |
| 15 | Events — List View | Upcoming events with RSVP |
| 16 | Events — Calendar View | Month grid with day selection |
| 17 | Events — Detail Page | Full image, RSVP/cancel, check-in status |
| 18 | Events — RSVP | Sign up / cancel; blocked when past or checked in |
| 19 | Event End Time | Optional duration display |
| 20 | Offers | Browse by subtype, request/cancel orders |
| 21 | Referral System | Share link, track referrals |
| 22 | Member Profile | QR code, badges, history, referrals, logout |
| 23 | Profile Email Field | Add/update email on profile |
| 24 | Photo Gallery | Horizontal scroll with lightbox |
| 25 | Social Links | IG, WhatsApp, Telegram, Maps, Website |
| 26 | Membership Expiry | Color-coded validity, auto-redirect on expiry |
| 27 | Level System | 1–10 based on spin count |
| 28 | Bilingual UI | EN/ES via cookie |
| 29 | Mobile-First Design | Bottom nav, safe-area insets, 44px+ targets |
| 30 | PWA Install + Push | Per-club manifest, A2HS walkthrough, web push |
| 31 | Recent Purchases | Ops-only: last 5 product transactions on profile |

### B. STAFF CONSOLE

| # | Feature | Description |
|---|---------|-------------|
| 1 | Spin Wheel for Members | Look up by code, spin on their behalf |
| 2 | Prize Fulfillment Queue | Pending self-spin prizes |
| 3 | Quest Validation | Approve/decline submissions |
| 4 | Manual Quest Completion | Complete any quest for any member |
| 5 | Event Check-In | By code or RSVP list, awards spins |
| 6 | Offer Order Fulfillment | Process orders, walk-in creation |
| 7 | Member Creation | Codes, roles, periods, referral tracking |
| 8 | Staff Account Creation | 4-digit PIN auth |
| 9 | Referral Rewards | Auto-complete referral quests on signup |
| 10 | Activity Logging | All actions logged with actor + target |
| 11 | Telegram Notifications | RSVPs, quests, orders, wins, emails |
| 12 | Operations Tab (ops) | Door entry, capacity, products, sell, transactions |
| 13 | Pre-registrations | Approve/process pre-registered members |

### C. ADMIN PANEL

| # | Feature | Description |
|---|---------|-------------|
| 1 | People Manager | Members, staff, referral sources; roles; premium referrers |
| 2 | Quest Builder | 5 types, 3 proof modes, icons, images, deadlines, badges |
| 3 | Quest Templates | 12+ presets (IG, TikTok, YouTube, Email, etc.) |
| 4 | Event Manager | Bilingual, pricing, recurring (RRULE), end time |
| 5 | Offer Manager | Two-tier catalog, per-club pricing, archiving, product link |
| 6 | Spin Wheel Config | Segments, probabilities, bilingual labels, cost |
| 7 | Branding Manager | Logo, cover, colors, hero, social, Place ID |
| 8 | Gallery Manager | Upload/order/delete with captions |
| 9 | Login Mode Config | Code-only vs code+expiry, invite-only, hide login |
| 10 | Invite Button Builder | WhatsApp / Telegram / link / form |
| 11 | Role Manager | Custom member roles + display order |
| 12 | Membership Periods | Duration plans (monthly/annual/custom) |
| 13 | Working Hours | Per-day open/close, timezone-aware |
| 14 | Location Manager | Address, lat/lng, Maps URL parser |
| 15 | Tags / Categories | 15 predefined club tags |
| 16 | Telegram Config | Bot token + chat ID + test |
| 17 | Notification Light | ESP32 webhook, regenerable secret |
| 18 | Activity Log Viewer | Audit trail with category filters (incl. Operations) |
| 19 | Referral Tree | Visualize chains, premium referrers |
| 20 | Email Campaign Manager | Branded HTML via Resend |
| 21 | Audience Segmentation | Filter by status, expiry, role, quest, event, spins |
| 22 | Campaign History | Sent campaigns log |
| 23 | Unsubscribe Management | JWT-signed links, per-member opt-out |
| 24 | Telegram Bot Integration | External bot config, referral name, price |
| 25 | Web Push (Members v1) | VAPID, send-to-club test from `/admin/push` |
| 25b | Telegram Member Subs | Per-club bot, /start opt-in, multi-channel broadcasts via Email Campaigns |
| 26 | Operations Module Toggle | Per-club flag to enable ops surfaces |
| 27 | Products Manager | Categories + products, bilingual, stock, archive |
| 28 | Finance Dashboard | Revenue chart, category breakdown, date range, CSV |
| 29 | Saldo Ledger | Member balance ledger (ops finance) |
| 30 | QR Codes Manager | Bulk QR generation for member cards |
| 31 | Setup Wizard | Onboarding checklist of admin tasks |
| 32 | AI Quest/Setup Prompts | One-shot AI generation; uses club social links as context |
| 33 | Visibility Manager | Public/private flags across entities |

### D. PLATFORM ADMIN

| # | Feature | Description |
|---|---------|-------------|
| 1 | Dashboard Metrics | Total clubs/members/spins, growth, expiring memberships |
| 2 | Club Management | View all, approve/reject, per-club analytics |
| 3 | AI Club Parser | Create club from Maps URL — auto-extract |
| 4 | Manual Club Creation | Name, slug, colors, logo, cover |
| 5 | Login as Admin | One-click impersonation (JWT cookie) |
| 6 | Standard Content Setup | Seed quests + events by club type |
| 7 | Offer Approval | Approve/reject custom catalog offers |
| 8 | Activity Feed | Recent 50 actions across all clubs |
| 9 | Invite Request Queue | Pending club join requests |
| 10 | Bulk Quest Import | CSV paste → preview → import w/ badges |
| 11 | Telegram Bot API | Bearer-auth endpoint for external bot |
| 12 | AI Prompts Editor | Edit one-shot system prompts at platform level |

### E. PUBLIC & DISCOVERY

| # | Feature | Description |
|---|---------|-------------|
| 1 | Homepage | Map hero + curated tabs (events, offers, quests, clubs) |
| 2 | Discover Page | Full map + tabs + filters + near-me |
| 3 | Deep-Link Offers | Tile → `/discover#offers:Name` with filter |
| 4 | Public Club Page | Gallery, public content, login, invite, hours, social |
| 5 | Examples (10 verticals) | Sports, coworking, coffee, tours, bars, etc. |
| 6 | Onboarding (3 steps) | Club + tags → branding → done |
| 7 | SEO | JSON-LD, OpenGraph, canonical, sitemap |
| 8 | Legal | Privacy + Terms, EN/ES, GDPR |
| 9 | Pre-registration | Email-based with optional auto-registration |
| 10 | Light/Dark Mode | next-themes with OS auto-detect |
| 11 | Theme-Aware Map | CARTO Voyager / Dark Matter switch |
| 12 | Feedback Widget | Floating button → Trello |

### F. DESIGN SYSTEM & INFRASTRUCTURE

| # | Feature | Description |
|---|---------|-------------|
| 1 | OKLch Color System | Perceptually uniform tokens (light/dark) |
| 2 | Semantic CSS Tokens | `landing-surface`, `landing-text`, etc. |
| 3 | SVG Icon System | Lucide icons; curated picker (~60 icons) |
| 4 | Landing Animations | 15+ keyframe animations |
| 5 | Active Club Filtering | Public queries restricted to active+approved clubs |

---

# Implementation Details

Each entry: brief summary + key files. Migrations live in `supabase/migrations/`.

## Auth & Membership

### Membership Expiration

Expired members are blocked at login (localized error with date) and redirected mid-session by middleware (DB check on every member page load, `?expired=1` query param). Both flows added a `locale` parameter to login actions.

- `app/[clubSlug]/(member)/login/actions.ts`, `app/[clubSlug]/staff/login/actions.ts`
- `middleware.ts` — member-route DB check after JWT verify
- `lib/i18n/dictionaries/{en,es}.json` — `login.membershipExpired*`

### Configurable Login Mode

Per-club toggle: `code_only` (default) vs `code_and_expiry` (member enters MMDD of `valid_till` as second factor). Set in Admin → Settings.

- `supabase/migrations/20260316300000_add_login_mode.sql`
- `app/[clubSlug]/admin/login-mode-manager.tsx`
- `app/[clubSlug]/(member)/login/login-form.tsx` — conditional second input

### Hide Member Login (invite-only)

When `invite_only && hide_member_login`, public page hides login form. Direct `/login` URL still works.

- `supabase/migrations/20260321100000_add_hide_member_login.sql`
- `app/[clubSlug]/public/page.tsx` — conditional render

### Premium Referrals

Admin marks members as premium referrers with a configurable spin reward. Auto-credited when staff creates a new member with that referrer's code.

- `supabase/migrations/20260316000000_add_premium_referrals.sql` — `is_premium_referrer`, `referral_reward_spins`
- `app/[clubSlug]/admin/referral-tree.tsx`
- `app/[clubSlug]/staff/members/actions.ts` — auto-reward in `createMember`

## Content & Engagement

### Member Badges

Badges live alongside quests; checking "Award badge on completion" on a quest creates the badge row inheriting `name`/`icon`/`image_url`. Awarded one-time on quest verify (`UNIQUE(member_id, badge_id)`). No standalone badge UI — managed via the quest form.

- `supabase/migrations/20260316200000_add_badges.sql`
- `app/[clubSlug]/admin/quest-manager.tsx` — "Award badge" checkbox
- `app/[clubSlug]/staff/quest/actions.ts` — auto-award on verify
- `app/[clubSlug]/(member)/badge-collection.tsx`

### Content Creation UX

Quests/events/services share a curated `lib/icons.ts` (60+ lucide icons) via `IconPicker`/`DynamicIcon`. Descriptions are textareas, not single-line inputs.

- `supabase/migrations/20260316100000_add_icon_field.sql`
- `lib/icons.ts`, `components/icon-picker.tsx`, `components/dynamic-icon.tsx`

### Public Profiles

Each entity (quest/event/service/offer) has `is_public`. The public page at `/{clubSlug}/public` renders all public entities, club branding, and (unless hidden) login form.

- `supabase/migrations/20260311000000_add_is_public.sql`
- `middleware.ts` — `/public` bypass
- `app/[clubSlug]/public/page.tsx`

### Events: Past Protection & Timezone

Date splitting (upcoming vs past) runs client-side to respect user TZ. RSVP/cancel/check-in actions reject past events. Already-checked-in members can't cancel.

- `app/[clubSlug]/(member)/events/events-client.tsx` — client-side split, calendar
- `app/[clubSlug]/(member)/events/actions.ts` — server-side guards
- **Caveat:** never use `new Date().toISOString().split("T")[0]` server-side for "today" comparisons.

### Offers System

Tile-grid view on member + public pages (2/3-col responsive). Admin manager uses an accordion (collapsed-by-default rows, expand-to-edit). Archive is a soft-hide (preserves config); toggle-off is a hard delete. Archived offers are filtered from member/public/staff but remain fulfillable for pending orders. Offers can link to a product for real fulfillment via the ops sell flow.

- `supabase/migrations/20260321200000_add_offer_archived.sql`
- `app/[clubSlug]/admin/offer-manager.tsx`

### Working Hours

Per-day open/close stored as JSONB on `clubs.working_hours` keyed by `mon..sun`, with timezone read from `clubs.timezone` (IANA). Pure logic lives in `lib/working-hours.ts` and supports overnight windows (e.g., 22:00→02:00 spans midnight via "yesterday tail" lookup), DST transitions (uses `Intl.DateTimeFormat`), and locale-aware time formatting (12h EN, 24h ES). The admin form pre-fills 12:00→00:00 when a day is toggled open. Discover map popups and the clubs results-grid card show a one-line `<WorkingHoursBadge />`; the public club page uses the expandable `<WorkingHoursDisplay />`. Both render nothing when hours are unset, so clubs without configured hours stay clean.

- `lib/working-hours.ts` — pure types + `timeToMinutes`, `formatTime`, `getDayKeyInTimezone`, `getMinutesInTimezone`, `isOpenAt`, `getStatus`
- `tests/working-hours.test.ts` — 43 vitest cases covering regular hours, overnight, DST, multi-timezone, noon-to-midnight default
- `components/club/working-hours-display.tsx` — full expandable widget on `/[clubSlug]/public`
- `components/club/working-hours-badge.tsx` — compact badge for `/discover` map popup + clubs list card
- `app/[clubSlug]/admin/working-hours-manager.tsx` — admin form (default 12:00→00:00)
- i18n keys live under `workingHours.*` in `lib/i18n/dictionaries/{en,es}.json`

## Internationalization

### Custom i18n System

Lightweight, no library: JSON dictionaries + `t()` with parameter interpolation, server locale via middleware header (`x-lang`) + cookie (`clubos-lang`). Server: `getServerLocale()`. Client: `useLanguage()` hook.

- `lib/i18n/index.ts`, `lib/i18n/server.ts`, `lib/i18n/provider.tsx`, `lib/i18n/switcher.tsx`
- `lib/i18n/dictionaries/{en,es}.json` — ~285 keys + ~100 ops keys
- `middleware.ts` — `applyLocale()`

`LanguageSwitcher` placed in: landing (top-right), onboarding, member portal, staff console header, admin header, public club page hero.

## SEO & Metadata

### Root Metadata

`metadataBase` from `NEXT_PUBLIC_SITE_URL`, title template `%s | osocios.club`, OG defaults, Twitter card, multi-format icons.

- `app/layout.tsx`, `app/page.tsx`

### robots & Sitemap

Dynamic sitemap pulls active+approved club slugs from DB. Middleware excludes `robots.txt`/`sitemap.xml`/`manifest.webmanifest` from auth.

- `app/robots.ts`, `app/sitemap.ts`, `middleware.ts`

### OG Images

Code-generated via `next/og` `ImageResponse` (1200×630, edge runtime): default landing, discover, examples, and dynamic per-club (logo + primary color + tags).

- `app/opengraph-image.tsx`, `app/discover/opengraph-image.tsx`, `app/examples/opengraph-image.tsx`, `app/[clubSlug]/public/opengraph-image.tsx`

### JSON-LD

Helpers for Organization, WebSite (with SearchAction), Club, ItemList. Injected on landing, public club page, discover.

- `lib/structured-data.ts`

### Brand Icons & PWA Manifest

Source `public/logo.svg` derives `app/icon.ico`, `apple-icon.png`, PWA `192/512`. `app/manifest.ts` for the marketing site (per-club PWA below).

## PWA & Web Push

### Per-Club PWA

Dynamic per-club `manifest.webmanifest` and `icon.png` routes. Manifest sets `start_url=/{slug}`, `theme_color` from branding. Icon route composites the club logo on its primary color via `next/og` (180/512 sizes, monogram fallback). Cache `5min/1h s-maxage/1d swr`.

- `app/[clubSlug]/manifest.webmanifest/route.ts`
- `app/[clubSlug]/icon.png/route.tsx`
- `app/[clubSlug]/(member)/layout.tsx` — `generateMetadata` injects manifest + apple-touch-icon
- `middleware.ts` — allowlists `manifest.webmanifest`, `icon.png`, `/a2hs/*`, `/sw.js`
- `lib/reserved-slugs.ts` — reserves `a2hs`, `sw.js`

### A2HS Walkthrough

Banner on member home (iOS + standalone-aware) opens a bottom-sheet modal with 4 step screenshots (`public/a2hs/step-{1..4}.jpg`). Body scroll lock uses `position: fixed; top: -<scrollY>px` (the iOS Safari workaround — `overflow: hidden` is ignored).

- `components/club/add-to-homescreen.tsx` — 3-state card (install / subscribe / hidden)
- `components/club/add-to-homescreen-modal.tsx` — bottom sheet, focus trap, ESC
- `lib/i18n/dictionaries/{en,es}.json` — `a2hs.*`

### Web Push (v1, members)

VAPID keys (`VAPID_*` env). Service worker `public/sw.js` handles `push` and `notificationclick`. Member subscribes from A2HS card; admin sends test from `/admin/push`. Stale subscriptions (404/410) auto-deleted.

- `supabase/migrations/20260415150000_add_push_subscriptions.sql`
- `lib/push/client.ts`, `lib/push/send.ts` — `sendPushToClub`, `sendPushToMember`
- `app/[clubSlug]/(member)/push-actions.ts` — `savePushSubscription`
- `app/[clubSlug]/admin/(panel)/push/{page,push-form,actions}.{tsx,ts}`

**Out of scope:** staff push, transactional triggers, scheduled reminders.

### Telegram Member Subscriptions (v1)

Per-Club bot with member opt-in via deep-link. Owner creates a Telegram bot through @BotFather, pastes the token in admin settings, clicks **Verify & enable** — server calls `getMe` (captures `bot_username`), generates a `webhook_secret`, calls `setWebhook` pointing to `/api/telegram/webhook/<slug>`. Members open `/profile`, click **Connect Telegram** → deep-link `https://t.me/<bot>?start=<member_code>` → bot stores their `chat_id` in `telegram_subscriptions`.

The same bot also serves the existing staff alerts (`lib/staff-notify.ts` → `clubs.telegram_chat_id`); the two purposes are decoupled. Member subscriptions are gated by `clubs.telegram_member_subs_enabled` so the webhook 200s silently when disabled.

Broadcasts are unified into the existing email composer: `EmailCampaignManager` now exposes a Channel multi-select (Email · Telegram · Push). `sendCampaign` resolves the segment once, fans out per channel, and writes one row to `notification_broadcasts` (multi-channel audit). `email_campaigns` is still written when email is selected, for backwards compat with the existing history view.

- `supabase/migrations/20260429130000_add_telegram_member_subscriptions.sql` — adds `telegram_subscriptions`, `notification_broadcasts`, plus `clubs.{telegram_bot_username,telegram_webhook_secret,telegram_member_subs_enabled}`
- `lib/telegram/index.ts` — legacy `sendTelegramMessage` (used by staff-notify)
- `lib/telegram/send.ts` — `sendTelegramToClub`, `sendTelegramToMember`, `sendTelegramToSubscriptions`; stale-cleanup on 403/404
- `lib/telegram/webhook.ts` — `getMe`, `setWebhook`, `deleteWebhook`, `replyInWebhook`, `generateWebhookSecret`
- `app/api/telegram/webhook/[clubSlug]/route.ts` — handles `/start <member_code>`, `/stop`, `/help`; validates `X-Telegram-Bot-Api-Secret-Token`
- `app/[clubSlug]/admin/telegram-subscribers-manager.tsx` + `telegram-subscriptions-actions.ts` — token paste, verify+register, disable, send test
- `app/[clubSlug]/(member)/notification-actions.ts` — `disconnectTelegramSubscription`
- `components/club/notification-channels.tsx` — Push/Telegram/WhatsApp rows on profile (WhatsApp = "Coming soon")
- `app/[clubSlug]/admin/email-actions.ts` — `sendCampaign(channels[])`, `BroadcastChannel` type, `countSegment`

**Out of scope:** WhatsApp, auto-triggers, scheduled reminders, per-category preferences. WhatsApp left as a stub row in the profile UI.

## Environment & Deployment

### Branching

`develop` = staging (auto-deploy → `staging.osocios.club`, staging Supabase). `main` = production. PR-protected on `main`. Migrations auto-run via GitHub Actions when `supabase/migrations/**` changes.

- `.github/workflows/migrate-{staging,production}.yml`
- `supabase/seed.sql`
- `app/layout.tsx` — staging banner via `NEXT_PUBLIC_VERCEL_ENV === "preview"`

### Storage Buckets

Migration-managed (idempotent `ON CONFLICT DO NOTHING`):
- `club-images` (public, 5MB, image/*)
- `event-images` (public, 5MB, image/*)
- `member-ids` (private, 5MB, signed URLs only)
- `member-photos` (private, 5MB, image/jpeg/png/webp/heic)
- `member-signatures` (private, 500KB, image/png only)

- `lib/supabase/storage.ts` — typed upload/delete/signed-URL helpers per bucket

## Analytics

Vercel Analytics + Speed Insights (zero-config, no cookies, GDPR-friendly). No Sentry/GA at launch.

- `app/layout.tsx` — `<Analytics/>`, `<SpeedInsights/>`

---

## Operations Module

Cannabis-club operational layer (door + dispensary), built for Ice Tray Weed Club. Off by default per club, flag-gated at `clubs.operations_module_enabled`. All ops actions authorize via `requireStaffForClub(clubId)` or `requireOwnerForClub(clubId)` from `lib/auth.ts`. Every mutation writes an `activity_log` row.

### Feature Flag & Routes

Owner toggles in Admin → Settings. Staff nav grows an "Ops" tab; routes under `/staff/operations/*`. `notFound()` gate in the operations layout for defense-in-depth. Flip-off preserves all data.

- `supabase/migrations/20260416160000_add_operations_module.sql`
- `app/[clubSlug]/admin/operations-module-manager.tsx`
- `app/[clubSlug]/staff/(console)/operations/{layout,page}.tsx` — dashboard with 5 cards

### Member Onboarding (ops-enabled)

Identity capture for compliance. All required when ops is on; RFID is optional.

| Field | How captured | Storage |
|---|---|---|
| First/last name, DOB (18+ gate), residency, DNI/passport, phone | Form | `members` columns |
| Email | Form | optional |
| Member code | Auto-generated `<first2><last2><NN>` (NFD-stripped) | `member_code` |
| Portrait photo | `<PhotoCapture facingMode="user">` (camera + file fallback) | private `member-photos` |
| ID document photo | `<PhotoCapture facingMode="environment">` | private `member-ids` |
| Signature | `<SignaturePad>` (canvas, pointer events, DPR-aware) | private `member-signatures` |
| RFID UID | Sycreader USB HID keyboard reader (auto-types + Enter) | `members.rfid_uid` (per-club partial unique index) |

`createMember` server-verifies the ops flag (never trusts client), under-18 short-circuits with localized error, code collisions retry up to 5×, RFID collisions surface as `This chip is already bound to member <code>`. Orphaned uploads cleaned up on insert failure.

- `supabase/migrations/20260417120000_member_onboarding_fields.sql` — 8 columns + check constraint + RFID index
- `supabase/migrations/20260417130000_create_member_photos_bucket.sql`
- `supabase/migrations/20260417140000_create_member_signatures_bucket.sql`
- `app/[clubSlug]/staff/members/actions.ts` — `CreateMemberInput`, `ageFromDob`, `baseCodeFromNames`
- `app/[clubSlug]/staff/members/member-creator.tsx` — full identity form
- `components/club/{photo-capture,signature-pad,rfid-capture}.tsx`
- `lib/supabase/storage.ts` — three private-bucket helper trios
- Hardware (Sycreader): vendor `0xFFFF`, product `0x0035`. Signotec ST-BE105 swap-in roadmap in `docs/hardware/signotec-setup.md`.

### Door Flow

QR scan / manual / search-by-name picker. `EntryDialog` shows photo, age chip, verified chip, expiry chip, "already inside" chip. Distinct audit codes per blocked path (`entry_blocked_expired/_no_dob/_underage/_duplicate`). Capacity page lists open entries with durations and "Check out all" bulk close.

- `supabase/migrations/20260416180000_create_club_entries.sql` — partial unique index `WHERE checked_out_at IS NULL` enforces one open session per member
- `app/[clubSlug]/staff/(console)/operations/entry/{actions,entry-client,page}.tsx` — `lookupMemberForEntry`, `admitMember`, `checkoutEntry`, `searchMembersByName`
- `app/[clubSlug]/staff/(console)/operations/capacity/page.tsx` + `checkout-{button,all-button}.tsx`
- `@yudiel/react-qr-scanner` (lazy via `next/dynamic`)

### Products + Categories

Admin CRUD with bilingual names, image, unit (gram/piece), unit price, stock (`numeric(10,3)`). Categories support archive. Staff browses read-only grouped by category. Ice's product categories are seeded automatically when ops is enabled on a new club.

- `supabase/migrations/20260416190000_create_products.sql` — `product_categories` + `products` tables
- `app/[clubSlug]/admin/products-actions.ts` — 7 functions, all `requireOwnerForClub`-gated
- `app/[clubSlug]/admin/products-manager.tsx` — tabbed Active/Archived, accordion rows
- `app/[clubSlug]/staff/(console)/operations/products/page.tsx`

### Sell Flow + Transactions + Void

Three-step staff flow (member → product → quantity). `sell_product` RPC row-locks the product, validates stock + staff-belongs-to-club, decrements stock, inserts transaction, writes audit row — all atomic. Distinct error codes mapped to friendly messages. Green receipt banner with "New sale" button (no auto-clear → no double-submit). Recent quick-pick row caches last 3 product IDs in tab memory. Optional Ohaus NV422 USB scale via Web Serial; falls back to manual entry on Safari/iOS. Manual edits after a scale reading auto-clear the `weight_source = 'scale'` flag (no fraudulent audit trail).

Void requires reason; restores stock atomically. Transactions page: today's revenue, voided-today tally, per-product summary, paginated 50/page, CSV export with stable English headers.

- `supabase/migrations/20260416200000_create_product_transactions.sql` — table + `sell_product` RPC
- `supabase/migrations/20260416210000_add_void_product_sale.sql` — atomic void RPC
- `supabase/migrations/20260416210001_harden_sell_product.sql` — `staff_wrong_club` defense-in-depth
- `app/[clubSlug]/staff/(console)/operations/sell/{actions,sell-client,page}.tsx`
- `app/[clubSlug]/staff/(console)/operations/transactions/{page,void-button,export-button}.tsx`
- `lib/hardware/scale.ts`, `lib/hardware/ohaus-nv422.ts`, `components/club/scale-panel.tsx`
- Member portal: profile shows last 5 non-voided sales (`app/[clubSlug]/(member)/profile/page.tsx`).

### Multi-Tenant Authorization

`lib/auth.ts` exports `requireStaffForClub(clubId)` and `requireOwnerForClub(clubId)`. Pattern: load resource → derive `club_id` → authorize → mutate. Session's `club_id` is the authority, not caller-supplied args. RPC layer re-checks for defense-in-depth.

### Operations Log Filter

Admin Logs page gains an "Operations" filter chip listing 21 ops action types when `operations_module_enabled`. Action labels render as "Sale", "Door admit", "Stock adjust", etc.

- `app/[clubSlug]/admin/log-viewer.tsx` — `OPS_ACTIONS`, `opsEnabled` prop
- `app/[clubSlug]/admin/(panel)/logs/page.tsx`

### Ops i18n

~100 keys under `ops.{admin,memberForm,entry,sell,tx,capacity,scale,logsFilter}`. CSV export headers stay English regardless of locale.

## Finance (Admin)

Dashboard for revenue analysis: time-range picker, revenue chart, category breakdown chart, CSV export. Backed by product transactions (ops-only).

- `app/[clubSlug]/admin/(panel)/finance/{page,actions,revenue-chart,category-breakdown-chart,finance-range-picker,export-button}.tsx`
- `app/[clubSlug]/admin/saldo-ledger.tsx` — member balance ledger

## AI Features

One-shot AI generation for quest/setup prompts. Admin's club social links (IG, WhatsApp, Telegram, Maps, Website) are passed into the prompt context so generated content is tailored. Platform-admin can edit the system prompts.

- `app/[clubSlug]/admin/ai-actions.ts`, `ai-constants.ts`
- `app/platform-admin/ai-prompts/`
- Migration: `20260424120000_ai_prompts_use_social_links.sql`

## Minor UX Fixes

Grouped fixes too small to warrant their own section.

- **Role visibility:** Members can't see/change their role; selector removed from profile (`app/[clubSlug]/(member)/profile/page.tsx`).
- **Event/quest spins allow zero:** `min="0"` on inputs; null-safe parse in `addQuest`/`updateQuest` (`app/[clubSlug]/admin/{event,quest}-manager.tsx`, `actions.ts`).
- **Quest link visibility after completion:** Link renders unconditionally (`quest-list.tsx` line 84).
- **Admin/staff layout cover overlap:** Outer wrapper gets `bg-gray-50 rounded-t-3xl pt-6` to cover the gradient overlap zone (`(panel)/layout.tsx`, `(console)/layout.tsx`).
- **Admin create-form number inputs:** Initialize to `""` with placeholder hints; submit fallback preserves prior defaults (Products, Events, Quests, Premium Referrer, Membership periods).
- **Mobile viewport + horizontal scroll:** `viewport` export in root layout, `overflow-x-hidden` on `html, body`, tighter nav padding (`app/layout.tsx`, `app/globals.css`, `components/club/admin-nav.tsx`).
- **Staff bottom-nav scroll:** `overflow-x-auto` + `min-w-max` + `shrink-0` so all 6–7 tabs reach on narrow phones (`components/club/staff-nav.tsx`).
- **Service card style:** Compact rows matching quest cards (small circular thumb + inline title/description/link, action right) on member + public pages.
- **QEBO nav fix:** Hide member nav when staff+owner cookies coexist (`ce1c29a`).
- **Service Card → compact, Member Delete admin action, Interactive calendar with inline event panel** — all in respective managers/clients.

## Workflow Tools

### `/document` Skill

Reads conversation, identifies completed tasks, appends/updates entries here. Not a changelog — architectural knowledge.

- `~/.claude/skills/document/SKILL.md`

### `/fix-bug` Skill

Disciplined single-bug flow: reproduce → root-cause → fix → staging → Mikita QA → main. Composes with `superpowers:systematic-debugging`. Six hard rules including "no refactoring while fixing" and "every fix lands in Trello qa with @mikitatrayan".

- `~/.claude/skills/fix-bug/SKILL.md`

### Trello CLI

`~/.local/bin/trello` — bash + `curl` + `jq` wrapper. ~5–10× more compact than the MCP. Aliases: `critical`, `feedback`, `inprogress`, `qa`. Commands: `list`, `card`, `comment`, `move`, `add`, `lists`. Reads `TRELLO_API_KEY`/`TRELLO_TOKEN` from env.

- Used by `.claude/commands/{work,clarify,fix-bug}.md` and `~/.claude/skills/feedback-work/SKILL.md`.

### gh CLI Token

`GITHUB_TOKEN` env var unset in `~/.zshrc` so `gh` uses the OAuth keychain token (full `repo` scope).
