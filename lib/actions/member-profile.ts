"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireOpsRead } from "@/lib/auth";
import { getMemberPhotoSignedUrl } from "@/lib/supabase/storage";

export type MemberProfile = {
  id: string;
  memberCode: string;
  fullName: string | null;
  status: string;
  dateOfBirth: string | null;
  validTill: string | null;
  validExpired: boolean;
  idVerifiedAt: string | null;
  photoSignedUrl: string | null;
  staffNote: string | null;
  email: string | null;
  phone: string | null;
};

export async function getMemberProfileByCode(
  clubSlug: string,
  memberCode: string,
): Promise<{ ok: true; member: MemberProfile } | { error: string }> {
  const supabase = createAdminClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .eq("active", true)
    .maybeSingle();
  if (!club) return { error: "club_not_found" };

  await requireOpsRead(club.id);

  const code = memberCode.trim().toUpperCase();
  const { data, error } = await supabase
    .from("members")
    .select(
      "id, member_code, full_name, status, date_of_birth, valid_till, id_verified_at, photo_path, staff_note, email, phone",
    )
    .eq("club_id", club.id)
    .eq("member_code", code)
    .maybeSingle();

  if (error || !data) return { error: "not_found" };

  const today = new Date().toISOString().split("T")[0];
  const validExpired = !!(data.valid_till && data.valid_till < today);
  const photoSignedUrl = data.photo_path
    ? await getMemberPhotoSignedUrl(data.photo_path)
    : null;

  return {
    ok: true,
    member: {
      id: data.id,
      memberCode: data.member_code,
      fullName: data.full_name,
      status: data.status,
      dateOfBirth: data.date_of_birth,
      validTill: data.valid_till,
      validExpired,
      idVerifiedAt: data.id_verified_at,
      photoSignedUrl,
      staffNote: data.staff_note,
      email: data.email,
      phone: data.phone,
    },
  };
}
