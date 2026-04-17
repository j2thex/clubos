"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { hashPin, getStaffFromCookie, requireActiveStaff, requireStaffForClub } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity-log";
import {
  uploadMemberIdPhoto as uploadMemberIdPhotoToBucket,
  deleteMemberIdPhoto,
  uploadMemberPhoto as uploadMemberPhotoToBucket,
  deleteMemberPhoto,
  uploadMemberSignature as uploadMemberSignatureToBucket,
  deleteMemberSignature,
} from "@/lib/supabase/storage";

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

export type CreateMemberInput = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  residencyStatus: "local" | "tourist";
  idNumber: string;
  phone: string;
  email?: string | null;
  periodId?: string | null;
  referredBy?: string | null;
  idPhotoPath?: string | null;
  photoPath?: string | null;
  signaturePath?: string | null;
  rfidUid?: string | null;
  opsEnabled?: boolean;
};

function ageFromDob(dob: string): number {
  const [y, m, d] = dob.split("-").map(Number);
  const today = new Date();
  let age = today.getUTCFullYear() - y;
  const before =
    today.getUTCMonth() + 1 < m ||
    (today.getUTCMonth() + 1 === m && today.getUTCDate() < d);
  if (before) age -= 1;
  return age;
}

function baseCodeFromNames(firstName: string, lastName: string): string {
  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
  const a = normalize(firstName).slice(0, 2).padEnd(2, "X");
  const b = normalize(lastName).slice(0, 2).padEnd(2, "X");
  return `${a}${b}`;
}

async function cleanupOrphanedUploads(input: CreateMemberInput): Promise<void> {
  const jobs: Promise<unknown>[] = [];
  if (input.idPhotoPath) jobs.push(deleteMemberIdPhoto(input.idPhotoPath).catch(() => {}));
  if (input.photoPath) jobs.push(deleteMemberPhoto(input.photoPath).catch(() => {}));
  if (input.signaturePath) jobs.push(deleteMemberSignature(input.signaturePath).catch(() => {}));
  if (jobs.length) await Promise.all(jobs);
}

export async function createMember(
  clubId: string,
  clubSlug: string,
  input: CreateMemberInput,
): Promise<{ error: string } | { ok: true; memberCode: string }> {
  try { await requireStaffForClub(clubId); } catch (err) {
    await cleanupOrphanedUploads(input);
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const idNumber = input.idNumber.trim();
  const phone = input.phone.trim();
  const email = input.email?.trim() || null;

  if (!firstName || !lastName) {
    await cleanupOrphanedUploads(input);
    return { error: "First name and last name are required" };
  }
  if (!input.dateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(input.dateOfBirth)) {
    await cleanupOrphanedUploads(input);
    return { error: "Valid date of birth is required" };
  }
  if (ageFromDob(input.dateOfBirth) < 18) {
    await cleanupOrphanedUploads(input);
    return {
      error:
        "This club requires members to be 18 or older. The account was not created.",
    };
  }
  if (input.residencyStatus !== "local" && input.residencyStatus !== "tourist") {
    await cleanupOrphanedUploads(input);
    return { error: "Residency must be local or tourist" };
  }
  if (!idNumber) {
    await cleanupOrphanedUploads(input);
    return { error: "ID number is required" };
  }
  if (!phone) {
    await cleanupOrphanedUploads(input);
    return { error: "Phone number is required" };
  }

  const supabase = createAdminClient();

  // Server-verified ops flag — don't trust the client's flag alone.
  const { data: clubRow } = await supabase
    .from("clubs")
    .select("operations_module_enabled")
    .eq("id", clubId)
    .single();
  const opsEnabled = Boolean(clubRow?.operations_module_enabled);

  if (opsEnabled) {
    if (!input.idPhotoPath) {
      await cleanupOrphanedUploads(input);
      return { error: "ID photo is required for this club" };
    }
    if (!input.photoPath) {
      await cleanupOrphanedUploads(input);
      return { error: "Member portrait is required for this club" };
    }
    if (!input.signaturePath) {
      await cleanupOrphanedUploads(input);
      return { error: "Signature is required for this club" };
    }
  }

  // Validate referral code if provided
  let referredByCode: string | null = null;
  if (input.referredBy) {
    const refCode = input.referredBy.trim().toUpperCase();
    if (refCode) {
      const { data: referrer } = await supabase
        .from("members")
        .select("id")
        .eq("club_id", clubId)
        .eq("member_code", refCode)
        .single();
      if (!referrer) {
        await cleanupOrphanedUploads(input);
        return { error: "Referral code not found" };
      }
      referredByCode = refCode;
    }
  }

  // Calculate valid_till if period selected
  let membershipPeriodId: string | null = null;
  let validTill: string | null = null;

  if (input.periodId) {
    const { data: period } = await supabase
      .from("membership_periods")
      .select("duration_months")
      .eq("id", input.periodId)
      .single();

    if (period) {
      membershipPeriodId = input.periodId;
      const d = new Date();
      d.setMonth(d.getMonth() + period.duration_months);
      validTill = d.toISOString().split("T")[0];
    }
  }

  // Pre-flight RFID uniqueness so we can return a clear error message before
  // any INSERT. Final safety net is the members_club_rfid_uid_uniq partial index.
  const rfidUidClean = input.rfidUid?.trim() || null;
  if (rfidUidClean) {
    const { data: existingRfid } = await supabase
      .from("members")
      .select("id, member_code")
      .eq("club_id", clubId)
      .eq("rfid_uid", rfidUidClean)
      .maybeSingle();
    if (existingRfid) {
      await cleanupOrphanedUploads(input);
      return {
        error: `This chip is already bound to member ${existingRfid.member_code}`,
      };
    }
  }

  // Auto-generate member code: <first2><last2><seq>. Retry a few times on
  // 23505 (uniqueness collision) in case of concurrent inserts.
  const base = baseCodeFromNames(firstName, lastName);
  const { data: existingCodes } = await supabase
    .from("members")
    .select("member_code")
    .eq("club_id", clubId)
    .like("member_code", `${base}%`);

  const usedSeqs = new Set<number>();
  for (const row of existingCodes ?? []) {
    const suffix = row.member_code.slice(base.length);
    if (/^\d+$/.test(suffix)) usedSeqs.add(parseInt(suffix, 10));
  }

  let nextSeq = 1;
  while (usedSeqs.has(nextSeq)) nextSeq += 1;

  const fullName = `${firstName} ${lastName}`;
  let code = "";
  let insertError: { code?: string; message?: string } | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    code = `${base}${String(nextSeq).padStart(2, "0")}`;
    const { error } = await supabase.from("members").insert({
      club_id: clubId,
      member_code: code,
      full_name: fullName,
      first_name: firstName,
      last_name: lastName,
      date_of_birth: input.dateOfBirth,
      residency_status: input.residencyStatus,
      id_number: idNumber,
      phone,
      email,
      spin_balance: 0,
      membership_period_id: membershipPeriodId,
      valid_till: validTill,
      referred_by: referredByCode,
      id_photo_path: input.idPhotoPath || null,
      photo_path: input.photoPath || null,
      signature_path: input.signaturePath || null,
      rfid_uid: rfidUidClean,
    });
    if (!error) {
      insertError = null;
      break;
    }
    // If the collision is on rfid_uid (race with a concurrent insert), don't
    // retry with a bumped sequence — that won't help. Surface immediately.
    if (error.code === "23505" && error.message?.includes("rfid_uid")) {
      insertError = error;
      break;
    }
    if (error.code !== "23505") {
      insertError = error;
      break;
    }
    // 23505 on member_code — bump seq and try again.
    nextSeq += 1;
    insertError = error;
  }

  if (insertError) {
    await cleanupOrphanedUploads(input);
    if (insertError.code === "23505" && insertError.message?.includes("rfid_uid")) {
      return { error: "This chip is already bound to another member" };
    }
    if (insertError.code === "23505") {
      return { error: "Could not generate a unique member code — try different names" };
    }
    return { error: "Failed to create member" };
  }

  const staff = await getStaffFromCookie();

  // Auto-reward premium referrer
  if (referredByCode) {
    const { data: referrer } = await supabase
      .from("members")
      .select("id, spin_balance, is_premium_referrer, referral_reward_spins")
      .eq("club_id", clubId)
      .eq("member_code", referredByCode)
      .single();

    if (referrer?.is_premium_referrer && referrer.referral_reward_spins > 0) {
      await supabase
        .from("members")
        .update({ spin_balance: referrer.spin_balance + referrer.referral_reward_spins })
        .eq("id", referrer.id);

      await logActivity({
        clubId,
        action: "referral_reward",
        targetMemberCode: referredByCode,
        details: `+${referrer.referral_reward_spins} spins for referring ${code}`,
      });
    }

    // Auto-complete referral quests for the referrer
    const { data: referralQuests } = await supabase
      .from("quests")
      .select("id, reward_spins, multi_use, badge_id")
      .eq("club_id", clubId)
      .eq("quest_type", "referral")
      .eq("active", true);

    if (referralQuests && referralQuests.length > 0) {
      // Re-fetch referrer to get current spin_balance (may have been updated by premium reward above)
      const { data: currentReferrer } = await supabase
        .from("members")
        .select("id, spin_balance")
        .eq("club_id", clubId)
        .eq("member_code", referredByCode)
        .single();

      if (currentReferrer) {
        let totalSpinsToAdd = 0;

        for (const quest of referralQuests) {
          if (!quest.multi_use) {
            // Check if already completed
            const { count } = await supabase
              .from("member_quests")
              .select("*", { count: "exact", head: true })
              .eq("member_id", currentReferrer.id)
              .eq("quest_id", quest.id)
              .eq("status", "verified");
            if ((count ?? 0) > 0) continue; // Already completed single-use quest
          }

          // Insert quest completion
          await supabase.from("member_quests").insert({
            quest_id: quest.id,
            member_id: currentReferrer.id,
            status: "verified",
            verified_by: staff?.member_id ?? null,
            referral_member_code: code,
          });

          totalSpinsToAdd += quest.reward_spins;

          // Award badge if quest has one
          if (quest.badge_id) {
            await supabase.from("member_badges").upsert(
              { member_id: currentReferrer.id, badge_id: quest.badge_id, quest_id: quest.id },
              { onConflict: "member_id,badge_id", ignoreDuplicates: true }
            );
          }

          await logActivity({
            clubId,
            staffMemberId: staff?.member_id,
            action: "quest_auto_completed",
            targetMemberCode: referredByCode,
            details: `Referral quest completed: referred ${code}, +${quest.reward_spins} spins`,
          });
        }

        // Award all spins at once
        if (totalSpinsToAdd > 0) {
          await supabase
            .from("members")
            .update({ spin_balance: currentReferrer.spin_balance + totalSpinsToAdd })
            .eq("id", currentReferrer.id);
        }
      }
    }
  }

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
  revalidatePath(`/${clubSlug}`, "layout");
  return { ok: true, memberCode: code };
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

export async function uploadMemberIdPhotoAction(
  formData: FormData,
): Promise<{ path: string } | { error: string }> {
  const clubId = formData.get("clubId");
  if (typeof clubId !== "string" || !clubId) return { error: "Missing club" };

  try { await requireStaffForClub(clubId); } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No file provided" };
  if (file.size > 5 * 1024 * 1024) return { error: "File too large (max 5 MB)" };

  return uploadMemberIdPhotoToBucket(clubId, file);
}

export async function uploadMemberPhotoAction(
  formData: FormData,
): Promise<{ path: string } | { error: string }> {
  const clubId = formData.get("clubId");
  if (typeof clubId !== "string" || !clubId) return { error: "Missing club" };

  try { await requireStaffForClub(clubId); } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No file provided" };
  if (file.size > 5 * 1024 * 1024) return { error: "File too large (max 5 MB)" };

  return uploadMemberPhotoToBucket(clubId, file);
}

export async function uploadMemberSignatureAction(
  formData: FormData,
): Promise<{ path: string } | { error: string }> {
  const clubId = formData.get("clubId");
  if (typeof clubId !== "string" || !clubId) return { error: "Missing club" };

  try { await requireStaffForClub(clubId); } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No file provided" };
  if (file.size > 512 * 1024) return { error: "Signature too large (max 500 KB)" };
  if (file.type !== "image/png") return { error: "Signature must be PNG" };

  return uploadMemberSignatureToBucket(clubId, file);
}

export async function markIdVerified(
  memberId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { data: current, error: loadError } = await supabase
    .from("members")
    .select("club_id, member_code, date_of_birth, id_photo_path")
    .eq("id", memberId)
    .single();

  if (loadError || !current) return { error: "Member not found" };
  if (!current.date_of_birth) return { error: "Set date of birth before verifying" };

  let staff: { member_id: string; club_id: string };
  try { staff = await requireStaffForClub(current.club_id); } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const { error } = await supabase
    .from("members")
    .update({
      id_verified_at: new Date().toISOString(),
      id_verified_by: staff.member_id,
    })
    .eq("id", memberId);

  if (error) return { error: "Failed to mark verified" };

  await logActivity({
    clubId: current.club_id,
    staffMemberId: staff.member_id,
    action: "id_verified",
    targetMemberCode: current.member_code,
    details: current.id_photo_path ? "with photo" : "no photo",
  });

  revalidatePath(`/${clubSlug}/staff/members`);
  return { ok: true };
}

export async function revokeIdVerification(
  memberId: string,
  clubSlug: string,
  reason?: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { data: current } = await supabase
    .from("members")
    .select("club_id, member_code")
    .eq("id", memberId)
    .single();

  if (!current) return { error: "Member not found" };

  let staff: { member_id: string; club_id: string };
  try { staff = await requireStaffForClub(current.club_id); } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const { error } = await supabase
    .from("members")
    .update({ id_verified_at: null, id_verified_by: null })
    .eq("id", memberId);

  if (error) return { error: "Failed to revoke verification" };

  await logActivity({
    clubId: current.club_id,
    staffMemberId: staff.member_id,
    action: "id_verification_revoked",
    targetMemberCode: current.member_code,
    details: reason ?? null,
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

  if (!code || code.length < 3 || code.length > 8) {
    return { error: "Staff code must be 3-8 characters" };
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

// ============================================================================
// Staff member detail — view + edit onboarding fields (parity with admin)
// ============================================================================

import type { UpdateMemberIdentityInput } from "@/components/club/member-detail";

async function authorizeMemberStaff(
  memberId: string,
): Promise<
  | { error: string }
  | {
      ok: true;
      clubId: string;
      memberCode: string;
      staffMemberId: string | undefined;
    }
> {
  const supabase = createAdminClient();
  const { data: member } = await supabase
    .from("members")
    .select("club_id, member_code")
    .eq("id", memberId)
    .single();

  if (!member) return { error: "Member not found" };

  let session: { member_id: string; club_id: string };
  try {
    session = await requireStaffForClub(member.club_id);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  return {
    ok: true,
    clubId: member.club_id,
    memberCode: member.member_code,
    staffMemberId: session.member_id,
  };
}

export async function staffUpdateMemberIdentity(
  memberId: string,
  clubSlug: string,
  input: UpdateMemberIdentityInput,
): Promise<{ error: string } | { ok: true }> {
  const auth = await authorizeMemberStaff(memberId);
  if ("error" in auth) return auth;

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  if (!firstName || !lastName) {
    return { error: "First name and last name are required" };
  }

  if (input.dateOfBirth) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dateOfBirth)) {
      return { error: "Invalid date of birth" };
    }
    const [y, m, d] = input.dateOfBirth.split("-").map(Number);
    const today = new Date();
    let age = today.getUTCFullYear() - y;
    const before =
      today.getUTCMonth() + 1 < m ||
      (today.getUTCMonth() + 1 === m && today.getUTCDate() < d);
    if (before) age -= 1;
    if (age < 18) {
      return {
        error:
          "This club requires members to be 18 or older. The change was not saved.",
      };
    }
  }

  if (
    input.residencyStatus !== null &&
    input.residencyStatus !== "local" &&
    input.residencyStatus !== "tourist"
  ) {
    return { error: "Residency must be local or tourist" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("members")
    .update({
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`,
      date_of_birth: input.dateOfBirth || null,
      residency_status: input.residencyStatus,
      id_number: input.idNumber?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
    })
    .eq("id", memberId);

  if (error) return { error: "Failed to update member" };

  await logActivity({
    clubId: auth.clubId,
    staffMemberId: auth.staffMemberId,
    action: "staff_member_identity_updated",
    targetMemberCode: auth.memberCode,
    details: `${firstName} ${lastName}`,
  });

  revalidatePath(`/${clubSlug}/staff/members`);
  return { ok: true };
}

async function validateStaffReplaceFormData(
  formData: FormData,
  maxBytes: number,
  requiredMime?: string,
): Promise<
  | { error: string }
  | { memberId: string; clubId: string; file: File; staffMemberId: string | undefined }
> {
  const memberId = formData.get("memberId");
  const clubId = formData.get("clubId");
  if (typeof memberId !== "string" || !memberId) return { error: "Missing member" };
  if (typeof clubId !== "string" || !clubId) return { error: "Missing club" };

  let session: { member_id: string; club_id: string };
  try {
    session = await requireStaffForClub(clubId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No file provided" };
  }
  if (file.size > maxBytes) {
    return { error: `File too large (max ${Math.round(maxBytes / 1024)} KB)` };
  }
  if (requiredMime && file.type !== requiredMime) {
    return { error: `File must be ${requiredMime}` };
  }

  return { memberId, clubId, file, staffMemberId: session.member_id };
}

export async function staffReplaceMemberIdPhoto(
  formData: FormData,
): Promise<{ error: string } | { ok: true; path: string }> {
  const validated = await validateStaffReplaceFormData(formData, 5 * 1024 * 1024);
  if ("error" in validated) return validated;

  const supabase = createAdminClient();
  const { data: member } = await supabase
    .from("members")
    .select("club_id, member_code, id_photo_path")
    .eq("id", validated.memberId)
    .single();
  if (!member || member.club_id !== validated.clubId) return { error: "Member not found" };

  const upload = await uploadMemberIdPhotoToBucket(validated.clubId, validated.file);
  if ("error" in upload) return upload;

  const { error: updateError } = await supabase
    .from("members")
    .update({ id_photo_path: upload.path })
    .eq("id", validated.memberId);

  if (updateError) {
    await deleteMemberIdPhoto(upload.path).catch(() => {});
    return { error: "Failed to update member" };
  }

  if (member.id_photo_path) {
    await deleteMemberIdPhoto(member.id_photo_path).catch(() => {});
  }

  await logActivity({
    clubId: validated.clubId,
    staffMemberId: validated.staffMemberId,
    action: "staff_member_idphoto_replaced",
    targetMemberCode: member.member_code,
  });

  revalidatePath(`/${validated.clubId}/staff/members`);
  return { ok: true, path: upload.path };
}

export async function staffReplaceMemberPhoto(
  formData: FormData,
): Promise<{ error: string } | { ok: true; path: string }> {
  const validated = await validateStaffReplaceFormData(formData, 5 * 1024 * 1024);
  if ("error" in validated) return validated;

  const supabase = createAdminClient();
  const { data: member } = await supabase
    .from("members")
    .select("club_id, member_code, photo_path")
    .eq("id", validated.memberId)
    .single();
  if (!member || member.club_id !== validated.clubId) return { error: "Member not found" };

  const upload = await uploadMemberPhotoToBucket(validated.clubId, validated.file);
  if ("error" in upload) return upload;

  const { error: updateError } = await supabase
    .from("members")
    .update({ photo_path: upload.path })
    .eq("id", validated.memberId);

  if (updateError) {
    await deleteMemberPhoto(upload.path).catch(() => {});
    return { error: "Failed to update member" };
  }

  if (member.photo_path) {
    await deleteMemberPhoto(member.photo_path).catch(() => {});
  }

  await logActivity({
    clubId: validated.clubId,
    staffMemberId: validated.staffMemberId,
    action: "staff_member_portrait_replaced",
    targetMemberCode: member.member_code,
  });

  revalidatePath(`/${validated.clubId}/staff/members`);
  return { ok: true, path: upload.path };
}

export async function staffReplaceMemberSignature(
  formData: FormData,
): Promise<{ error: string } | { ok: true; path: string }> {
  const validated = await validateStaffReplaceFormData(formData, 512 * 1024, "image/png");
  if ("error" in validated) return validated;

  const supabase = createAdminClient();
  const { data: member } = await supabase
    .from("members")
    .select("club_id, member_code, signature_path")
    .eq("id", validated.memberId)
    .single();
  if (!member || member.club_id !== validated.clubId) return { error: "Member not found" };

  const upload = await uploadMemberSignatureToBucket(validated.clubId, validated.file);
  if ("error" in upload) return upload;

  const { error: updateError } = await supabase
    .from("members")
    .update({ signature_path: upload.path })
    .eq("id", validated.memberId);

  if (updateError) {
    await deleteMemberSignature(upload.path).catch(() => {});
    return { error: "Failed to update member" };
  }

  if (member.signature_path) {
    await deleteMemberSignature(member.signature_path).catch(() => {});
  }

  await logActivity({
    clubId: validated.clubId,
    staffMemberId: validated.staffMemberId,
    action: "staff_member_signature_replaced",
    targetMemberCode: member.member_code,
  });

  revalidatePath(`/${validated.clubId}/staff/members`);
  return { ok: true, path: upload.path };
}

export async function staffRebindMemberRfid(
  memberId: string,
  clubSlug: string,
  newUidRaw: string | null,
): Promise<{ error: string } | { ok: true }> {
  const auth = await authorizeMemberStaff(memberId);
  if ("error" in auth) return auth;

  const newUid = newUidRaw?.trim() || null;

  const supabase = createAdminClient();

  if (newUid) {
    const { data: conflict } = await supabase
      .from("members")
      .select("id, member_code")
      .eq("club_id", auth.clubId)
      .eq("rfid_uid", newUid)
      .neq("id", memberId)
      .maybeSingle();
    if (conflict) {
      return {
        error: `This chip is already bound to member ${conflict.member_code}`,
      };
    }
  }

  const { error } = await supabase
    .from("members")
    .update({ rfid_uid: newUid })
    .eq("id", memberId);

  if (error) {
    if (error.code === "23505") {
      return { error: "This chip is already bound to another member" };
    }
    return { error: "Failed to update chip binding" };
  }

  await logActivity({
    clubId: auth.clubId,
    staffMemberId: auth.staffMemberId,
    action: newUid ? "staff_member_rfid_bound" : "staff_member_rfid_unbound",
    targetMemberCode: auth.memberCode,
    details: newUid ?? undefined,
  });

  revalidatePath(`/${clubSlug}/staff/members`);
  return { ok: true };
}
