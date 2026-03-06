# ClubOS v2

Multi-tenant Club Operating System — a white-label SaaS platform that powers membership portals for independent clubs from one codebase.

**Principle:** Isolated by default. Connected by configuration.

## Applications

| App | Users | Purpose |
|-----|-------|---------|
| **Member Portal** | Club members | Login, dashboard, spin wheel, history, profile, QR card |
| **Staff Console** | Front desk staff | Search members, award/deduct spins, verify quests |
| **Admin Dashboard** | Club owners/managers | Club settings, staff mgmt, quest builder, rewards config, analytics |
| **Platform Control** | Platform operator | Create clubs, assign domains, manage tenants, billing |

## Tech Stack

| Concern | Decision |
|---------|----------|
| Framework | Next.js 15, App Router, React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| DB / Storage | Supabase (Postgres + Storage) |
| Multi-tenancy | Path-based (`[clubSlug]`), RLS on all tables |
| Member auth | Custom JWT (jose), HTTP-only cookie |
| PIN storage | bcrypt hash (bcryptjs) |
| Mutations | Server Actions |
| Package manager | pnpm |
| Deployment | Vercel |
| Monitoring | Sentry |
| CI | GitHub Actions |

## Project Structure

```
app/
  layout.tsx                          root layout
  page.tsx                            landing page
  (platform)/
    onboarding/
      page.tsx                        step 1: create org + club
      branding/page.tsx               step 2: logo, colors, theme
      complete/page.tsx               step 3: summary + test member
  [clubSlug]/
    layout.tsx                        tenant layout (club branding)
    (member)/
      login/page.tsx                  member code + PIN login
      page.tsx                        member dashboard
      spin/page.tsx                   spin the wheel
      history/page.tsx                spin history
      profile/page.tsx                member profile
      layout.tsx                      member auth guard
components/
  ui/                                 shadcn/ui components
  club/                               club-specific components (wheel, nav)
lib/
  supabase/
    client.ts                         browser client
    server.ts                         server client
    admin.ts                          service role client
  auth.ts                             JWT + PIN utilities
  types/                              TypeScript types (generated + convenience)
  utils.ts                            slug, member code, PIN generation
supabase/
  migrations/                         SQL migrations
middleware.ts                         club slug resolution + auth guard
```

## Database Schema

Core tables (all RLS-enabled, scoped by `club_id`):

- **organizations** — top-level entity (standalone / group / federation mode)
- **clubs** — belongs to org, has slug, timezone, currency
- **club_branding** — logo, colors, theme per club
- **members** — member_code + pin_hash, spin_balance, scoped to club
- **spins** — spin outcome log per member
- **wheel_configs** — wheel segments with label, reward_type, probability, color

## Authentication

- **Members:** member_code + PIN login, scoped to club. Server-side bcrypt verify, JWT cookie (7-day expiry). No Supabase Auth.
- **Staff/Admin (future):** email + password via Supabase Auth, role-based access.

## Development

```bash
# Install dependencies
pnpm install

# Start local Supabase
pnpm supabase start

# Copy env template and fill in values from supabase start output
cp .env.local.example .env.local

# Run migrations
pnpm supabase db reset

# Start dev server
pnpm dev
```

## Current Phase

**Phase 1** — Club onboarding + member portal with spin-the-wheel.

See `docs/plans/2026-03-06-phase1-design.md` for the design spec and `docs/plans/2026-03-06-phase1-implementation.md` for the task-by-task implementation plan (20 tasks).

## Operating Modes

1. **Standalone** (default) — fully isolated clubs with separate members, rewards, quests, staff, branding
2. **Federation** (opt-in) — shared member passport, cross-club perks, network quests, event campaigns
