# Ubiquitous Language

> The canonical vocabulary for osocios. Every term used in code, conversations with the team, AI prompts, and product docs should come from this file. If a concept is missing, add it here first.

osocios.club is a white-label SaaS membership portal for independent clubs: members, gamification, events, offers, and commerce — multi-tenant by club slug, with row-level security per club.

## Tenancy

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Organization** | A top-level operator entity that owns one or more Clubs. | Company, Account |
| **Club** | A single tenant; the unit of isolation. Identified by a unique slug used in URLs (`/[clubSlug]/...`). | Tenant, Site |
| **Club Branding** | The per-Club presentation layer: colors, logo, hero content, social links. One-to-one with a Club. | Theme, Skin |

## People & Roles

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Member** | A person enrolled in a Club. The central domain entity; everything attaches to a Member. | User, Customer, Account holder |
| **Member Code** | A Member's unique-per-Club identifier and login credential (e.g. `TEST01`). | Username, Login |
| **Member Role** | A Club-defined label assigned to a Member (e.g. Founder, Manager, Moderator). Free-form, not a system enum. | Permission, Group |
| **Staff** | A Member flagged `is_staff = true`. Authenticates with a PIN to operate the Staff Console. | Employee, Worker |
| **Owner** | An email/password identity with administrative access to a single Club's Admin Panel. Distinct from a Member. | Admin user, Account |
| **Platform Admin** | A cross-Club operator that manages Organizations, Club templates, and global settings. | Super admin, Root |

## Membership Lifecycle

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Membership Period** | A purchasable tier defining how long a Member's access lasts (e.g. "3-Month Bronze"). | Plan, Subscription |
| **Valid Till** | The expiration date on a Member. After this date the Member loses Club access. | Expiry, End date |
| **Status** | A Member's lifecycle state: `active`, `inactive`, `expired`. Always means *Member status* unless explicitly qualified. | State |
| **Invite Request** | A pre-membership inquiry from a prospective Member; `pending` / `approved` / `rejected`. | Application, Lead |
| **Preregistration** | An advance booking for a future visit by a non-Member or Member, with disclaimer + age confirmation. | Reservation, Booking |

## Access & Entry

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Club Entry** | A Member's visit record with `checked_in_at` / `checked_out_at` for occupancy tracking. | Visit, Session |
| **Event Checkin** | A verified record that a Member attended a specific Event. Distinct from Club Entry. | Attendance, Visit |
| **ID Verification** | The compliance act of validating a Member's identity (id_number, id_photo, date_of_birth). | KYC |
| **RFID UID** | A contactless card/wristband identifier stored on the Member, used for entry. | Tag, Card |

## Operations Module

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Operations Module** | A per-Club feature flag (`operations_module_enabled`) that activates door + dispensary surfaces (Club Entry, Capacity, Products, Sales, Saldo). Off by default. | Ops module, Door+POS |
| **Capacity** | The live count of open Club Entries — Members currently inside the Club. | Occupancy, Headcount |
| **Door Flow** | The Staff workflow for admitting Members: QR scan or search → ID Verification check → admit → produce Club Entry. | Entry flow, Check-in |
| **Sell Flow** | The Staff workflow for selling Products: select Member → select Product → enter quantity (manual or scale) → produce Sale + Product Transactions. | POS flow |
| **Void** | The atomic reversal of a Sale: restores stock, stamps `voided_at` / `voided_by`, requires a reason. | Refund, Cancel |

## Gamification

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Spin** | The act of a Member rotating the wheel to receive an Outcome. *Always a verb/event, never a balance.* | Roll, Play |
| **Spin Balance** | The Member's currency of unspent Spins. Earned from Quests/Events, consumed by spinning. | Tokens, Credits |
| **Wheel Config** | One configurable wedge of the spin wheel (label, reward_type, reward_value, probability, color). | Wheel slot |
| **Outcome** | The result of a Spin: a label + value derived from the Wheel Config that landed. | Prize, Result |
| **Reward Type** | Outcome classification: `points`, `prize`, `nothing`. | Category |
| **Reward Spins** | The number of Spins granted as a reward for completing a Quest, attending an Event, or fulfilling an Offer Order. | Bonus, Payout |
| **Quest** | A Club-defined task or challenge with a reward (e.g. spins, badge). Has type, category, deadline, status. | Mission, Challenge |
| **Member Quest** | A completion record linking a Member to a Quest; carries `verified_by` (a Staff Member). | Achievement record |
| **Badge** | A visual achievement awarded when a Member completes a Quest. | Trophy, Award |
| **Member Badge** | A Member's earned-Badge record (`earned_at`, source quest_id). | Trophy record |

## Events

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Event** | A Club gathering with date, time, location, optional price, optional Reward Spins, recurrence rules, public flag. | Activity, Session |
| **Event RSVP** | A Member's stated intent to attend an Event. Not the same as attendance. | Signup |
| **Event Checkin** | A *verified* record that the Member actually attended; produces Reward Spins. See Access & Entry. | Attendance |

## Offers & Commerce

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Offer** | A platform-level catalog item (activity / experience / service / product) that Clubs can opt into. | Amenity (legacy), Item |
| **Offer Subtype** | Classification of an Offer: `activity`, `experience`, `service`, `product`. | Category |
| **Club Offer** | A Club's instantiation of a catalog Offer with its own price, `orderable` flag, and display order. | Listing |
| **Offer Order** | A Member's request to redeem a Club Offer; `pending` until Staff fulfills. May link to a Product. | Booking, Ticket |
| **Product** | An internal-inventory item sold via point-of-sale: name, unit (gram/piece), unit_price, cost_price, stock_on_hand. | SKU, Item |
| **Product Category** | A grouping of Products. Inventory-only; not the same as Offer Subtype. | Type |
| **Product Transaction** | A line-level sale record linking a Product to a Member with quantity and unit_price_at_sale. | Line item |
| **Sale** | A Member purchase header: subtotal, discount, total, `paid_with` (`saldo` or `cash`), with optional void. | Order, Receipt |

## Money

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Saldo** | A Member's stored-value balance held by the Club. The Club's own digital wallet. | Wallet, Credit, Balance |
| **Saldo Transaction** | A ledger entry against a Member's Saldo: `topup`, `sale`, `refund`, or `admin_adjustment`. | Movement |
| **Currency Mode** | A Club setting: `saldo` or `cash`. Determines default payment for Sales. | Payment mode |
| **Topup** | A Staff action that adds Saldo to a Member, gated by the `can_do_topup` permission. | Deposit, Recharge |

## Communication

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Notification Channel** | An outbound delivery medium that carries a message to Members: `email`, `push`, `telegram`. Future: `whatsapp`. | Channel (bare), Medium, Transport |
| **Notification Broadcast** | A bulk message to a filtered Member segment sent across one or more Notification Channels in a single Owner action. Stored in `notification_broadcasts` with per-channel recipient/sent/failed counts. | Blast, Announcement |
| **Email Campaign** | The legacy single-channel email broadcast (`email_campaigns` table). Subsumed by Notification Broadcast for new code; the table remains for historical records of email-only sends. | Newsletter |
| **Telegram Bot** | The Club's Telegram bot identity (`bot_token` + `bot_username`). One bot per Club, used both for Staff alerts (existing) and Member subscriptions (Telegram Subscriptions). | Chatbot |
| **Telegram Subscription** | A Member's opt-in record linking their Telegram chat to a Club's Telegram Bot. Required to receive Telegram-channel broadcasts. Stored in `telegram_subscriptions`; created when the Member runs `/start <member_code>` against the bot, deleted on `/stop` or stale-cleanup. | Subscriber, Telegram link |

## Media

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Gallery** | The per-Club collection of Media Items shown on the Member Portal dashboard and the public Club profile. | Photos, Album |
| **Gallery Item** | One row in `club_gallery`: a `media_url` + a `media_type` + optional `caption`. The renderer is chosen from Media Type. | Photo, Image, Asset |
| **Media Type** | One of `image`, `video`, `audio`. Determines which player/element renders the Gallery Item. | Kind, Format |

## Surfaces (Portals)

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Member Portal** | The branded Member-facing web app at `/[clubSlug]/...`. | Frontend, App |
| **Staff Console** | The PIN-gated Staff app at `/[clubSlug]/staff/...` for entry, fulfillment, verification. | Backoffice, Staff app |
| **Admin Panel** | The Owner-only Club admin at `/[clubSlug]/admin/...`. | Dashboard, CMS |
| **Platform Admin** | The cross-Club operator console at `/platform-admin/...`. | Super admin |

## Relationships

- An **Organization** owns many **Clubs**. A Club has exactly one **Club Branding**.
- A **Club** has many **Members**. Every domain record is scoped by `club_id`.
- A **Member** holds one **Saldo Balance**, generating many **Saldo Transactions**.
- A **Member** completes a **Quest** → produces a **Member Quest**, which may award a **Badge** and **Reward Spins**.
- A **Member** **Spins** the wheel → consumes one Spin Balance, lands on a **Wheel Config**, produces an **Outcome**.
- A Member **RSVPs** to an **Event** (intent). Attendance becomes an **Event Checkin** (verified by Staff) and grants **Reward Spins**.
- A Member places an **Offer Order** against a **Club Offer**; **Staff** fulfills it, optionally linking a **Product**.
- A **Sale** consists of one or more **Product Transactions** and is paid via **Saldo** or cash, recording a **Saldo Transaction** if applicable.
- A **Club Entry** is opened on arrival and closed on departure; it is independent of Event Checkins.
- An **Invite Request** precedes Member creation; a **Preregistration** precedes a Club Entry.

## Example dialogue

> **Dev:** "When a **Member** completes a **Quest**, do they earn the **Badge** instantly?"
>
> **Domain expert:** "Almost — the **Member Quest** record is created, but the **Badge** is only awarded after a **Staff** member sets `verified_by`. The **Reward Spins** add to the **Spin Balance** at the same moment."
>
> **Dev:** "And if the Member spends those Spins on the wheel, that's a **Spin** event, not a Saldo Transaction, right?"
>
> **Domain expert:** "Right. **Spins** are their own currency. Saldo only moves when there's a **Sale** or a **Topup**. The wheel produces an **Outcome** based on the **Wheel Config** that landed — never touches Saldo."
>
> **Dev:** "So a Member buying a coffee with stored value: that's a **Sale** with `paid_with = saldo`, which writes a **Saldo Transaction** of type `sale`?"
>
> **Domain expert:** "Exactly. And the underlying **Product Transaction** rows track which **Products** moved. If the Member instead requested it via the menu in the app, that's an **Offer Order** against a **Club Offer** — Staff fulfills it and the linked **Product** drops the **Sale**."
>
> **Dev:** "And all of that is gated by the **Operations Module** flag, right? A Club without it never sees the **Door Flow** or **Sell Flow**."
>
> **Domain expert:** "Right. Flag off → no **Capacity**, no **Sales**, no **Saldo Transactions**. Flag on → the **Door Flow** can produce **Club Entries**, and the **Sell Flow** can produce **Sales**. The **Operations Module** doesn't change other surfaces — Quests, Spins, Events all keep working the same."
>
> **Dev:** "If a **Sale** was wrong, do we delete the row?"
>
> **Domain expert:** "Never delete. **Void** it — restores stock atomically, stamps `voided_at` and `voided_by`, requires a reason. The **Product Transaction** rows stay; they just show as voided in the audit trail."

## Flagged ambiguities

- **"Offer" vs "Amenity"** — the table was renamed (`amenity` → `offer`) but the legacy term still appears in older code. **Always use Offer.** Reserve "amenity" for prose only when discussing legacy migrations.
- **"Offer" vs "Club Offer"** — `Offer` is the platform catalog row; `Club Offer` is the Club-specific instantiation with price. They are *different tables*. Don't say "the offer's price" — say "the Club Offer's price."
- **"Status"** — used on Members, Events, Club Offers, Preregistrations, and Offer Orders, with different value sets. Always qualify: *Member status*, *Preregistration status*, etc. Avoid bare "status" in domain conversation.
- **"User" vs "Member" vs "Owner" vs "Staff"** — these are *not* synonyms.
  - **Member** = a person enrolled in a Club (default subject of the product).
  - **Staff** = a Member with `is_staff = true`.
  - **Owner** = a separate email/password identity for Admin Panel access; not a Member.
  - **Platform Admin** = a cross-Club operator. Avoid "user" entirely in domain prose — pick the precise role.
- **"Entry" vs "Checkin"** — **Club Entry** = a visit to the physical Club (occupancy). **Event Checkin** = verified attendance at a specific Event. Don't conflate them; they live in different tables and serve different purposes.
- **"Spin"** — only ever the *act* (verb/event) or its **Outcome**. The *currency* is **Spin Balance**. Never say "the Member has 5 spins" — say "5 in their Spin Balance."
- **"Verified by" / "Approved by" / "Confirmed by"** — these all refer to a Staff Member who validated an action (Quest, Event Checkin, Preregistration, Offer Order). Pick **verified_by** as the canonical column name; use **verified by Staff** in prose.
- **"Reward Spins"** — appears on Quests, Events, and Offer Orders. Always means *Spins added to the Member's Spin Balance on completion* — not Saldo, not Badges.
- **"Product" vs "Offer/Club Offer"** — distinct concepts. **Product** = inventory SKU sold at point of sale. **Offer** = catalog of bookable activities/experiences/services. Some Offer Orders link to a Product (consumable fulfillment) — that link is the bridge, not a synonym.
- **"Migration"** — overloaded between two unrelated concepts. **Schema migration** = a SQL file in `supabase/migrations/` that evolves the database. **Content migration** = the operational act of moving a Club's content from one platform (e.g. Tilda) to osocios. Always qualify; never use bare "migration".
- **"Email Campaign" vs "Notification Broadcast"** — Email Campaign is the legacy single-channel concept (`email_campaigns` table, written by `sendCampaign` when channels include email). Notification Broadcast is the multi-channel umbrella (`notification_broadcasts` table) introduced when Telegram was added. Prefer **Notification Broadcast** in new code and prose; keep **Email Campaign** only when narrowly discussing the legacy email-only history.
- **"Telegram Bot" vs "Telegram Subscription"** — the **Telegram Bot** is the Club-side identity (token + username). A **Telegram Subscription** is a Member-side opt-in that points at that bot's chats. The bot has zero, one, or many subscriptions; a Member has at most one Subscription per Club.
- **"Void" vs "Cancel" vs "Refund"** — **Void** is the canonical term for reversing a Sale (atomic stock restore + audit). "Cancel" applies to Event RSVPs and Offer Orders before fulfillment; "refund" is not an osocios primitive — refund logic happens via Saldo Transaction `topup` with a reason or via cash outside the system.
- **SaaS billing layer is not yet formalized.** The relationship between an Organization and osocios — Subscription, Plan, Pricing, Onboarding Contract — exists in operations (Mikita maintains contracts and pricing per Club) but has no domain entities or columns. Treat this as an open subdomain. Add terms here once the launch surfaces concrete needs.
