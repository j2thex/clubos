import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const MEMBER_COOKIE = "clubos-member-token";
const STAFF_COOKIE = "clubos-staff-token";
const OWNER_COOKIE = "clubos-owner-token";

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

  const clubPath = "/" + segments.slice(1).join("/");

  // Admin routes — require owner token (except admin login)
  if (clubPath.startsWith("/admin")) {
    if (clubPath === "/admin/login") {
      return NextResponse.next();
    }

    const token = request.cookies.get(OWNER_COOKIE)?.value;
    if (!token) {
      return NextResponse.redirect(new URL(`/${clubSlug}/admin/login`, request.url));
    }

    try {
      const { payload } = await jwtVerify(token, secret);
      if (!payload.is_owner) throw new Error("Not owner");
      const response = NextResponse.next();
      response.headers.set("x-owner-id", payload.owner_id as string);
      response.headers.set("x-club-id", payload.club_id as string);
      return response;
    } catch {
      return NextResponse.redirect(new URL(`/${clubSlug}/admin/login`, request.url));
    }
  }

  // Member login is public
  if (clubPath.startsWith("/login")) {
    return NextResponse.next();
  }

  // Staff routes — require staff token (except staff login)
  if (clubPath.startsWith("/staff")) {
    if (clubPath === "/staff/login") {
      return NextResponse.next();
    }

    const token = request.cookies.get(STAFF_COOKIE)?.value;
    if (!token) {
      return NextResponse.redirect(new URL(`/${clubSlug}/staff/login`, request.url));
    }

    try {
      const { payload } = await jwtVerify(token, secret);
      if (!payload.is_staff) throw new Error("Not staff");
      const response = NextResponse.next();
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
    const response = NextResponse.next();
    response.headers.set("x-member-id", payload.member_id as string);
    response.headers.set("x-club-id", payload.club_id as string);
    return response;
  } catch {
    return NextResponse.redirect(new URL(`/${clubSlug}/login`, request.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
