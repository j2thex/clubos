import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { StaffNav } from "@/components/club/staff-nav";
import { PendingApproval } from "@/components/pending-approval";
import { getOwnerFromCookie, getStaffFromCookie } from "@/lib/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}): Promise<Metadata> {
  const { clubSlug } = await params;
  const supabase = createAdminClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("name")
    .eq("slug", clubSlug)
    .single();

  return {
    title: club ? `Staff | ${club.name}` : "Staff Console",
    icons: {
      icon: "/favicon-staff.svg",
      apple: [{ url: `/${clubSlug}/icon.png`, sizes: "180x180" }],
    },
  };
}

export default async function StaffLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, approved, spin_enabled, operations_module_enabled")
    .eq("slug", clubSlug)
    .single();

  if (club && !club.approved) {
    return <PendingApproval clubName={club.name} clubSlug={clubSlug} />;
  }

  // Pending counts feed the red badge bubbles on the staff bottom nav.
  // Fail-soft: any query error just yields 0, the nav still renders.
  let pendingBadges: Record<string, number> = {};
  if (club?.id) {
    const [{ count: preregCount }, { count: offerCount }, { count: questCount }] =
      await Promise.all([
        supabase
          .from("preregistrations")
          .select("id", { count: "exact", head: true })
          .eq("club_id", club.id)
          .eq("status", "pending"),
        supabase
          .from("offer_orders")
          .select("id, club_offers!inner(club_id)", { count: "exact", head: true })
          .eq("club_offers.club_id", club.id)
          .eq("status", "pending"),
        supabase
          .from("member_quests")
          .select("id, quests!inner(club_id)", { count: "exact", head: true })
          .eq("quests.club_id", club.id)
          .eq("status", "pending"),
      ]);
    pendingBadges = {
      "/preregistrations": preregCount ?? 0,
      "/offers": offerCount ?? 0,
      "/quests": questCount ?? 0,
    };
  }

  // QEBO nav visibility: owners proxying the staff console always see
  // everything; logged-in staff are gated by their can_do_qebo flag.
  let qeboEnabled = true;
  const owner = await getOwnerFromCookie();
  if (!(owner && club?.id && owner.club_id === club.id)) {
    const staffSession = await getStaffFromCookie();
    if (staffSession?.member_id) {
      const { data: staffRow } = await supabase
        .from("members")
        .select("can_do_qebo")
        .eq("id", staffSession.member_id)
        .single();
      qeboEnabled = staffRow?.can_do_qebo ?? true;
    }
  }

  return (
    <div className="pb-20">
      {children}
      <StaffNav
        clubSlug={clubSlug}
        spinEnabled={club?.spin_enabled ?? false}
        operationsEnabled={club?.operations_module_enabled ?? false}
        qeboEnabled={qeboEnabled}
        badges={pendingBadges}
      />
    </div>
  );
}
