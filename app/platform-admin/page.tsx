import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PlatformAdminClient } from "./client";

export default async function PlatformAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ secret?: string }>;
}) {
  const { secret } = await searchParams;

  if (!secret || secret !== process.env.PLATFORM_ADMIN_SECRET) {
    redirect("/");
  }

  const supabase = createAdminClient();

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
  const weekFromNow = new Date(now.getTime() + 7 * 86400000).toISOString().split("T")[0];

  // Parallel queries for all dashboard data
  const [
    { count: totalClubs },
    { count: totalMembers },
    { count: totalSpins },
    { count: totalQuestCompletions },
    { count: totalEvents },
    { count: pendingInvites },
    { count: pendingQuests },
    { data: allClubs },
    { data: recentActivity },
    { data: unapprovedOffers },
    { count: membersToday },
    { count: membersThisWeek },
    { count: membersThisMonth },
    { count: spinsToday },
    { count: spinsThisWeek },
    { count: spinsThisMonth },
    { count: expiringMembers },
    { count: clubsThisWeek },
    { count: clubsThisMonth },
    { data: pendingInviteList },
    { data: membersByClub },
    { data: spinsByClub },
    { data: questsByClub },
    { data: eventsByClub },
    { data: offersByClub },
  ] = await Promise.all([
    supabase.from("clubs").select("*", { count: "exact", head: true }),
    supabase.from("members").select("*", { count: "exact", head: true }),
    supabase.from("spins").select("*", { count: "exact", head: true }),
    supabase.from("member_quests").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }).eq("active", true),
    supabase.from("invite_requests").select("*", { count: "exact", head: true }),
    supabase.from("member_quests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    // All clubs with branding
    supabase
      .from("clubs")
      .select("id, name, slug, active, approved, visibility, requested_visibility, claimed, invite_only, created_at, club_branding(logo_url, primary_color), club_owner_clubs(club_owners(email))")
      .order("created_at", { ascending: false }),
    // Recent activity
    supabase
      .from("activity_log")
      .select("id, club_id, action, target_member_code, details, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    // Unapproved custom offers
    supabase
      .from("offer_catalog")
      .select("id, name, subtype, created_at, created_by_club_id")
      .eq("is_approved", false)
      .order("created_at", { ascending: false }),
    // Growth: members
    supabase.from("members").select("*", { count: "exact", head: true }).gte("created_at", todayStr),
    supabase.from("members").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    supabase.from("members").select("*", { count: "exact", head: true }).gte("created_at", monthAgo),
    // Growth: spins
    supabase.from("spins").select("*", { count: "exact", head: true }).gte("created_at", todayStr),
    supabase.from("spins").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    supabase.from("spins").select("*", { count: "exact", head: true }).gte("created_at", monthAgo),
    // Expiring members
    supabase.from("members").select("*", { count: "exact", head: true })
      .eq("status", "active").not("valid_till", "is", null)
      .lte("valid_till", weekFromNow).gte("valid_till", todayStr),
    // Growth: clubs
    supabase.from("clubs").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    supabase.from("clubs").select("*", { count: "exact", head: true }).gte("created_at", monthAgo),
    // Pending invite requests (recent 10)
    supabase.from("invite_requests").select("id, club_id, name, contact, created_at").order("created_at", { ascending: false }).limit(10),
    // Per-club member counts
    supabase.from("members").select("club_id"),
    supabase.from("spins").select("club_id"),
    supabase.from("member_quests").select("quests(club_id)"),
    supabase.from("events").select("club_id").eq("active", true),
    supabase.from("club_offers").select("club_id"),
  ]);

  // Build per-club metrics
  const clubMemberCounts = new Map<string, number>();
  for (const m of membersByClub ?? []) {
    clubMemberCounts.set(m.club_id, (clubMemberCounts.get(m.club_id) ?? 0) + 1);
  }

  const clubSpinCounts = new Map<string, number>();
  for (const s of spinsByClub ?? []) {
    clubSpinCounts.set(s.club_id, (clubSpinCounts.get(s.club_id) ?? 0) + 1);
  }

  const clubEventCounts = new Map<string, number>();
  for (const e of eventsByClub ?? []) {
    clubEventCounts.set(e.club_id, (clubEventCounts.get(e.club_id) ?? 0) + 1);
  }

  const clubOfferCounts = new Map<string, number>();
  for (const o of offersByClub ?? []) {
    clubOfferCounts.set(o.club_id, (clubOfferCounts.get(o.club_id) ?? 0) + 1);
  }

  // Map club names for activity feed
  const clubNameMap = new Map<string, string>();
  for (const c of allClubs ?? []) {
    clubNameMap.set(c.id, c.name);
  }

  const clubList = (allClubs ?? []).map((c) => {
    const branding = Array.isArray(c.club_branding) ? c.club_branding[0] : c.club_branding;
    // Extract owner email from nested join: club_owner_clubs -> club_owners
    let ownerEmail: string | null = null;
    const ownerClubs = c.club_owner_clubs;
    if (ownerClubs) {
      const entries = Array.isArray(ownerClubs) ? ownerClubs : [ownerClubs];
      for (const entry of entries) {
        const owner = entry.club_owners;
        if (owner) {
          const ownerObj = Array.isArray(owner) ? owner[0] : owner;
          if (ownerObj?.email) {
            ownerEmail = ownerObj.email;
            break;
          }
        }
      }
    }
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      approved: c.approved ?? true,
      visibility: (c.visibility ?? "public") as "public" | "unlisted" | "private",
      requestedVisibility: (c.requested_visibility ?? "public") as "public" | "unlisted" | "private",
      claimed: c.claimed,
      inviteOnly: c.invite_only,
      logoUrl: branding?.logo_url ?? null,
      primaryColor: branding?.primary_color ?? "#6b7280",
      createdAt: c.created_at,
      members: clubMemberCounts.get(c.id) ?? 0,
      spins: clubSpinCounts.get(c.id) ?? 0,
      events: clubEventCounts.get(c.id) ?? 0,
      offers: clubOfferCounts.get(c.id) ?? 0,
      ownerEmail,
    };
  });

  const activityFeed = (recentActivity ?? []).map((a) => ({
    id: a.id,
    clubName: clubNameMap.get(a.club_id) ?? "Unknown",
    action: a.action,
    target: a.target_member_code,
    details: a.details,
    createdAt: a.created_at,
  }));

  const inviteList = (pendingInviteList ?? []).map((r) => ({
    id: r.id,
    clubName: clubNameMap.get(r.club_id) ?? "Unknown",
    name: r.name,
    contact: r.contact,
    createdAt: r.created_at,
  }));

  return (
    <PlatformAdminClient
      secret={secret}
      stats={{
        totalClubs: totalClubs ?? 0,
        totalMembers: totalMembers ?? 0,
        totalSpins: totalSpins ?? 0,
        totalQuestCompletions: totalQuestCompletions ?? 0,
        totalEvents: totalEvents ?? 0,
        pendingInvites: pendingInvites ?? 0,
        pendingQuests: pendingQuests ?? 0,
        expiringMembers: expiringMembers ?? 0,
      }}
      growth={{
        membersToday: membersToday ?? 0,
        membersThisWeek: membersThisWeek ?? 0,
        membersThisMonth: membersThisMonth ?? 0,
        membersAllTime: totalMembers ?? 0,
        spinsToday: spinsToday ?? 0,
        spinsThisWeek: spinsThisWeek ?? 0,
        spinsThisMonth: spinsThisMonth ?? 0,
        spinsAllTime: totalSpins ?? 0,
        clubsThisWeek: clubsThisWeek ?? 0,
        clubsThisMonth: clubsThisMonth ?? 0,
        clubsAllTime: totalClubs ?? 0,
      }}
      clubs={clubList}
      activityFeed={activityFeed}
      inviteRequests={inviteList}
      unapprovedOffers={(unapprovedOffers ?? []).map((o) => ({
        id: o.id,
        name: o.name,
        subtype: o.subtype,
        clubName: clubNameMap.get(o.created_by_club_id ?? "") ?? "Unknown",
        createdAt: o.created_at,
      }))}
    />
  );
}
