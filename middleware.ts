import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const MEMBER_COOKIE = "clubos-member-token";
const STAFF_COOKIE = "clubos-staff-token";
const OWNER_COOKIE = "clubos-owner-token";
const LOCALE_COOKIE = "clubos-lang";
const MEMBER_TOKEN_MAX_AGE = 60 * 60 * 24 * 365;

// Lock state cache: avoid a Supabase round-trip for every member/staff request.
// 30s TTL is short enough that unlock propagates quickly and the owner who
// toggles is revalidated atomically on their own request via revalidatePath.
const LOCK_TTL_MS = 30_000;
const lockCache = new Map<string, { locked: boolean; expires: number }>();

async function isClubLocked(slug: string): Promise<boolean> {
  const now = Date.now();
  const cached = lockCache.get(slug);
  if (cached && cached.expires > now) return cached.locked;

  const { data } = await supabaseAdmin
    .from("clubs")
    .select("locked_at")
    .eq("slug", slug)
    .maybeSingle();
  const locked = !!data?.locked_at;
  lockCache.set(slug, { locked, expires: now + LOCK_TTL_MS });
  return locked;
}

// Routes that are not club-scoped
const PLATFORM_PATHS = ["/onboarding", "/privacy", "/terms", "/platform-admin", "/examples", "/discover", "/for-clubs", "/contact"];

function applyLocale(request: NextRequest, response: NextResponse) {
  const cookieValue = request.cookies.get(LOCALE_COOKIE)?.value;
  let locale = "en";
  if (cookieValue === "es" || cookieValue === "en") {
    locale = cookieValue;
  } else {
    const acceptLang = request.headers.get("accept-language") ?? "";
    if (acceptLang.toLowerCase().startsWith("es") || acceptLang.toLowerCase().includes(",es")) {
      locale = "es";
    }
    // Auto-set cookie so detection only runs once
    response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" });
  }
  response.headers.set("x-lang", locale);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip platform routes
  if (PLATFORM_PATHS.some((p) => pathname.startsWith(p))) {
    return applyLocale(request, NextResponse.next());
  }

  // Extract club slug from path: /club-slug/...
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return applyLocale(request, NextResponse.next());
  }

  const clubSlug = segments[0];

  // Skip static files and API routes
  if (
    clubSlug.startsWith("_next") ||
    clubSlug.startsWith("api") ||
    clubSlug === "favicon.ico" ||
    clubSlug === "a2hs" ||
    clubSlug === "sw.js"
  ) {
    return applyLocale(request, NextResponse.next());
  }

  const clubPath = "/" + segments.slice(1).join("/");

  // Admin routes — require owner token (except admin login)
  if (clubPath.startsWith("/admin")) {
    if (clubPath === "/admin/login" || clubPath === "/admin/reset-password") {
      return applyLocale(request, NextResponse.next());
    }

    const token = request.cookies.get(OWNER_COOKIE)?.value;
    if (!token) {
      return NextResponse.redirect(new URL(`/${clubSlug}/admin/login`, request.url));
    }

    try {
      const { payload } = await jwtVerify(token, secret);
      if (!payload.is_owner) throw new Error("Not owner");
      const response = applyLocale(request, NextResponse.next());
      response.headers.set("x-owner-id", payload.owner_id as string);
      response.headers.set("x-club-id", payload.club_id as string);
      return response;
    } catch {
      return NextResponse.redirect(new URL(`/${clubSlug}/admin/login`, request.url));
    }
  }

  // Member login is public
  if (clubPath.startsWith("/login")) {
    return applyLocale(request, NextResponse.next());
  }

  // Public club profile is public
  if (clubPath.startsWith("/public")) {
    return applyLocale(request, NextResponse.next());
  }

  // Offline page is the lock rewrite target — let it render without re-checking
  // the lock (would loop) and without requiring a cookie.
  if (clubPath.startsWith("/offline")) {
    return applyLocale(request, NextResponse.next());
  }

  // Per-club PWA manifest and apple-touch-icon must be fetchable by iOS
  // without a member cookie — iOS fetches them anonymously during A2HS.
  if (clubPath === "/manifest.webmanifest" || clubPath.startsWith("/icon.png")) {
    return applyLocale(request, NextResponse.next());
  }

  // Staff routes — require staff token (except staff login)
  if (clubPath.startsWith("/staff")) {
    if (clubPath === "/staff/login") {
      return applyLocale(request, NextResponse.next());
    }

    const token = request.cookies.get(STAFF_COOKIE)?.value;
    if (!token) {
      return NextResponse.redirect(new URL(`/${clubSlug}/staff/login`, request.url));
    }

    try {
      const { payload } = await jwtVerify(token, secret);
      if (!payload.is_staff) throw new Error("Not staff");

      // Cross-club guard: staff cookies have path: "/" so a cookie from
      // club A persists across all clubs on the domain. Block here before
      // rendering any page of a different club's staff console, so users
      // aren't surprised by an "Unauthorized" on submit. Cookies issued
      // before this check shipped lack `club_slug` — treat as mismatch.
      if (payload.club_slug !== clubSlug) {
        const res = NextResponse.redirect(
          new URL(`/${clubSlug}/staff/login?reason=wrong-club`, request.url),
        );
        res.cookies.delete(STAFF_COOKIE);
        return res;
      }

      const isServerAction = request.headers.has("next-action");
      // Allow the lock action itself through even when locked, so staff
      // that just hit the Lock button can complete the server action. All
      // other server actions are blocked at the RPC/action layer.

      // Lockdown: route staff page loads to the offline page, not RSC actions.
      if (!isServerAction) {
        const locked = await isClubLocked(clubSlug);
        if (locked) {
          return NextResponse.rewrite(new URL(`/${clubSlug}/offline`, request.url));
        }
      }

      // Check DB status for page loads and RSC navigation,
      // but skip for server actions (handled by requireActiveStaff)
      if (!isServerAction) {
        const { data: staffMember } = await supabaseAdmin
          .from("members")
          .select("status")
          .eq("id", payload.member_id as string)
          .single();

        if (!staffMember || staffMember.status !== "active") {
          const res = NextResponse.redirect(
            new URL(`/${clubSlug}/staff/login`, request.url),
          );
          res.cookies.delete(STAFF_COOKIE);
          return res;
        }
      }

      const response = applyLocale(request, NextResponse.next());
      response.headers.set("x-member-id", payload.member_id as string);
      response.headers.set("x-club-id", payload.club_id as string);
      return response;
    } catch {
      return NextResponse.redirect(new URL(`/${clubSlug}/staff/login`, request.url));
    }
  }

  // All other club routes — require member token
  const token = request.cookies.get(MEMBER_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL(`/${clubSlug}/login`, request.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    // Lockdown: rewrite member traffic to the offline page.
    if (!request.headers.has("next-action")) {
      const locked = await isClubLocked(clubSlug);
      if (locked) {
        return NextResponse.rewrite(new URL(`/${clubSlug}/offline`, request.url));
      }
    }

    // Check membership expiry from JWT claim (no DB query needed)
    if (payload.valid_till) {
      const expiry = new Date((payload.valid_till as string) + "T00:00:00");
      if (expiry < new Date()) {
        const res = NextResponse.redirect(new URL(`/${clubSlug}/login?expired=1`, request.url));
        res.cookies.delete(MEMBER_COOKIE);
        return res;
      }
    }

    const response = applyLocale(request, NextResponse.next());
    response.headers.set("x-member-id", payload.member_id as string);
    response.headers.set("x-club-id", payload.club_id as string);
    // Sliding session: refresh cookie maxAge on each request so active members stay logged in.
    response.cookies.set(MEMBER_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MEMBER_TOKEN_MAX_AGE,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL(`/${clubSlug}/login`, request.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.*\\.svg|favicon\\.ico|icon\\.ico|apple-icon\\.png|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|opengraph-image|logo.*\\.png|logo\\.svg).*)",
  ],
};
