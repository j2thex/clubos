import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { PeopleManager } from "../people-manager";
import { SetupChecklist } from "./setup-checklist";
import type { ReferrerSummary, MemberOption } from "../referral-tree";
import type { MemberDetailRecord } from "@/components/club/member-detail";
import {
  getMemberIdPhotoSignedUrl,
  getMemberPhotoSignedUrl,
  getMemberSignatureSignedUrl,
} from "@/lib/supabase/storage";

export default async function PeoplePage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { clubSlug } = await params;
  const { q: rawOpenCode } = await searchParams;
  const initialOpenMemberCode = rawOpenCode?.trim().toUpperCase() || null;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, currency_mode")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();
  const currencyMode = (club.currency_mode as "saldo" | "cash") ?? "cash";

  const [
    { data: roles },
    { data: members },
    { data: staff },
    { data: referralSources },
    { data: referralCompletions },
    { data: directReferrals },
    { data: allMembers },
  ] = await Promise.all([
    supabase
      .from("member_roles")
      .select("id, name, display_order")
      .eq("club_id", club.id)
      .order("display_order", { ascending: true }),
    supabase
      .from("members")
      .select(
        "id, member_code, full_name, first_name, last_name, date_of_birth, residency_status, id_number, phone, email, marketing_channel, spin_balance, is_staff, status, rfid_uid, id_verified_at, id_photo_path, photo_path, signature_path, staff_note, member_roles(name)"
      )
      .eq("club_id", club.id)
      .eq("is_staff", false)
      .eq("is_system_member", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("members")
      .select(
        "id, member_code, full_name, spin_balance, is_staff, status, can_do_entry, can_do_sell, can_do_topup, can_do_transactions, can_do_qebo, member_roles(name)"
      )
      .eq("club_id", club.id)
      .eq("is_staff", true)
      .eq("is_system_member", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("members")
      .select(
        "id, member_code, full_name, spin_balance, is_staff, status, member_roles(name)"
      )
      .eq("club_id", club.id)
      .eq("is_system_member", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("member_quests")
      .select("member_id, referral_member_code, completed_at, quests!inner(quest_type, club_id)")
      .eq("quests.quest_type", "referral")
      .eq("quests.club_id", club.id)
      .eq("status", "verified")
      .not("referral_member_code", "is", null)
      .order("completed_at", { ascending: false }),
    supabase
      .from("members")
      .select("member_code, full_name, referred_by, created_at")
      .eq("club_id", club.id)
      .not("referred_by", "is", null),
    supabase
      .from("members")
      .select("id, member_code, full_name, is_premium_referrer, referral_reward_spins")
      .eq("club_id", club.id)
      .eq("status", "active"),
  ]);

  void roles;

  function extractRoleName(m: { member_roles: unknown }) {
    return Array.isArray(m.member_roles)
      ? m.member_roles[0]?.name ?? null
      : (m.member_roles as { name: string } | null)?.name ?? null;
  }

  const memberList = (members ?? []).map((m) => ({
    id: m.id,
    member_code: m.member_code,
    full_name: m.full_name,
    spin_balance: m.spin_balance,
    is_staff: m.is_staff,
    status: m.status,
    roleName: extractRoleName(m),
  }));

  // Build MemberDetail records (signed URLs generated server-side, 1 hour expiry).
  const memberDetails: MemberDetailRecord[] = await Promise.all(
    (members ?? []).map(async (m) => {
      const [idPhotoUrl, photoUrl, signatureUrl] = await Promise.all([
        m.id_photo_path ? getMemberIdPhotoSignedUrl(m.id_photo_path) : Promise.resolve(null),
        m.photo_path ? getMemberPhotoSignedUrl(m.photo_path) : Promise.resolve(null),
        m.signature_path ? getMemberSignatureSignedUrl(m.signature_path) : Promise.resolve(null),
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
        marketing_channel: m.marketing_channel ?? null,
        rfid_uid: m.rfid_uid ?? null,
        id_verified_at: m.id_verified_at ?? null,
        id_photo_url: idPhotoUrl,
        photo_url: photoUrl,
        signature_url: signatureUrl,
        staff_note: m.staff_note ?? null,
      };
    }),
  );

  const staffList = (staff ?? []).map((s) => ({
    id: s.id,
    member_code: s.member_code,
    full_name: s.full_name,
    spin_balance: s.spin_balance,
    is_staff: s.is_staff,
    status: s.status,
    roleName: extractRoleName(s),
    canDoEntry: s.can_do_entry ?? true,
    canDoSell: s.can_do_sell ?? true,
    canDoTopup: s.can_do_topup ?? true,
    canDoTransactions: s.can_do_transactions ?? true,
    canDoQebo: s.can_do_qebo ?? true,
  }));

  const referralList = (referralSources ?? []).map((r) => ({
    id: r.id,
    member_code: r.member_code,
    full_name: r.full_name,
    spin_balance: r.spin_balance,
    is_staff: r.is_staff,
    status: r.status,
    roleName: extractRoleName(r),
  }));

  // Build referral tree
  const memberByCode = new Map((allMembers ?? []).map((m) => [m.member_code, m]));
  const memberById = new Map((allMembers ?? []).map((m) => [m.id, m]));

  const referrerGroups = new Map<string, ReferrerSummary>();
  const seenPairs = new Set<string>();

  function getGroup(code: string): ReferrerSummary {
    if (!referrerGroups.has(code)) {
      const member = memberByCode.get(code);
      referrerGroups.set(code, {
        code,
        name: member?.full_name ?? null,
        memberId: member?.id ?? "",
        isPremiumReferrer: member?.is_premium_referrer ?? false,
        referralRewardSpins: member?.referral_reward_spins ?? 0,
        referrals: [],
      });
    }
    return referrerGroups.get(code)!;
  }

  for (const member of directReferrals ?? []) {
    const referrerCode = member.referred_by!;
    const pairKey = `${referrerCode}->${member.member_code}`;
    if (seenPairs.has(pairKey)) continue;
    seenPairs.add(pairKey);
    getGroup(referrerCode).referrals.push({
      code: member.member_code,
      name: member.full_name,
      date: member.created_at,
    });
  }

  for (const completion of referralCompletions ?? []) {
    const referrer = memberById.get(completion.member_id);
    if (!referrer) continue;
    const referredCode = completion.referral_member_code!;
    const pairKey = `${referrer.member_code}->${referredCode}`;
    if (seenPairs.has(pairKey)) continue;
    seenPairs.add(pairKey);
    const referredMember = memberByCode.get(referredCode);
    getGroup(referrer.member_code).referrals.push({
      code: referredCode,
      name: referredMember?.full_name ?? null,
      date: completion.completed_at,
    });
  }

  for (const member of allMembers ?? []) {
    if (member.is_premium_referrer && !referrerGroups.has(member.member_code)) {
      getGroup(member.member_code);
    }
  }

  const referrers: ReferrerSummary[] = [...referrerGroups.values()].sort((a, b) => {
    if (a.isPremiumReferrer !== b.isPremiumReferrer) return a.isPremiumReferrer ? -1 : 1;
    return b.referrals.length - a.referrals.length;
  });

  const memberOptions: MemberOption[] = (allMembers ?? [])
    .filter((m) => !referrerGroups.has(m.member_code))
    .map((m) => ({ id: m.id, code: m.member_code, name: m.full_name }));

  const knownMarketingChannels = Array.from(
    new Set(
      (members ?? [])
        .map((m) => m.marketing_channel)
        .filter((c): c is string => typeof c === "string" && c.length > 0),
    ),
  ).sort();

  return (
    <>
      <SetupChecklist clubId={club.id} clubSlug={clubSlug} />
      <div id="members">
      <PeopleManager
        clubId={club.id}
        clubSlug={clubSlug}
        currencyMode={currencyMode}
        members={memberList}
        memberDetails={memberDetails}
        staff={staffList}
        referralSources={referralList}
        referralTree={referrers}
        referralMemberOptions={memberOptions}
        knownMarketingChannels={knownMarketingChannels}
        initialOpenMemberCode={initialOpenMemberCode}
      />
      </div>
    </>
  );
}
