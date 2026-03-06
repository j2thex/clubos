# ClubOS Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build club onboarding + member portal with spin-the-wheel, from an empty repo to a working app.

**Architecture:** Single Next.js 15 App Router app. Supabase for Postgres + Storage. Path-based multi-tenancy via `[clubSlug]`. Custom JWT auth for member code + PIN login. Server Actions for mutations.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, Supabase, pnpm, bcrypt, jose (JWT)

**Design doc:** `docs/plans/2026-03-06-phase1-design.md`

**UI/UX skill:** `.claude/skills/ui-ux-pro-max/` — use `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --stack shadcn` for design guidance when building UI components.

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`
- Create: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- Create: `.env.local.example`

**Step 1: Initialize Next.js project**

```bash
cd /Users/jeffsmith/Projects/clubos
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-pnpm --turbopack
```

Accept defaults. This creates the Next.js 15 project with App Router, TypeScript, Tailwind, ESLint.

**Step 2: Install core dependencies**

```bash
pnpm add @supabase/supabase-js @supabase/ssr bcryptjs jose
pnpm add -D @types/bcryptjs supabase
```

- `@supabase/supabase-js` — Supabase client
- `@supabase/ssr` — SSR-compatible Supabase helpers
- `bcryptjs` — PIN hashing (pure JS, no native deps)
- `jose` — JWT signing/verification (Edge-compatible, works in middleware)
- `supabase` — CLI for migrations

**Step 3: Initialize shadcn/ui**

```bash
pnpm dlx shadcn@latest init
```

Select: New York style, Zinc base color, CSS variables: yes.

**Step 4: Add initial shadcn components**

```bash
pnpm dlx shadcn@latest add button card input label form toast
```

**Step 5: Create environment template**

Create `.env.local.example`:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret-min-32-chars
```

**Step 6: Verify dev server starts**

```bash
pnpm dev
```

Expected: App running on localhost:3000, default Next.js page visible.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 project with Tailwind, shadcn/ui, Supabase deps"
```

---

### Task 2: Supabase Project Setup

**Files:**
- Create: `supabase/config.toml`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/admin.ts`

**Step 1: Initialize Supabase locally**

```bash
pnpm supabase init
```

This creates `supabase/config.toml`.

**Step 2: Start local Supabase**

```bash
pnpm supabase start
```

Note the output — it gives you `API URL`, `anon key`, and `service_role key`. Copy these into `.env.local`.

**Step 3: Create `.env.local`**

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-supabase-start>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-from-supabase-start>
JWT_SECRET=clubos-dev-secret-change-in-production-min32
```

**Step 4: Create browser Supabase client**

Create `lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Step 5: Create server Supabase client**

Create `lib/supabase/server.ts`:
```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Components (read-only)
          }
        },
      },
    }
  );
}
```

**Step 6: Create admin Supabase client**

Create `lib/supabase/admin.ts`:
```typescript
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

This client bypasses RLS — used only for onboarding and admin operations.

**Step 7: Commit**

```bash
git add lib/supabase/ supabase/config.toml .env.local.example
git commit -m "feat: set up Supabase clients (browser, server, admin)"
```

Do NOT commit `.env.local`.

---

### Task 3: Database Migration

**Files:**
- Create: `supabase/migrations/00001_initial_schema.sql`

**Step 1: Create migration file**

```bash
pnpm supabase migration new initial_schema
```

This creates a timestamped file in `supabase/migrations/`.

**Step 2: Write the schema**

Write the following SQL into the generated migration file:

```sql
-- Organizations
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  mode text NOT NULL DEFAULT 'standalone',
  created_at timestamptz DEFAULT now()
);

-- Clubs
CREATE TABLE clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  active boolean DEFAULT true,
  timezone text DEFAULT 'UTC',
  currency text DEFAULT 'USD',
  created_at timestamptz DEFAULT now()
);

-- Club branding
CREATE TABLE club_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid UNIQUE REFERENCES clubs(id) ON DELETE CASCADE,
  logo_url text,
  theme_name text DEFAULT 'default',
  primary_color text DEFAULT '#6366f1',
  secondary_color text DEFAULT '#ec4899',
  hero_content text,
  created_at timestamptz DEFAULT now()
);

-- Members
CREATE TABLE members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  member_code text NOT NULL,
  pin_hash text NOT NULL,
  full_name text,
  spin_balance integer DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  UNIQUE(club_id, member_code)
);

-- Spins
CREATE TABLE spins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  outcome_label text NOT NULL,
  outcome_value integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Wheel configs
CREATE TABLE wheel_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL,
  reward_type text NOT NULL,
  reward_value integer DEFAULT 0,
  probability numeric NOT NULL,
  color text,
  active boolean DEFAULT true
);

-- Indexes for tenant-scoped queries
CREATE INDEX idx_clubs_slug ON clubs(slug);
CREATE INDEX idx_clubs_org ON clubs(organization_id);
CREATE INDEX idx_members_club ON members(club_id);
CREATE INDEX idx_members_club_code ON members(club_id, member_code);
CREATE INDEX idx_spins_member ON spins(member_id);
CREATE INDEX idx_spins_club ON spins(club_id);
CREATE INDEX idx_wheel_configs_club ON wheel_configs(club_id);

-- RLS policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_configs ENABLE ROW LEVEL SECURITY;

-- For Phase 1, allow service role full access (onboarding uses admin client).
-- Public read access for clubs/branding (needed for tenant resolution).
CREATE POLICY "Public can read active clubs" ON clubs
  FOR SELECT USING (active = true);

CREATE POLICY "Public can read club branding" ON club_branding
  FOR SELECT USING (true);

CREATE POLICY "Public can read active wheel configs" ON wheel_configs
  FOR SELECT USING (active = true);
```

**Step 3: Apply migration**

```bash
pnpm supabase db reset
```

Expected: All tables created, RLS enabled, indexes created.

**Step 4: Verify tables exist**

```bash
pnpm supabase db lint
```

Expected: No errors.

**Step 5: Commit**

```bash
git add supabase/migrations/
git commit -m "feat: add initial database schema with RLS"
```

---

### Task 4: TypeScript Types

**Files:**
- Create: `lib/types/database.ts`

**Step 1: Generate types from Supabase**

```bash
pnpm supabase gen types typescript --local > lib/types/database.ts
```

**Step 2: Create convenience type exports**

Create `lib/types/index.ts`:
```typescript
import type { Database } from "./database";

export type { Database };

export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Club = Database["public"]["Tables"]["clubs"]["Row"];
export type ClubBranding = Database["public"]["Tables"]["club_branding"]["Row"];
export type Member = Database["public"]["Tables"]["members"]["Row"];
export type Spin = Database["public"]["Tables"]["spins"]["Row"];
export type WheelConfig = Database["public"]["Tables"]["wheel_configs"]["Row"];

export type OrganizationInsert = Database["public"]["Tables"]["organizations"]["Insert"];
export type ClubInsert = Database["public"]["Tables"]["clubs"]["Insert"];
export type ClubBrandingInsert = Database["public"]["Tables"]["club_branding"]["Insert"];
export type MemberInsert = Database["public"]["Tables"]["members"]["Insert"];
export type SpinInsert = Database["public"]["Tables"]["spins"]["Insert"];
export type WheelConfigInsert = Database["public"]["Tables"]["wheel_configs"]["Insert"];
```

**Step 3: Commit**

```bash
git add lib/types/
git commit -m "feat: add generated Supabase types and convenience exports"
```

---

### Task 5: Auth Utilities

**Files:**
- Create: `lib/auth.ts`

**Step 1: Create auth utilities**

Create `lib/auth.ts`:
```typescript
import { SignJWT, jwtVerify } from "jose";
import { hashSync, compareSync } from "bcryptjs";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const COOKIE_NAME = "clubos-member-token";

export function hashPin(pin: string): string {
  return hashSync(pin, 10);
}

export function verifyPin(pin: string, hash: string): boolean {
  return compareSync(pin, hash);
}

export async function createMemberToken(memberId: string, clubId: string): Promise<string> {
  return new SignJWT({ member_id: memberId, club_id: clubId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyMemberToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { member_id: string; club_id: string };
  } catch {
    return null;
  }
}

export async function setMemberCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function getMemberFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyMemberToken(token);
}

export async function clearMemberCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
```

**Step 2: Commit**

```bash
git add lib/auth.ts
git commit -m "feat: add JWT auth utilities for member code + PIN login"
```

---

### Task 6: Middleware (Club Resolution + Auth Guard)

**Files:**
- Create: `middleware.ts`

**Step 1: Create middleware**

Create `middleware.ts`:
```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const COOKIE_NAME = "clubos-member-token";

// Routes that don't need auth
const PUBLIC_PATHS = ["/login"];
// Routes that are not club-scoped
const PLATFORM_PATHS = ["/onboarding"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip platform routes
  if (PLATFORM_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Extract club slug from path: /club-slug/...
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return NextResponse.next();
  }

  const clubSlug = segments[0];

  // Skip static files and API routes
  if (clubSlug.startsWith("_next") || clubSlug.startsWith("api") || clubSlug === "favicon.ico") {
    return NextResponse.next();
  }

  // Check if this is a public path within a club
  const clubPath = "/" + segments.slice(1).join("/");
  const isPublicPath = PUBLIC_PATHS.some((p) => clubPath.startsWith(p));

  if (!isPublicPath) {
    // Verify member token
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.redirect(new URL(`/${clubSlug}/login`, request.url));
    }

    try {
      const { payload } = await jwtVerify(token, secret);
      // Inject member context into headers
      const response = NextResponse.next();
      response.headers.set("x-member-id", payload.member_id as string);
      response.headers.set("x-club-id", payload.club_id as string);
      return response;
    } catch {
      return NextResponse.redirect(new URL(`/${clubSlug}/login`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
```

**Step 2: Commit**

```bash
git add middleware.ts
git commit -m "feat: add middleware for club resolution and member auth guard"
```

---

### Task 7: Utility Functions

**Files:**
- Create: `lib/utils.ts` (may already exist from shadcn, extend it)

**Step 1: Add slug generation utility**

Edit `lib/utils.ts` to include:
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function generateMemberCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I, O, 0, 1
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
```

**Step 2: Commit**

```bash
git add lib/utils.ts
git commit -m "feat: add slug, member code, and PIN generation utilities"
```

---

### Task 8: Onboarding — Step 1 (Create Org & Club)

**Files:**
- Create: `app/(platform)/onboarding/page.tsx`
- Create: `app/(platform)/onboarding/actions.ts`
- Create: `app/(platform)/layout.tsx`

**UI guidance:** Run `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "onboarding form wizard multi-step" --stack shadcn` for design patterns.

**Step 1: Create platform layout**

Create `app/(platform)/layout.tsx`:
```typescript
export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}
```

**Step 2: Create onboarding server action**

Create `app/(platform)/onboarding/actions.ts`:
```typescript
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { generateSlug } from "@/lib/utils";
import { redirect } from "next/navigation";

export async function createOrgAndClub(formData: FormData) {
  const orgName = formData.get("orgName") as string;
  const clubName = formData.get("clubName") as string;
  const timezone = (formData.get("timezone") as string) || "UTC";
  const currency = (formData.get("currency") as string) || "USD";

  if (!orgName || !clubName) {
    return { error: "Organization and club names are required" };
  }

  const supabase = createAdminClient();

  // Create organization
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name: orgName, slug: generateSlug(orgName) })
    .select()
    .single();

  if (orgError) {
    return { error: `Failed to create organization: ${orgError.message}` };
  }

  // Create club
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .insert({
      organization_id: org.id,
      name: clubName,
      slug: generateSlug(clubName),
      timezone,
      currency,
    })
    .select()
    .single();

  if (clubError) {
    return { error: `Failed to create club: ${clubError.message}` };
  }

  // Create default branding
  await supabase.from("club_branding").insert({ club_id: club.id });

  redirect(`/onboarding/branding?clubId=${club.id}`);
}
```

**Step 3: Create onboarding page**

Create `app/(platform)/onboarding/page.tsx` — a form with org name, club name, timezone, currency fields. Use shadcn Card, Input, Label, Button components. Style it cleanly. Form calls `createOrgAndClub` server action.

Use the UI/UX skill for design guidance: `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "form card minimal" --stack shadcn`

**Step 4: Verify page renders**

```bash
pnpm dev
```

Visit `http://localhost:3000/onboarding`. Form should render.

**Step 5: Commit**

```bash
git add app/\(platform\)/
git commit -m "feat: add onboarding step 1 — create org and club"
```

---

### Task 9: Onboarding — Step 2 (Branding)

**Files:**
- Create: `app/(platform)/onboarding/branding/page.tsx`
- Add to: `app/(platform)/onboarding/actions.ts`

**Step 1: Add branding server action**

Add to `app/(platform)/onboarding/actions.ts`:
```typescript
export async function updateBranding(formData: FormData) {
  const clubId = formData.get("clubId") as string;
  const primaryColor = formData.get("primaryColor") as string;
  const secondaryColor = formData.get("secondaryColor") as string;
  const heroContent = formData.get("heroContent") as string;

  if (!clubId) return { error: "Club ID is required" };

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("club_branding")
    .update({
      primary_color: primaryColor || "#6366f1",
      secondary_color: secondaryColor || "#ec4899",
      hero_content: heroContent,
    })
    .eq("club_id", clubId);

  if (error) {
    return { error: `Failed to update branding: ${error.message}` };
  }

  redirect(`/onboarding/complete?clubId=${clubId}`);
}
```

Logo upload can be added later — color pickers and hero text are enough for Phase 1.

**Step 2: Create branding page**

Create `app/(platform)/onboarding/branding/page.tsx` — color picker inputs for primary/secondary, textarea for hero content, hidden input for clubId from search params. Use shadcn components.

**Step 3: Verify**

Navigate through step 1 -> step 2. Colors should save.

**Step 4: Commit**

```bash
git add app/\(platform\)/onboarding/
git commit -m "feat: add onboarding step 2 — club branding"
```

---

### Task 10: Onboarding — Step 3 (Complete + Seed Data)

**Files:**
- Create: `app/(platform)/onboarding/complete/page.tsx`
- Add to: `app/(platform)/onboarding/actions.ts`

**Step 1: Add seed action**

Add to `app/(platform)/onboarding/actions.ts`:
```typescript
import { hashPin, generateMemberCode, generatePin } from "@/lib/utils";
// Note: hashPin is from lib/auth.ts, generateMemberCode/generatePin from lib/utils.ts

export async function seedClubData(clubId: string) {
  const supabase = createAdminClient();

  // Seed default wheel segments
  const segments = [
    { club_id: clubId, label: "Drink", reward_type: "prize", reward_value: 1, probability: 0.2, color: "#22c55e" },
    { club_id: clubId, label: "Snack", reward_type: "prize", reward_value: 1, probability: 0.2, color: "#3b82f6" },
    { club_id: clubId, label: "Paper", reward_type: "prize", reward_value: 1, probability: 0.2, color: "#f59e0b" },
    { club_id: clubId, label: "Pre-Roll", reward_type: "prize", reward_value: 1, probability: 0.15, color: "#8b5cf6" },
    { club_id: clubId, label: "No Win", reward_type: "nothing", reward_value: 0, probability: 0.25, color: "#6b7280" },
  ];

  await supabase.from("wheel_configs").insert(segments);

  // Create test member
  const memberCode = generateMemberCode();
  const pin = generatePin();

  const { data: member } = await supabase
    .from("members")
    .insert({
      club_id: clubId,
      member_code: memberCode,
      pin_hash: hashPin(pin),
      full_name: "Test Member",
      spin_balance: 10,
    })
    .select()
    .single();

  return { memberCode, pin, memberId: member?.id };
}
```

**Step 2: Create complete page**

Create `app/(platform)/onboarding/complete/page.tsx` — server component that calls `seedClubData`, displays:
- Success message
- Test member code and PIN (displayed clearly so operator can test)
- Link to the member portal (`/club-slug/login`)
- Fetches club slug from DB using clubId

**Step 3: Test full onboarding flow**

1. Visit `/onboarding`
2. Fill in org + club name
3. Set branding colors
4. See completion page with test member credentials
5. Click portal link

**Step 4: Commit**

```bash
git add app/\(platform\)/onboarding/
git commit -m "feat: add onboarding step 3 — seed wheel config and test member"
```

---

### Task 11: Club Tenant Layout

**Files:**
- Create: `app/[clubSlug]/layout.tsx`

**Step 1: Create tenant layout**

Create `app/[clubSlug]/layout.tsx`:
```typescript
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

export default async function ClubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();

  // Fetch club + branding
  const { data: club } = await supabase
    .from("clubs")
    .select("*, club_branding(*)")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  const branding = club.club_branding?.[0] ?? null;

  return (
    <div
      style={{
        "--club-primary": branding?.primary_color ?? "#6366f1",
        "--club-secondary": branding?.secondary_color ?? "#ec4899",
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
```

Add CSS variables to `app/globals.css` so club colors cascade:
```css
.club-primary { color: var(--club-primary); }
.club-primary-bg { background-color: var(--club-primary); }
```

**Step 2: Commit**

```bash
git add app/\[clubSlug\]/
git commit -m "feat: add club tenant layout with dynamic branding"
```

---

### Task 12: Member Login Page

**Files:**
- Create: `app/[clubSlug]/(member)/login/page.tsx`
- Create: `app/[clubSlug]/(member)/login/actions.ts`

**UI guidance:** `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "login form PIN code" --stack shadcn`

**Step 1: Create login server action**

Create `app/[clubSlug]/(member)/login/actions.ts`:
```typescript
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPin, createMemberToken, setMemberCookie } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginMember(clubSlug: string, formData: FormData) {
  const memberCode = (formData.get("memberCode") as string).toUpperCase().trim();
  const pin = formData.get("pin") as string;

  if (!memberCode || !pin) {
    return { error: "Member code and PIN are required" };
  }

  const supabase = createAdminClient();

  // Get club
  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) return { error: "Club not found" };

  // Get member
  const { data: member } = await supabase
    .from("members")
    .select("id, pin_hash, status")
    .eq("club_id", club.id)
    .eq("member_code", memberCode)
    .single();

  if (!member) return { error: "Invalid member code or PIN" };
  if (member.status !== "active") return { error: "Account is inactive" };
  if (!verifyPin(pin, member.pin_hash)) return { error: "Invalid member code or PIN" };

  // Create JWT and set cookie
  const token = await createMemberToken(member.id, club.id);
  await setMemberCookie(token);

  redirect(`/${clubSlug}`);
}
```

**Step 2: Create login page**

Create `app/[clubSlug]/(member)/login/page.tsx` — form with member code input (uppercase, 6 chars), PIN input (4 digits, masked), login button. Club branding applied. Clean, minimal design.

**Step 3: Test login**

Use the test member credentials from onboarding. Should redirect to `/<club-slug>/` on success.

**Step 4: Commit**

```bash
git add app/\[clubSlug\]/\(member\)/login/
git commit -m "feat: add member login with code + PIN auth"
```

---

### Task 13: Member Auth Guard Layout

**Files:**
- Create: `app/[clubSlug]/(member)/layout.tsx`

**Step 1: Create member layout with auth guard**

Create `app/[clubSlug]/(member)/layout.tsx`:
```typescript
import { getMemberFromCookie } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export default async function MemberLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const memberPayload = await getMemberFromCookie();

  // Login page is excluded in middleware, but double-check here
  if (!memberPayload) {
    redirect(`/${clubSlug}/login`);
  }

  // Fetch member data for context
  const supabase = createAdminClient();
  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("id", memberPayload.member_id)
    .single();

  if (!member || member.status !== "active") {
    redirect(`/${clubSlug}/login`);
  }

  return <>{children}</>;
}
```

**Step 2: Commit**

```bash
git add app/\[clubSlug\]/\(member\)/layout.tsx
git commit -m "feat: add member auth guard layout"
```

---

### Task 14: Member Dashboard

**Files:**
- Create: `app/[clubSlug]/(member)/page.tsx`

**UI guidance:** `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "dashboard card balance gamification" --stack shadcn`

**Step 1: Create dashboard page**

Create `app/[clubSlug]/(member)/page.tsx` — server component that:
- Reads member from cookie
- Fetches member data (name, spin_balance)
- Fetches club branding
- Displays: welcome message, spin balance prominently, "Spin the Wheel" button (links to `/spin`), nav links to history and profile

**Step 2: Verify**

Login with test member -> see dashboard with 10 spins balance.

**Step 3: Commit**

```bash
git add app/\[clubSlug\]/\(member\)/page.tsx
git commit -m "feat: add member dashboard with spin balance"
```

---

### Task 15: Spin the Wheel

**Files:**
- Create: `app/[clubSlug]/(member)/spin/page.tsx`
- Create: `app/[clubSlug]/(member)/spin/actions.ts`
- Create: `components/club/spin-wheel.tsx`

**UI guidance:** `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "wheel spinner animation game" --stack shadcn`

**Step 1: Create spin server action**

Create `app/[clubSlug]/(member)/spin/actions.ts`:
```typescript
"use server";

import { getMemberFromCookie } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function performSpin() {
  const memberPayload = await getMemberFromCookie();
  if (!memberPayload) return { error: "Not authenticated" };

  const supabase = createAdminClient();

  // Check balance
  const { data: member } = await supabase
    .from("members")
    .select("id, spin_balance, club_id")
    .eq("id", memberPayload.member_id)
    .single();

  if (!member || member.spin_balance <= 0) {
    return { error: "No spins available" };
  }

  // Get wheel config
  const { data: segments } = await supabase
    .from("wheel_configs")
    .select("*")
    .eq("club_id", member.club_id)
    .eq("active", true);

  if (!segments || segments.length === 0) {
    return { error: "Wheel not configured" };
  }

  // Weighted random selection
  const totalProb = segments.reduce((sum, s) => sum + Number(s.probability), 0);
  let random = Math.random() * totalProb;
  let selected = segments[0];
  for (const segment of segments) {
    random -= Number(segment.probability);
    if (random <= 0) {
      selected = segment;
      break;
    }
  }

  // Decrement balance and log spin
  await supabase
    .from("members")
    .update({ spin_balance: member.spin_balance - 1 })
    .eq("id", member.id);

  await supabase.from("spins").insert({
    club_id: member.club_id,
    member_id: member.id,
    outcome_label: selected.label,
    outcome_value: selected.reward_value,
  });

  return {
    outcome: {
      label: selected.label,
      rewardType: selected.reward_type,
      value: selected.reward_value,
      color: selected.color,
    },
    newBalance: member.spin_balance - 1,
    segmentIndex: segments.indexOf(selected),
  };
}
```

**Step 2: Create wheel component**

Create `components/club/spin-wheel.tsx` — client component with:
- Canvas or CSS-based wheel with colored segments and labels
- Spin animation (CSS transform rotate with easing)
- Takes `segments` (from wheel_configs) as props
- `onSpin` callback that triggers server action
- Result display after animation completes

Keep the wheel visually appealing but not over-engineered. CSS transform rotation with transition is enough.

**Step 3: Create spin page**

Create `app/[clubSlug]/(member)/spin/page.tsx` — fetches wheel config, renders SpinWheel component, shows balance.

**Step 4: Test spinning**

Login -> Dashboard -> Spin -> see wheel animate -> see result -> balance decrements.

**Step 5: Commit**

```bash
git add app/\[clubSlug\]/\(member\)/spin/ components/club/spin-wheel.tsx
git commit -m "feat: add spin the wheel with weighted random and animation"
```

---

### Task 16: Spin History

**Files:**
- Create: `app/[clubSlug]/(member)/history/page.tsx`

**Step 1: Create history page**

Create `app/[clubSlug]/(member)/history/page.tsx` — server component that:
- Reads member from cookie
- Fetches spins ordered by created_at DESC
- Displays list with outcome label, value, and formatted timestamp
- Empty state if no spins yet

**Step 2: Commit**

```bash
git add app/\[clubSlug\]/\(member\)/history/
git commit -m "feat: add spin history page"
```

---

### Task 17: Member Profile

**Files:**
- Create: `app/[clubSlug]/(member)/profile/page.tsx`

**Step 1: Create profile page**

Create `app/[clubSlug]/(member)/profile/page.tsx` — server component that:
- Reads member from cookie
- Fetches member data
- Displays: member code, full name, spin balance, member since date
- Logout button (clears cookie, redirects to login)

**Step 2: Add logout action**

Add to a shared actions file or inline:
```typescript
"use server";
import { clearMemberCookie } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function logout(clubSlug: string) {
  await clearMemberCookie();
  redirect(`/${clubSlug}/login`);
}
```

**Step 3: Commit**

```bash
git add app/\[clubSlug\]/\(member\)/profile/
git commit -m "feat: add member profile page with logout"
```

---

### Task 18: Navigation Component

**Files:**
- Create: `components/club/member-nav.tsx`
- Modify: `app/[clubSlug]/(member)/layout.tsx`

**Step 1: Create mobile-friendly bottom nav**

Create `components/club/member-nav.tsx` — client component with bottom navigation bar:
- Home (dashboard)
- Spin
- History
- Profile

Uses club branding colors. Highlights active route.

**Step 2: Add nav to member layout**

Update `app/[clubSlug]/(member)/layout.tsx` to include `<MemberNav>` below children.

**Step 3: Commit**

```bash
git add components/club/member-nav.tsx app/\[clubSlug\]/\(member\)/layout.tsx
git commit -m "feat: add bottom navigation for member portal"
```

---

### Task 19: Landing Page

**Files:**
- Modify: `app/page.tsx`

**Step 1: Create simple landing page**

Update `app/page.tsx` — simple page with:
- ClubOS branding
- "Create a Club" button -> `/onboarding`
- Brief description

Not a marketing page — just functional entry point.

**Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add landing page with onboarding link"
```

---

### Task 20: End-to-End Smoke Test

**Step 1: Start fresh**

```bash
pnpm supabase db reset
pnpm dev
```

**Step 2: Full flow test**

1. Visit `http://localhost:3000` -> click "Create a Club"
2. Enter org name "Test Org", club name "Test Club" -> submit
3. Pick branding colors -> submit
4. See completion page with test member code + PIN
5. Click portal link -> arrive at `/test-club/login`
6. Enter member code + PIN -> login
7. See dashboard with 10 spins
8. Click Spin -> wheel animates -> result shown -> balance = 9
9. Click History -> see the spin logged
10. Click Profile -> see member info -> logout works

**Step 3: Fix any issues found**

**Step 4: Final commit**

```bash
git add -A
git commit -m "fix: polish end-to-end flow"
```
