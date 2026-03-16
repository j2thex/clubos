"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { hashPassword } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { headers } from "next/headers";

export async function requestPasswordReset(
  clubSlug: string,
  email: string,
): Promise<{ ok: true }> {
  const trimmedEmail = email.toLowerCase().trim();
  if (!trimmedEmail) return { ok: true }; // silent — don't reveal if email exists

  const supabase = createAdminClient();

  // Look up club
  const { data: club } = await supabase
    .from("clubs")
    .select("id, name")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) return { ok: true };

  // Look up owner by email + club association
  const { data: owner } = await supabase
    .from("club_owners")
    .select("id, club_owner_clubs!inner(club_id)")
    .eq("club_owner_clubs.club_id", club.id)
    .ilike("email", trimmedEmail)
    .single();

  if (!owner) return { ok: true };

  // Generate token
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  await supabase.from("password_reset_tokens").insert({
    owner_id: owner.id,
    token,
    expires_at: expiresAt,
  });

  // Build reset URL
  const headersList = await headers();
  const host = headersList.get("host") ?? "osocios.club";
  const protocol = host.includes("localhost") ? "http" : "https";
  const resetUrl = `${protocol}://${host}/${clubSlug}/admin/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail(trimmedEmail, resetUrl, club.name);
  } catch {
    // Don't expose email errors to the user
  }

  return { ok: true };
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ error: string } | { ok: true }> {
  if (!token) return { error: "Invalid reset link" };
  if (!newPassword || newPassword.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const supabase = createAdminClient();

  // Look up valid token
  const { data: resetToken } = await supabase
    .from("password_reset_tokens")
    .select("id, owner_id, expires_at, used")
    .eq("token", token)
    .single();

  if (!resetToken) return { error: "Invalid reset link" };
  if (resetToken.used) return { error: "This reset link has already been used" };
  if (new Date(resetToken.expires_at) < new Date()) {
    return { error: "This reset link has expired. Please request a new one." };
  }

  // Update password
  const passwordHash = hashPassword(newPassword);
  const { error: updateError } = await supabase
    .from("club_owners")
    .update({ password_hash: passwordHash })
    .eq("id", resetToken.owner_id);

  if (updateError) return { error: "Failed to update password" };

  // Mark token as used
  await supabase
    .from("password_reset_tokens")
    .update({ used: true })
    .eq("id", resetToken.id);

  return { ok: true };
}
