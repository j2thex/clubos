"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireOpsAccess, requireOpsRead } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { getMemberIdPhotoSignedUrl } from "@/lib/supabase/storage";
import { revalidatePath } from "next/cache";

export type LookupResult =
  | { ok: true; member: LookedUpMember }
  | { error: string };

export type LookedUpMember = {
  id: string;
  memberCode: string;
  fullName: string | null;
  dateOfBirth: string | null;
  age: number | null;
  idVerifiedAt: string | null;
  idPhotoSignedUrl: string | null;
  validTill: string | null;
  validExpired: boolean;
  openEntryId: string | null;
  openEntrySince: string | null;
};

export type CheckinResult =
  | { ok: true; entryId: string }
  | { error: string };

function computeAge(dob: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function sanitizeCode(raw: string): string {
  const trimmed = raw.trim().toUpperCase();
  // Accept both a bare code ("ABC12") and a full member URL / QR payload
  // ("https://osocios.club/club-slug?code=ABC12" or plain "ABC12"). The
  // MemberIdCard encodes only the bare code today, so this is defensive.
  const maybeUrl = trimmed.match(/[A-Z0-9]{3,8}/);
  return maybeUrl ? maybeUrl[0] : trimmed;
}

type MemberRow = {
  id: string;
  member_code: string;
  full_name: string | null;
  status: string;
  date_of_birth: string | null;
  id_verified_at: string | null;
  id_photo_path: string | null;
  valid_till: string | null;
};

async function buildLookedUpMember(
  supabase: ReturnType<typeof createAdminClient>,
  member: MemberRow,
): Promise<LookedUpMember> {
  const age = computeAge(member.date_of_birth ?? null);
  const today = new Date().toISOString().split("T")[0];
  const validExpired = !!(member.valid_till && member.valid_till < today);

  const { data: openEntry } = await supabase
    .from("club_entries")
    .select("id, checked_in_at")
    .eq("member_id", member.id)
    .is("checked_out_at", null)
    .order("checked_in_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const signed = member.id_photo_path
    ? await getMemberIdPhotoSignedUrl(member.id_photo_path, 1800)
    : null;

  return {
    id: member.id,
    memberCode: member.member_code,
    fullName: member.full_name ?? null,
    dateOfBirth: member.date_of_birth ?? null,
    age,
    idVerifiedAt: member.id_verified_at ?? null,
    idPhotoSignedUrl: signed,
    validTill: member.valid_till ?? null,
    validExpired,
    openEntryId: openEntry?.id ?? null,
    openEntrySince: openEntry?.checked_in_at ?? null,
  };
}

export async function lookupMemberForEntry(
  clubId: string,
  rawCode: string,
): Promise<LookupResult> {
  try { await requireOpsRead(clubId); } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const code = sanitizeCode(rawCode);
  if (!code) return { error: "Empty code" };

  const supabase = createAdminClient();
  const { data: member } = await supabase
    .from("members")
    .select(
      "id, member_code, full_name, status, date_of_birth, id_verified_at, id_photo_path, valid_till",
    )
    .eq("club_id", clubId)
    .eq("member_code", code)
    .maybeSingle();

  if (!member) return { error: `Member ${code} not found` };
  if (member.status !== "active") return { error: "Member is inactive" };

  return { ok: true, member: await buildLookedUpMember(supabase, member) };
}

export async function lookupMemberByRfidUid(
  clubId: string,
  rawUid: string,
): Promise<LookupResult> {
  try { await requireOpsRead(clubId); } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  // Match how the chip is stored in member-creator: trim only, no case fold.
  // The unique index is case-sensitive; readers always emit the same UID
  // for a given chip, so trim is enough.
  const uid = rawUid.trim();
  if (!uid) return { error: "Empty chip" };

  const supabase = createAdminClient();
  const { data: member } = await supabase
    .from("members")
    .select(
      "id, member_code, full_name, status, date_of_birth, id_verified_at, id_photo_path, valid_till",
    )
    .eq("club_id", clubId)
    .eq("rfid_uid", uid)
    .maybeSingle();

  if (!member) return { error: "Chip not registered to any member" };
  if (member.status !== "active") return { error: "Member is inactive" };

  return { ok: true, member: await buildLookedUpMember(supabase, member) };
}

export async function admitMember(
  clubId: string,
  clubSlug: string,
  memberId: string,
): Promise<CheckinResult> {
  let actor: Awaited<ReturnType<typeof requireOpsAccess>>;
  try { actor = await requireOpsAccess(clubId, "entry"); } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }
  const supabase = createAdminClient();

  const { data: member } = await supabase
    .from("members")
    .select("id, member_code, status, date_of_birth, valid_till")
    .eq("id", memberId)
    .eq("club_id", clubId)
    .single();

  if (!member) return { error: "Member not found" };
  if (member.status !== "active") return { error: "Member is inactive" };

  const today = new Date().toISOString().split("T")[0];
  if (member.valid_till && member.valid_till < today) {
    await logActivity({
      clubId,
      staffMemberId: actor.member_id,
      actorOwnerId: actor.owner_id,
      action: "entry_blocked_expired",
      targetMemberCode: member.member_code,
      details: `valid till ${member.valid_till}`,
    });
    return { error: "Membership expired" };
  }

  const age = computeAge(member.date_of_birth ?? null);
  if (age === null) {
    await logActivity({
      clubId,
      staffMemberId: actor.member_id,
      actorOwnerId: actor.owner_id,
      action: "entry_blocked_no_dob",
      targetMemberCode: member.member_code,
    });
    return { error: "No date of birth on file" };
  }
  if (age < 21) {
    await logActivity({
      clubId,
      staffMemberId: actor.member_id,
      actorOwnerId: actor.owner_id,
      action: "entry_blocked_underage",
      targetMemberCode: member.member_code,
      details: `age ${age}`,
    });
    return { error: `Under 21 (age ${age})` };
  }

  const { data: entry, error } = await supabase
    .from("club_entries")
    .insert({
      club_id: clubId,
      member_id: member.id,
      checked_in_by: actor.member_id,
    })
    .select("id")
    .single();

  if (error) {
    // Unique-index violation → already inside.
    if (error.code === "23505") {
      await logActivity({
        clubId,
        staffMemberId: actor.member_id,
        actorOwnerId: actor.owner_id,
        action: "entry_blocked_duplicate",
        targetMemberCode: member.member_code,
      });
      return { error: "Already checked in" };
    }
    return { error: "Failed to admit member" };
  }

  await logActivity({
    clubId,
    staffMemberId: actor.member_id,
    actorOwnerId: actor.owner_id,
    action: "entry_checkin",
    targetMemberCode: member.member_code,
    details: `age ${age}`,
  });

  revalidatePath(`/${clubSlug}/staff/operations/capacity`);
  revalidatePath(`/${clubSlug}/staff/operations/entry`);
  revalidatePath(`/${clubSlug}/admin/operations/capacity`);
  revalidatePath(`/${clubSlug}/admin/operations/entry`);
  return { ok: true, entryId: entry.id };
}

export async function checkoutAllOpen(
  clubId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true; count: number }> {
  let actor: Awaited<ReturnType<typeof requireOpsAccess>>;
  try { actor = await requireOpsAccess(clubId, "entry"); } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("club_entries")
    .update({ checked_out_at: nowIso, checked_out_by: actor.member_id })
    .eq("club_id", clubId)
    .is("checked_out_at", null)
    .select("id");

  if (error) return { error: "Failed to close sessions" };

  const count = data?.length ?? 0;
  if (count > 0) {
    await logActivity({
      clubId,
      staffMemberId: actor.member_id,
      actorOwnerId: actor.owner_id,
      action: "entry_bulk_checkout",
      details: `${count} sessions closed`,
    });
  }

  revalidatePath(`/${clubSlug}/staff/operations/capacity`);
  revalidatePath(`/${clubSlug}/staff/operations/entry`);
  revalidatePath(`/${clubSlug}/admin/operations/capacity`);
  revalidatePath(`/${clubSlug}/admin/operations/entry`);
  return { ok: true, count };
}

export type MemberSearchResult = {
  memberCode: string;
  fullName: string | null;
  dateOfBirth: string | null;
  idVerifiedAt: string | null;
};

export async function searchMembersByName(
  clubId: string,
  query: string,
): Promise<{ error: string } | { ok: true; matches: MemberSearchResult[] }> {
  try { await requireOpsRead(clubId); } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const trimmed = query.trim();
  if (trimmed.length < 2) return { ok: true, matches: [] };

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("members")
    .select("member_code, full_name, date_of_birth, id_verified_at")
    .eq("club_id", clubId)
    .eq("status", "active")
    .eq("is_system_member", false)
    .or(`full_name.ilike.%${trimmed}%,member_code.ilike.%${trimmed}%`)
    .order("full_name", { ascending: true })
    .limit(10);

  return {
    ok: true,
    matches: (data ?? []).map((m) => ({
      memberCode: m.member_code,
      fullName: m.full_name ?? null,
      dateOfBirth: m.date_of_birth ?? null,
      idVerifiedAt: m.id_verified_at ?? null,
    })),
  };
}

export async function checkoutEntry(
  entryId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { data: current } = await supabase
    .from("club_entries")
    .select("id, club_id, member_id, checked_in_at, checked_out_at, members(member_code)")
    .eq("id", entryId)
    .single();

  if (!current) return { error: "Entry not found" };
  if (current.checked_out_at) return { error: "Already checked out" };

  let actor: Awaited<ReturnType<typeof requireOpsAccess>>;
  try { actor = await requireOpsAccess(current.club_id, "entry"); } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("club_entries")
    .update({ checked_out_at: now, checked_out_by: actor.member_id })
    .eq("id", entryId);

  if (error) return { error: "Failed to check out" };

  const durationMin = Math.round(
    (new Date(now).getTime() - new Date(current.checked_in_at).getTime()) / 60000,
  );

  const memberRef = Array.isArray(current.members)
    ? current.members[0]
    : current.members;

  await logActivity({
    clubId: current.club_id,
    staffMemberId: actor.member_id,
    actorOwnerId: actor.owner_id,
    action: "entry_checkout",
    targetMemberCode: memberRef?.member_code ?? null,
    details: `duration ${durationMin} min`,
  });

  revalidatePath(`/${clubSlug}/staff/operations/capacity`);
  revalidatePath(`/${clubSlug}/staff/operations/entry`);
  revalidatePath(`/${clubSlug}/admin/operations/capacity`);
  revalidatePath(`/${clubSlug}/admin/operations/entry`);
  return { ok: true };
}
