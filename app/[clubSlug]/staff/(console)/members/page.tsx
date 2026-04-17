import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { StaffMemberCreator } from "../../members/member-creator";
import { MembersSearch, type MembersSearchMember } from "./members-search";
import {
  getMemberIdPhotoSignedUrl,
  getMemberPhotoSignedUrl,
  getMemberSignatureSignedUrl,
} from "@/lib/supabase/storage";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import type { MemberDetailRecord } from "@/components/club/member-detail";

export default async function StaffMembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { clubSlug } = await params;
  const { q: initialQuery } = await searchParams;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, operations_module_enabled")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();
  const opsEnabled = club.operations_module_enabled ?? false;

  const [{ data: members }, { data: roles }, { data: periods }] = await Promise.all([
    supabase
      .from("members")
      .select(
        "id, member_code, full_name, first_name, last_name, spin_balance, status, role_id, membership_period_id, valid_till, date_of_birth, residency_status, id_number, phone, email, id_verified_at, id_photo_path, photo_path, signature_path, rfid_uid, member_roles(id, name)",
      )
      .eq("club_id", club.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("member_roles")
      .select("id, name")
      .eq("club_id", club.id)
      .order("display_order", { ascending: true }),
    supabase
      .from("membership_periods")
      .select("id, name, duration_months")
      .eq("club_id", club.id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
  ]);

  // Generate signed URLs for member ID photos + portraits + signatures (only if ops module is on).
  const membersWithSigned: MembersSearchMember[] = await Promise.all(
    (members ?? []).map(async (m) => {
      const roleName = Array.isArray(m.member_roles)
        ? m.member_roles[0]?.name ?? null
        : (m.member_roles as { id: string; name: string } | null)?.name ?? null;
      const signed =
        opsEnabled && m.id_photo_path
          ? await getMemberIdPhotoSignedUrl(m.id_photo_path, 1800)
          : null;
      return {
        id: m.id,
        memberCode: m.member_code,
        fullName: m.full_name,
        spinBalance: m.spin_balance,
        roleId: m.role_id,
        roleName,
        validTill: m.valid_till ?? null,
        dateOfBirth: m.date_of_birth ?? null,
        idVerifiedAt: m.id_verified_at ?? null,
        idPhotoSignedUrl: signed,
      };
    }),
  );

  // Separately build the MemberDetailRecord[] for the expandable panel (ops-enabled clubs only).
  const memberDetails: MemberDetailRecord[] = opsEnabled
    ? await Promise.all(
        (members ?? []).map(async (m) => {
          const [idPhotoUrl, photoUrl, signatureUrl] = await Promise.all([
            m.id_photo_path ? getMemberIdPhotoSignedUrl(m.id_photo_path, 1800) : Promise.resolve(null),
            m.photo_path ? getMemberPhotoSignedUrl(m.photo_path, 1800) : Promise.resolve(null),
            m.signature_path ? getMemberSignatureSignedUrl(m.signature_path, 1800) : Promise.resolve(null),
          ]);
          return {
            id: m.id,
            member_code: m.member_code,
            full_name: m.full_name,
            first_name: m.first_name ?? null,
            last_name: m.last_name ?? null,
            date_of_birth: m.date_of_birth ?? null,
            residency_status:
              m.residency_status === "local" || m.residency_status === "tourist"
                ? m.residency_status
                : null,
            id_number: m.id_number ?? null,
            phone: m.phone ?? null,
            email: m.email ?? null,
            rfid_uid: m.rfid_uid ?? null,
            id_verified_at: m.id_verified_at ?? null,
            id_photo_url: idPhotoUrl,
            photo_url: photoUrl,
            signature_url: signatureUrl,
          };
        }),
      )
    : [];

  const locale = await getServerLocale();

  return (
    <>
      <StaffMemberCreator
        clubId={club.id}
        clubSlug={clubSlug}
        periods={periods ?? []}
        opsEnabled={opsEnabled}
      />

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
          {t(locale, "staff.allMembers", { count: members?.length ?? 0 })}
        </h2>
        <MembersSearch
          clubId={club.id}
          members={membersWithSigned}
          memberDetails={memberDetails}
          roles={roles ?? []}
          clubSlug={clubSlug}
          opsEnabled={opsEnabled}
          initialQuery={initialQuery ?? ""}
        />
      </div>
    </>
  );
}
