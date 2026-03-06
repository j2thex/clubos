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
