"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { hashPin, getStaffFromCookie, requireActiveStaff } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity-log";

export async function updateMemberRole(memberId: string, roleId: string | null, clubSlug: string) {
  try { await requireActiveStaff(); } catch { return { error: "Account is inactive" }; }
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("members")
    .update({ role_id: roleId || null })
    .eq("id", memberId);

  if (error) {
    return { error: "Failed to update role" };
  }

  // Log role assignment
  const [{ data: memberForLog }, roleData] = await Promise.all([
    supabase.from("members").select("member_code, club_id").eq("id", memberId).single(),
    roleId
      ? supabase.from("member_roles").select("name").eq("id", roleId).single()
      : Promise.resolve({ data: null }),
  ]);

  const staff = await getStaffFromCookie();
  await logActivity({
    clubId: memberForLog?.club_id ?? "",
    staffMemberId: staff?.member_id,
    action: "role_assigned",
    targetMemberCode: memberForLog?.member_code,
    details: roleData?.data?.name ?? "No role",
  });

  revalidatePath(`/${clubSlug}/staff/members`);
  return { ok: true };
}

export async function createMember(
  clubId: string,
  memberCode: string,
  clubSlug: string,
  periodId?: string | null,
  referredBy?: string | null,
) {
  try { await requireActiveStaff(); } catch { return { error: "Account is inactive" }; }
  const code = memberCode.trim().toUpperCase();

  if (!code || code.length < 3 || code.length > 6) {
    return { error: "Member code must be 3-6 characters" };
  }
  if (!/^[A-Z0-9]+$/.test(code)) {
    return { error: "Member code must be alphanumeric" };
  }

  const supabase = createAdminClient();

  // Validate referral code if provided
  let referredByCode: string | null = null;
  if (referredBy) {
    const refCode = referredBy.trim().toUpperCase();
    if (refCode) {
      if (refCode === code) {
        return { error: "Member cannot refer themselves" };
      }
      const { data: referrer } = await supabase
        .from("members")
        .select("id")
        .eq("club_id", clubId)
        .eq("member_code", refCode)
        .single();
      if (!referrer) return { error: "Referral code not found" };
      referredByCode = refCode;
    }
  }

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
    referred_by: referredByCode,
  });

  if (error) {
    if (error.code === "23505") return { error: "Member code already exists" };
    return { error: "Failed to create member" };
  }

  const staff = await getStaffFromCookie();
  const details = [
    validTill ? `Period till ${validTill}` : null,
    referredByCode ? `Referred by ${referredByCode}` : null,
  ].filter(Boolean).join(", ");

  await logActivity({
    clubId,
    staffMemberId: staff?.member_id,
    action: "member_created",
    targetMemberCode: code,
    details: details || undefined,
  });

  revalidatePath(`/${clubSlug}/staff/members`);
  return { ok: true };
}

export async function assignMembershipPeriod(
  memberId: string,
  periodId: string | null,
  clubSlug: string,
) {
  try { await requireActiveStaff(); } catch { return { error: "Account is inactive" }; }
  const supabase = createAdminClient();

  if (!periodId) {
    const { error } = await supabase
      .from("members")
      .update({ membership_period_id: null, valid_till: null })
      .eq("id", memberId);
    if (error) return { error: "Failed to update membership" };
    revalidatePath(`/${clubSlug}/staff/members`);
    return { ok: true };
  }

  const { data: period } = await supabase
    .from("membership_periods")
    .select("duration_months")
    .eq("id", periodId)
    .single();

  if (!period) return { error: "Period not found" };

  const d = new Date();
  d.setMonth(d.getMonth() + period.duration_months);
  const validTill = d.toISOString().split("T")[0];

  const { error } = await supabase
    .from("members")
    .update({ membership_period_id: periodId, valid_till: validTill })
    .eq("id", memberId);

  if (error) return { error: "Failed to assign period" };

  // Get member code for logging
  const { data: memberForLog } = await supabase
    .from("members")
    .select("member_code, club_id")
    .eq("id", memberId)
    .single();

  const staff = await getStaffFromCookie();
  await logActivity({
    clubId: memberForLog?.club_id ?? "",
    staffMemberId: staff?.member_id,
    action: "membership_assigned",
    targetMemberCode: memberForLog?.member_code,
    details: `${period.duration_months}mo period, valid till ${validTill}`,
  });

  revalidatePath(`/${clubSlug}/staff/members`);
  return { ok: true };
}

export async function setManualValidTill(
  memberId: string,
  validTill: string,
  clubSlug: string,
) {
  try { await requireActiveStaff(); } catch { return { error: "Account is inactive" }; }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(validTill)) {
    return { error: "Invalid date format" };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("members")
    .update({ valid_till: validTill, membership_period_id: null })
    .eq("id", memberId);

  if (error) return { error: "Failed to set validity date" };

  const { data: memberForLog } = await supabase
    .from("members")
    .select("member_code, club_id")
    .eq("id", memberId)
    .single();

  const staff = await getStaffFromCookie();
  await logActivity({
    clubId: memberForLog?.club_id ?? "",
    staffMemberId: staff?.member_id,
    action: "validity_updated",
    targetMemberCode: memberForLog?.member_code,
    details: `Valid till ${validTill}`,
  });

  revalidatePath(`/${clubSlug}/staff/members`);
  return { ok: true };
}

export async function createStaffMember(
  clubId: string,
  memberCode: string,
  pin: string,
  clubSlug: string,
) {
  try { await requireActiveStaff(); } catch { return { error: "Account is inactive" }; }
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
