"use server";

import { redirect } from "next/navigation";
import { timingSafeEqual } from "crypto";
import {
  createPlatformAdminToken,
  setPlatformAdminCookie,
  clearPlatformAdminCookie,
} from "@/lib/auth";

export async function loginPlatformAdmin(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.PLATFORM_ADMIN_SECRET;

  if (!expected) {
    return { error: "Server misconfigured: PLATFORM_ADMIN_SECRET not set" };
  }

  // Constant-time compare. timingSafeEqual requires equal-length buffers,
  // so hash both sides to a fixed length first to defeat length-leak.
  const { createHash } = await import("crypto");
  const a = createHash("sha256").update(password).digest();
  const b = createHash("sha256").update(expected).digest();
  if (!timingSafeEqual(a, b)) {
    return { error: "Incorrect password" };
  }

  await setPlatformAdminCookie(await createPlatformAdminToken());
  redirect("/platform-admin");
}

export async function logoutPlatformAdmin() {
  await clearPlatformAdminCookie();
  redirect("/platform-admin/login");
}
