import { SignJWT, jwtVerify } from "jose";
import { hashSync, compareSync } from "bcryptjs";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
export const MEMBER_COOKIE = "clubos-member-token";
const STAFF_COOKIE = "clubos-staff-token";

export const MEMBER_TOKEN_MAX_AGE = 60 * 60 * 24 * 365;

export function hashPin(pin: string): string {
  return hashSync(pin, 10);
}

export function verifyPin(pin: string, hash: string): boolean {
  return compareSync(pin, hash);
}

// --- Member auth (code only, no PIN) ---

export async function createMemberToken(memberId: string, clubId: string, validTill?: string | null): Promise<string> {
  return new SignJWT({ member_id: memberId, club_id: clubId, ...(validTill && { valid_till: validTill }) })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("365d")
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
  cookieStore.set(MEMBER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MEMBER_TOKEN_MAX_AGE,
    path: "/",
  });
}

export async function getMemberFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(MEMBER_COOKIE)?.value;
  if (!token) return null;
  return verifyMemberToken(token);
}

export async function clearMemberCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(MEMBER_COOKIE);
}

// --- Staff auth (code + PIN) ---

export async function createStaffToken(
  memberId: string,
  clubId: string,
  clubSlug: string,
): Promise<string> {
  return new SignJWT({
    member_id: memberId,
    club_id: clubId,
    club_slug: clubSlug,
    is_staff: true,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("12h")
    .sign(secret);
}

export async function verifyStaffToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.is_staff) return null;
    return payload as {
      member_id: string;
      club_id: string;
      club_slug?: string;
      is_staff: true;
    };
  } catch {
    return null;
  }
}

export async function setStaffCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(STAFF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 12,
    path: "/",
  });
}

export async function getStaffFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(STAFF_COOKIE)?.value;
  if (!token) return null;
  return verifyStaffToken(token);
}

export async function clearStaffCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(STAFF_COOKIE);
}

/**
 * Verify the current staff session is active. Call from server actions
 * to block deactivated staff. Throws an error (not redirect) so client
 * components can catch and display it. Middleware handles the actual
 * redirect on the next page load/navigation.
 */
export async function requireActiveStaff(): Promise<{ member_id: string; club_id: string }> {
  const session = await getStaffFromCookie();
  if (!session) {
    throw new Error("Not authenticated");
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const { data: member } = await supabase
    .from("members")
    .select("status")
    .eq("id", session.member_id)
    .single();

  if (!member || member.status !== "active") {
    throw new Error("Account is inactive");
  }

  return session;
}

/**
 * Verify the current staff session is active AND belongs to the given
 * club. Use from any server action that accepts a clubId or loads a
 * resource and wants to block cross-club writes.
 *
 * Throws (caller wraps in try/catch and returns {error}).
 */
export async function requireStaffForClub(
  clubId: string,
): Promise<{ member_id: string; club_id: string }> {
  const session = await requireActiveStaff();
  if (session.club_id !== clubId) {
    throw new Error("You're logged in as staff for a different club. Please log in again.");
  }
  return session;
}

export type StaffPermission = "entry" | "sell" | "topup" | "transactions";

/**
 * Verify the current staff session is active, belongs to the given club,
 * AND holds the named capability flag on their member row. Ops routes and
 * ops mutations call this to block staff that the owner has restricted.
 *
 * Throws (caller wraps in try/catch and either shows NoAccessCard on a
 * page, or returns {error} from an action).
 */
export async function requireStaffPermission(
  clubId: string,
  permission: StaffPermission,
): Promise<{ member_id: string; club_id: string }> {
  const session = await requireStaffForClub(clubId);
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const { data: member } = await supabase
    .from("members")
    .select("can_do_entry, can_do_sell, can_do_topup, can_do_transactions")
    .eq("id", session.member_id)
    .single();
  const column = `can_do_${permission}` as const;
  if (!member || !member[column]) {
    throw new Error(`Not permitted: ${permission}`);
  }
  return session;
}

// --- Owner auth (email + password) ---

const OWNER_COOKIE = "clubos-owner-token";

export function hashPassword(password: string): string {
  return hashSync(password, 12);
}

export function verifyPassword(password: string, hash: string): boolean {
  return compareSync(password, hash);
}

export async function createOwnerToken(ownerId: string, clubId: string): Promise<string> {
  return new SignJWT({ owner_id: ownerId, club_id: clubId, is_owner: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(secret);
}

export async function verifyOwnerToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.is_owner) return null;
    return payload as { owner_id: string; club_id: string; is_owner: true };
  } catch {
    return null;
  }
}

export async function setOwnerCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(OWNER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });
}

export async function getOwnerFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(OWNER_COOKIE)?.value;
  if (!token) return null;
  return verifyOwnerToken(token);
}

export async function clearOwnerCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(OWNER_COOKIE);
}

/**
 * Verify the current owner session belongs to the given club. Use from
 * any admin server action that accepts a clubId or loads a resource.
 *
 * Throws (caller wraps in try/catch and returns {error}).
 */
export async function requireOwnerForClub(
  clubId: string,
): Promise<{ owner_id: string; club_id: string }> {
  const session = await getOwnerFromCookie();
  if (!session) {
    throw new Error("Not authenticated");
  }
  if (session.club_id !== clubId) {
    throw new Error("Unauthorized");
  }
  return { owner_id: session.owner_id, club_id: session.club_id };
}
