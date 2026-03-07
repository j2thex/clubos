import { SignJWT, jwtVerify } from "jose";
import { hashSync, compareSync } from "bcryptjs";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const MEMBER_COOKIE = "clubos-member-token";
const STAFF_COOKIE = "clubos-staff-token";

export function hashPin(pin: string): string {
  return hashSync(pin, 10);
}

export function verifyPin(pin: string, hash: string): boolean {
  return compareSync(pin, hash);
}

// --- Member auth (code only, no PIN) ---

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
  cookieStore.set(MEMBER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
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

export async function createStaffToken(memberId: string, clubId: string): Promise<string> {
  return new SignJWT({ member_id: memberId, club_id: clubId, is_staff: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("12h")
    .sign(secret);
}

export async function verifyStaffToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.is_staff) return null;
    return payload as { member_id: string; club_id: string; is_staff: true };
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
