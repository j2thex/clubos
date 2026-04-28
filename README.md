# ClubOS

Multi-tenant club operating system, branded as **osocios.club** — a white-label SaaS that powers membership portals for independent clubs from one codebase. Path-based multi-tenancy, RLS on every table, isolated by default, federated by configuration.

## Portals

| Portal | Audience | Path |
|---|---|---|
| Member | Club members | `/[clubSlug]/...` (branded, bottom nav) |
| Staff | Front-desk staff | `/[clubSlug]/staff/...` (gray theme) |
| Admin | Club owners | `/[clubSlug]/admin/...` (owner-auth required) |
| Platform | Operator | `/platform-admin` (cross-club) |

Plus a public profile per club at `/[clubSlug]/public` and discovery surfaces at `/`, `/discover`, `/examples`.

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (Postgres + Storage + RLS) |
| Auth | Custom JWT (jose), bcrypt PINs — no Supabase Auth |
| Mutations | Server Actions |
| Email | Resend |
| Hosting | Vercel |
| Package manager | pnpm |
| CI | GitHub Actions (auto-migrate Supabase on `supabase/migrations/**`) |

## Run Locally

```bash
pnpm install
pnpm supabase start
cp .env.local.example .env.local   # fill in from `supabase start` output
pnpm supabase db reset
pnpm dev
```

## Documentation

- [`CLAUDE.md`](./CLAUDE.md) — project conventions, architecture rules, auth model, design tokens.
- [`architecture-work-done.md`](./architecture-work-done.md) — feature inventory across all portals + thin implementation pointers. Maintained by the `/document` skill.
- [`docs/website.md`](./docs/website.md) — marketing/site/strategy plan.
- [`docs/hardware/signotec-setup.md`](./docs/hardware/signotec-setup.md) — Signotec signature pad setup notes.

## Deployment

```
feature → develop (staging.osocios.club) → main (osocios.club)
```

`develop` is unprotected; `main` requires PR. Vercel auto-deploys; GitHub Actions auto-migrate Supabase per branch.
