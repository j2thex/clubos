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

// Routes that are not club-scoped
const PLATFORM_PATHS = ["/onboarding"];

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
  if (clubSlug.startsWith("_next") || clubSlug.startsWith("api") || clubSlug === "favicon.ico") {
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

      // Check DB status for page loads and RSC navigation,
      // but skip for server actions (handled by requireActiveStaff)
      const isServerAction = request.headers.has("next-action");
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

    // Check DB for membership expiry on page loads (skip server actions)
    const isServerAction = request.headers.has("next-action");
    if (!isServerAction) {
      const { data: member } = await supabaseAdmin
        .from("members")
        .select("status, valid_till")
        .eq("id", payload.member_id as string)
        .single();

      if (member?.valid_till) {
        const expiry = new Date(member.valid_till + "T00:00:00");
        if (expiry < new Date()) {
          const res = NextResponse.redirect(new URL(`/${clubSlug}/login?expired=1`, request.url));
          res.cookies.delete(MEMBER_COOKIE);
          return res;
        }
      }
    }

    const response = applyLocale(request, NextResponse.next());
    response.headers.set("x-member-id", payload.member_id as string);
    response.headers.set("x-club-id", payload.club_id as string);
    return response;
  } catch {
    return NextResponse.redirect(new URL(`/${clubSlug}/login`, request.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.*\\.svg|favicon\\.ico).*)",
  ],
};
