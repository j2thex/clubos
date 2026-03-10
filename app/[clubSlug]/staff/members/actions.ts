"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { hashPin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateMemberRole(memberId: string, roleId: string | null, clubSlug: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("members")
    .update({ role_id: roleId || null })
    .eq("id", memberId);

  if (error) {
    return { error: "Failed to update role" };
  }

  revalidatePath(`/${clubSlug}/staff/members`);
  return { ok: true };
}

export async function createMember(
  clubId: string,
  memberCode: string,
  clubSlug: string,
  periodId?: string | null,
) {
  const code = memberCode.trim().toUpperCase();

  if (!code || code.length < 3 || code.length > 6) {
    return { error: "Member code must be 3-6 characters" };
  }
  if (!/^[A-Z0-9]+$/.test(code)) {
    return { error: "Member code must be alphanumeric" };
  }

  const supabase = createAdminClient();

  // Calculate valid_till if period selected
  let membershipPeriodId: string | null = null;
  let validTill: string | null = null;

  if (periodId) {
    const { data: period } = await supabase
      .from("membership_periods")
      .select("duration_months")
      .eq("id", periodId)
      .single();

    if (period) {
      membershipPeriodId = periodId;
      const d = new Date();
      d.setMonth(d.getMonth() + period.duration_months);
      validTill = d.toISOString().split("T")[0];
    }
  }

  const { error } = await supabase.from("members").insert({
    club_id: clubId,
    member_code: code,
    spin_balance: 0,
    membership_period_id: membershipPeriodId,
    valid_till: validTill,
  });

  if (error) {
    if (error.code === "23505") return { error: "Member code already exists" };
    return { error: "Failed to create member" };
  }

  revalidatePath(`/${clubSlug}/staff/members`);
  return { ok: true };
}

export async function prolongateMembership(memberId: string, clubSlug: string) {
  const supabase = createAdminClient();

  const { data: member } = await supabase
    .from("members")
    .select("valid_till, membership_period_id")
    .eq("id", memberId)
    .single();

  if (!member?.membership_period_id) return { error: "No membership period assigned" };

  const { data: period } = await supabase
    .from("membership_periods")
    .select("duration_months")
    .eq("id", member.membership_period_id)
    .single();

  if (!period) return { error: "Membership period not found" };

  // Extend from valid_till if future, from today if expired
  const base = member.valid_till && new Date(member.valid_till) > new Date()
    ? new Date(member.valid_till)
    : new Date();
  base.setMonth(base.getMonth() + period.duration_months);
  const newValidTill = base.toISOString().split("T")[0];

  const { error } = await supabase
    .from("members")
    .update({ valid_till: newValidTill })
    .eq("id", memberId);

  if (error) return { error: "Failed to extend membership" };

  revalidatePath(`/${clubSlug}/staff/members`);
  return { ok: true };
}

export async function createStaffMember(
  clubId: string,
  memberCode: string,
  pin: string,
  clubSlug: string,
) {
  const code = memberCode.trim().toUpperCase();
  const trimmedPin = pin.trim();

  if (!code || code.length < 3 || code.length > 6) {
    return { error: "Staff code must be 3-6 characters" };
  }
  if (!/^[A-Z0-9]+$/.test(code)) {
    return { error: "Staff code must be alphanumeric" };
  }
  if (!trimmedPin || trimmedPin.length !== 4 || !/^\d{4}$/.test(trimmedPin)) {
    return { error: "PIN must be exactly 4 digits" };
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from("members").insert({
    club_id: clubId,
    member_code: code,
    pin_hash: hashPin(trimmedPin),
    spin_balance: 0,
    is_staff: true,
  });

  if (error) {
    if (error.code === "23505") return { error: "Code already exists" };
    return { error: "Failed to create staff member" };
  }

  revalidatePath(`/${clubSlug}/staff/members`);
  return { ok: true };
}
