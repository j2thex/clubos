# ClubOS — CLAUDE.md

## What is this?

Multi-tenant club operating system (SaaS) branded as **osocios.club**. White-label membership portals for independent clubs.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: Supabase (Postgres + Storage + RLS)
- **Auth**: Custom JWT via jose (no Supabase Auth), bcryptjs for PIN hashing
- **Hosting**: Vercel
- **Package manager**: pnpm
- **Mutations**: Server Actions (not API routes)

## Project Structure

```
app/
  (platform)/         # Onboarding flow (not club-scoped)
  [clubSlug]/         # Multi-tenant root
    (member)/         # Member portal — club-branded, bottom nav
    staff/            # Staff console — gray theme, bottom nav
    admin/            # Admin panel — gray theme, no nav
  _landing/           # Landing page components
  layout.tsx          # Root layout
  page.tsx            # Landing page
```

## Architecture Rules

- **Path-based multi-tenancy**: everything scoped by `[clubSlug]` dynamic route
- **RLS on all tables**: every query scoped by `club_id`
- **No club-specific logic in core code** — everything configurable at club level
- **Three portals**: member (branded), staff (gray), admin (gray, public)
- **Middleware** handles auth: member cookie for member routes, staff cookie for staff routes, admin is public

## Auth Model

- **Members**: `member_code` only → JWT cookie `clubos-member-token` (7-day)
- **Staff**: `member_code` + 4-digit PIN → JWT cookie `clubos-staff-token` (12h)
- **Admin**: no auth (public)
- Members table has `is_staff boolean`, `pin_hash` nullable

## Database

Tables: `organizations`, `clubs`, `club_branding`, `members`, `member_roles`, `spins`, `wheel_configs`

### Supabase Projects

| Environment | Project ID | Region |
|---|---|---|
| Production | `ltembhxsbjhlrlgzvteh` | eu-west-1 |
| Staging | `waiuymqdqzccatactrzo` | eu-west-1 |

## Git & Deployment Workflow

```
feature branch → develop (staging) → main (production)
```

- Feature branches off `develop`, PRs into `develop`
- When staging verified, PR from `develop` → `main`
- `develop` is unprotected (can push directly)
- `main` requires PR (branch protection)
- Use `gh` CLI for PRs (no GitHub website)
- Vercel auto-deploys: `main` → production, `develop`/feature → preview
- GitHub Actions auto-migrate Supabase when `supabase/migrations/**` changes

## Design Conventions

- **Member portal**: club-branded via CSS custom properties (`--club-primary`, `--club-secondary`)
- **Staff/Admin**: neutral gray theme (gray-800/900 header, white cards)
- **Favicons**: green (member), blue (staff), red (admin) — SVG in `/public/`
- **Titles**: `Entity | Club Name` format
- CSS utility classes: `club-hero`, `club-btn`, `club-primary`, `club-page-bg`, `club-tint-bg`

## Key Patterns

- Supabase one-to-one joins return objects, not arrays — handle both cases
- `useState(prop)` doesn't re-sync on prop changes — use `useEffect` to sync
- Server Action return types need explicit union annotations for TypeScript narrowing
- SpinWheel uses `forwardRef` + `useImperativeHandle` — dynamic import to avoid SSR canvas issues
- Bottom nav components hide themselves on login pages

## UX Principles

- **Staff flows**: minimize steps, single-action where possible
- **Admin**: group CRUD into tabbed components, inline creation forms
- **No demo users** in onboarding — admin creates all accounts manually

## Commands

```bash
pnpm dev          # Local dev server
pnpm build        # Production build
pnpm lint         # ESLint
```

## Team

- **Jeff**: sole developer, all code and deployments
- **Mikita**: tester, tests on staging.osocios.club (no git access)
