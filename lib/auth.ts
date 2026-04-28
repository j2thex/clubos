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

export type StaffPermission = "entry" | "sell" | "topup" | "transactions" | "qebo";

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
    .select("can_do_entry, can_do_sell, can_do_topup, can_do_transactions, can_do_qebo")
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

/**
 * Verify the Operations Module is enabled for the given club.
 *
 * The single source of truth for "is this ops surface allowed?" — used
 * by ops staff helpers, ops Owner helpers, and any direct check. Throws
 * if the flag is off so a malicious actor calling an ops server action
 * directly (bypassing the layout's notFound() gate) is still rejected.
 *
 * Does NOT check authentication — pair with requireStaffForClub /
 * requireOwnerForClub or use the composite helpers below.
 */
export async function requireOpsForClub(clubId: string): Promise<void> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("operations_module_enabled")
    .eq("id", clubId)
    .single();
  if (!club?.operations_module_enabled) {
    throw new Error("Operations Module is not enabled for this club");
  }
}

/**
 * Verify the current owner session belongs to the given club AND the
 * Operations Module is enabled. Use from every ops-domain Owner action
 * (products, finance, etc.) — anything that should disappear when the
 * flag is off.
 *
 * The bare requireOwnerForClub stays for non-ops Owner actions (the
 * module toggle itself, settings, branding, etc.) — those must work
 * regardless of the flag.
 */
export async function requireOwnerForOpsClub(
  clubId: string,
): Promise<{ owner_id: string; club_id: string }> {
  const session = await requireOwnerForClub(clubId);
  await requireOpsForClub(clubId);
  return session;
}

// --- Shared ops access (staff OR admin/owner) ---

/**
 * Find-or-create the synthetic "owner-proxy" member row used to attribute
 * ops actions performed by an admin/owner. Ops RPCs and FK columns all
 * require a members(id) uuid; owners have no members row of their own,
 * so we back them with one hidden proxy per (owner, club).
 */
async function getOrCreateOwnerProxyMember(
  ownerId: string,
  clubId: string,
): Promise<string> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("members")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("club_id", clubId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: owner } = await supabase
    .from("club_owners")
    .select("full_name, email")
    .eq("id", ownerId)
    .single();

  const displayName = owner?.full_name?.trim() || owner?.email || "Admin";

  // Unique human-ish member_code; collisions are astronomically unlikely.
  // Kept short so any debugger scanning members can spot proxy rows.
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  const memberCode = `OWN-${suffix}`;

  const { data: inserted, error } = await supabase
    .from("members")
    .insert({
      club_id: clubId,
      owner_id: ownerId,
      member_code: memberCode,
      full_name: `(Owner) ${displayName}`,
      is_staff: true,
      is_system_member: true,
      can_do_entry: true,
      can_do_sell: true,
      can_do_topup: true,
      can_do_transactions: true,
      status: "active",
    })
    .select("id")
    .single();

  if (error || !inserted) {
    throw new Error(`Failed to create owner proxy: ${error?.message ?? "unknown"}`);
  }
  return inserted.id;
}

export type OpsSession =
  | { kind: "staff"; member_id: string; owner_id: null; club_id: string }
  | { kind: "owner"; member_id: string; owner_id: string; club_id: string };

export type OpsPermission = StaffPermission;

/**
 * Resolve the current caller for an ops action: admin/owner first, then
 * staff. Owners implicitly hold every ops permission; staff are checked
 * via requireStaffPermission.
 *
 * Returns an OpsSession whose member_id is suitable for RPC p_staff_id
 * and FK columns (fulfilled_by, checked_in_by, etc.). For owners this is
 * the owner-proxy member row (auto-created on first use).
 *
 * Throws (caller wraps in try/catch and returns {error}).
 */
export async function requireOpsAccess(
  clubId: string,
  permission: OpsPermission,
): Promise<OpsSession> {
  await requireOpsForClub(clubId);
  const owner = await getOwnerFromCookie();
  if (owner && owner.club_id === clubId) {
    const memberId = await getOrCreateOwnerProxyMember(owner.owner_id, clubId);
    return {
      kind: "owner",
      member_id: memberId,
      owner_id: owner.owner_id,
      club_id: clubId,
    };
  }
  const staff = await requireStaffPermission(clubId, permission);
  return {
    kind: "staff",
    member_id: staff.member_id,
    owner_id: null,
    club_id: staff.club_id,
  };
}

/**
 * Read-only variant: admin OR any active staff for this club, no
 * permission flag check. Use for lookup/search endpoints that both
 * roles are allowed to hit.
 */
export async function requireOpsRead(
  clubId: string,
): Promise<OpsSession> {
  await requireOpsForClub(clubId);
  const owner = await getOwnerFromCookie();
  if (owner && owner.club_id === clubId) {
    const memberId = await getOrCreateOwnerProxyMember(owner.owner_id, clubId);
    return {
      kind: "owner",
      member_id: memberId,
      owner_id: owner.owner_id,
      club_id: clubId,
    };
  }
  const staff = await requireStaffForClub(clubId);
  return {
    kind: "staff",
    member_id: staff.member_id,
    owner_id: null,
    club_id: staff.club_id,
  };
}
