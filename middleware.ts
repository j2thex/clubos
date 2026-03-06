import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const COOKIE_NAME = "clubos-member-token";

// Routes that don't need auth
const PUBLIC_PATHS = ["/login", "/staff", "/admin"];
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
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
