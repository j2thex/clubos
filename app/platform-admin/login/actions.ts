"use server";

import { redirect } from "next/navigation";
import { timingSafeEqual, createHash } from "crypto";
import {
  createPlatformAdminToken,
  setPlatformAdminCookie,
  clearPlatformAdminCookie,
} from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp } from "@/lib/get-client-ip";

const RATE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const RATE_MAX_FAILURES = 5;
const SLOW_FAIL_MS = 750;

async function isRateLimited(ip: string): Promise<boolean> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
  const { count } = await supabase
    .from("platform_admin_login_attempts")
    .select("*", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("attempted_at", since);
  return (count ?? 0) >= RATE_MAX_FAILURES;
}

async function recordFailure(ip: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("platform_admin_login_attempts").insert({ ip });
}

async function clearFailures(ip: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("platform_admin_login_attempts").delete().eq("ip", ip);
}

export async function loginPlatformAdmin(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const ip = await getClientIp();
  const password = String(formData.get("password") ?? "");
  const expected = process.env.PLATFORM_ADMIN_SECRET;

  if (!expected) {
    return { error: "Server misconfigured: PLATFORM_ADMIN_SECRET not set" };
  }

  if (await isRateLimited(ip)) {
    // Constant slow-fail even when blocked, so probing the lockout state
    // costs the same as a normal attempt.
    await new Promise((r) => setTimeout(r, SLOW_FAIL_MS));
    return {
      error: `Too many attempts. Try again in ${RATE_WINDOW_MS / 60000} minutes.`,
    };
  }

  // Constant-time compare. timingSafeEqual requires equal-length buffers,
  // so hash both sides to a fixed length first to defeat length-leak.
  const a = createHash("sha256").update(password).digest();
  const b = createHash("sha256").update(expected).digest();
  if (!timingSafeEqual(a, b)) {
    await recordFailure(ip);
    await new Promise((r) => setTimeout(r, SLOW_FAIL_MS));
    return { error: "Incorrect password" };
  }

  await clearFailures(ip);
  await setPlatformAdminCookie(await createPlatformAdminToken());
  redirect("/platform-admin");
}

export async function logoutPlatformAdmin() {
  await clearPlatformAdminCookie();
  redirect("/platform-admin/login");
}
