# ClubOS Phase 1 Design

## Goal

Build the minimum foundation: onboard a club and serve its member portal with spin-the-wheel functionality.

## Scope

- Platform onboarding UI (create org, club, branding)
- Member portal (login, dashboard, spin wheel, history, profile)
- Multi-tenant groundwork (path-based routing, RLS)

## Architecture

Single Next.js 15 app (App Router) with route groups. Supabase for DB, storage, and RLS. Deployed on Vercel.

### Project Structure

```
app/
  layout.tsx                          root layout (providers, fonts)
  page.tsx                            landing/redirect
  (platform)/
    onboarding/
      page.tsx                        step 1: create org + club
      branding/page.tsx               step 2: logo, colors, theme
      complete/page.tsx               step 3: summary + test member
  [clubSlug]/
    layout.tsx                        tenant layout (loads club branding)
    (member)/
      login/page.tsx                  member code + PIN login
      page.tsx                        member dashboard
      spin/page.tsx                   spin the wheel
      history/page.tsx                spin history
      profile/page.tsx                member profile
      layout.tsx                      member auth guard
components/
  ui/                                 shadcn/ui components
  club/                               club-specific components
lib/
  supabase/
    client.ts                         browser client
    server.ts                         server client
    admin.ts                          service role client
  types/                              TypeScript types
  utils.ts
supabase/
  migrations/                         SQL migrations
middleware.ts                         club slug resolution + auth
```

## Database Schema

### organizations

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, auto-generated |
| name | text | NOT NULL |
| slug | text | UNIQUE, NOT NULL |
| mode | text | DEFAULT 'standalone' |
| created_at | timestamptz | DEFAULT now() |

### clubs

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, auto-generated |
| organization_id | uuid | FK -> organizations |
| name | text | NOT NULL |
| slug | text | UNIQUE, NOT NULL |
| active | boolean | DEFAULT true |
| timezone | text | DEFAULT 'UTC' |
| currency | text | DEFAULT 'USD' |
| created_at | timestamptz | DEFAULT now() |

### club_branding

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, auto-generated |
| club_id | uuid | UNIQUE FK -> clubs |
| logo_url | text | |
| theme_name | text | DEFAULT 'default' |
| primary_color | text | DEFAULT '#6366f1' |
| secondary_color | text | DEFAULT '#ec4899' |
| hero_content | text | |
| created_at | timestamptz | DEFAULT now() |

### members

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, auto-generated |
| club_id | uuid | FK -> clubs, NOT NULL |
| member_code | text | NOT NULL |
| pin_hash | text | NOT NULL (bcrypt) |
| full_name | text | |
| spin_balance | integer | DEFAULT 0 |
| status | text | DEFAULT 'active' |
| created_at | timestamptz | DEFAULT now() |
| | | UNIQUE(club_id, member_code) |

### spins

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, auto-generated |
| club_id | uuid | FK -> clubs, NOT NULL |
| member_id | uuid | FK -> members, NOT NULL |
| outcome_label | text | NOT NULL |
| outcome_value | integer | DEFAULT 0 |
| created_at | timestamptz | DEFAULT now() |

### wheel_configs

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, auto-generated |
| club_id | uuid | FK -> clubs, NOT NULL |
| label | text | NOT NULL |
| reward_type | text | NOT NULL (prize / nothing) |
| reward_value | integer | DEFAULT 0 |
| probability | numeric | NOT NULL (0.0 to 1.0) |
| color | text | hex color for segment |
| active | boolean | DEFAULT true |

### Default wheel segments (seeded on club creation)

| Label | Reward Type |
|-------|------------|
| Drink | prize |
| Snack | prize |
| Paper | prize |
| Pre-Roll | prize |
| No Win | nothing |

## Authentication

### Member auth (Phase 1)

- Member code + PIN login, scoped to club
- PIN verified server-side via bcrypt compare
- On success: signed JWT set as HTTP-only cookie
- JWT payload: `{ member_id, club_id }`
- No Supabase Auth for members

### Staff/Admin auth (future)

- Email + password via Supabase Auth
- Role-based access control

## Middleware

1. Club resolution: read `[clubSlug]` from path, look up club, reject if not found/inactive
2. Auth guard: for member routes (except /login), validate JWT, redirect if missing/expired
3. Context injection: pass club_id via headers for server components

## Onboarding Flow

3-step form using Server Actions with admin Supabase client:

1. **Create Org & Club** - org name, club name (slugs auto-generated), timezone, currency
2. **Branding** - logo upload (Supabase Storage), color pickers, hero text
3. **Complete** - seeds default wheel config, creates test member, shows portal link

## Member Portal

- **Dashboard** - club branding, welcome message, spin balance, "Spin" button
- **Spin the Wheel** - animated wheel, server-side weighted random, balance decrement, outcome logged
- **History** - list of past spins with outcome and timestamp
- **Profile** - member code, name, balance, member since

## Tech Stack

| Concern | Decision |
|---------|----------|
| Framework | Next.js 15, App Router, React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| DB / Storage | Supabase (Postgres + Storage) |
| Multi-tenancy | Path-based, RLS on all tables |
| Member auth | Custom JWT, HTTP-only cookie |
| PIN storage | bcrypt hash |
| Mutations | Server Actions |
| Wheel randomness | Server-side weighted random |
| Package manager | pnpm |
| Deployment | Vercel |
