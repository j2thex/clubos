import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { RoleManager } from "./role-manager";
import { PeopleManager } from "./people-manager";
import { WheelManager } from "./wheel-manager";
import { QuestManager } from "./quest-manager";
import { EventManager } from "./event-manager";
import { ServiceManager } from "./service-manager";
import { LogoutButton } from "./logout-button";

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
    title: club ? `Admin | ${club.name}` : "Club Admin",
    icons: { icon: "/favicon-admin.svg" },
  };
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  const [{ data: roles }, { data: members }, { data: staff }, { data: segments }, { data: quests }, { data: questCompletions }, { data: events }, { data: eventRsvps }, { data: eventCheckins }, { data: services }] = await Promise.all([
    supabase
      .from("member_roles")
      .select("id, name, display_order")
      .eq("club_id", club.id)
      .order("display_order", { ascending: true }),
    supabase
      .from("members")
      .select("id, member_code, full_name, spin_balance, is_staff, status, member_roles(name)")
      .eq("club_id", club.id)
      .eq("is_staff", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("members")
      .select("id, member_code, full_name, spin_balance, is_staff, status, member_roles(name)")
      .eq("club_id", club.id)
      .eq("is_staff", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("wheel_configs")
      .select("id, label, color, label_color, probability, display_order, active")
      .eq("club_id", club.id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("quests")
      .select("id, title, description, link, image_url, reward_spins, display_order, active, multi_use")
      .eq("club_id", club.id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("member_quests")
      .select("quest_id, quests!inner(club_id)")
      .eq("quests.club_id", club.id),
    supabase
      .from("events")
      .select("id, title, description, date, time, price, image_url, link, reward_spins")
      .eq("club_id", club.id)
      .eq("active", true)
      .order("date", { ascending: true }),
    supabase
      .from("event_rsvps")
      .select("event_id, events!inner(club_id)")
      .eq("events.club_id", club.id),
    supabase
      .from("event_checkins")
      .select("event_id, events!inner(club_id)")
      .eq("events.club_id", club.id),
    supabase
      .from("services")
      .select("id, title, description, image_url, link, price, display_order")
      .eq("club_id", club.id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
  ]);

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

  const staffList = (staff ?? []).map((s) => ({
    id: s.id,
    member_code: s.member_code,
    full_name: s.full_name,
    spin_balance: s.spin_balance,
    is_staff: s.is_staff,
    status: s.status,
    roleName: extractRoleName(s),
  }));

  // Count completions per quest
  const completionCounts = new Map<string, number>();
  for (const c of questCompletions ?? []) {
    completionCounts.set(c.quest_id, (completionCounts.get(c.quest_id) ?? 0) + 1);
  }

  const questList = (quests ?? []).map((q) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    link: q.link,
    image_url: q.image_url,
    reward_spins: q.reward_spins,
    display_order: q.display_order,
    completions: completionCounts.get(q.id) ?? 0,
    multi_use: q.multi_use ?? false,
  }));

  // Count RSVPs and checkins per event
  const rsvpCounts = new Map<string, number>();
  for (const r of eventRsvps ?? []) {
    rsvpCounts.set(r.event_id, (rsvpCounts.get(r.event_id) ?? 0) + 1);
  }
  const checkinCounts = new Map<string, number>();
  for (const c of eventCheckins ?? []) {
    checkinCounts.set(c.event_id, (checkinCounts.get(c.event_id) ?? 0) + 1);
  }

  const eventList = (events ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    date: e.date,
    time: e.time,
    price: e.price != null ? Number(e.price) : null,
    image_url: e.image_url,
    link: e.link,
    reward_spins: e.reward_spins,
    rsvps: rsvpCounts.get(e.id) ?? 0,
    checkins: checkinCounts.get(e.id) ?? 0,
  }));

  const serviceList = (services ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    image_url: s.image_url,
    link: s.link,
    price: s.price != null ? Number(s.price) : null,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 px-6 pt-10 pb-12">
        <div className="flex items-start justify-between max-w-2xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-white">Club Admin</h1>
            <p className="mt-1 text-gray-400 text-sm">{club.name}</p>
          </div>
          <LogoutButton clubSlug={clubSlug} />
        </div>
        <div className="flex gap-3 mt-4 max-w-2xl mx-auto">
          <a
            href={`/${clubSlug}/staff`}
            className="text-xs text-gray-400 hover:text-white border border-gray-600 rounded-lg px-3 py-1.5 transition-colors"
          >
            View Staff Page
          </a>
          <a
            href={`/${clubSlug}`}
            className="text-xs text-gray-400 hover:text-white border border-gray-600 rounded-lg px-3 py-1.5 transition-colors"
          >
            View Member Page
          </a>
        </div>
      </div>

      <div className="px-4 -mt-6 pb-10 max-w-2xl mx-auto space-y-6">
        <PeopleManager
          clubId={club.id}
          clubSlug={clubSlug}
          members={memberList}
          staff={staffList}
        />
        <EventManager
          events={eventList}
          clubId={club.id}
          clubSlug={clubSlug}
        />
        <QuestManager
          quests={questList}
          clubId={club.id}
          clubSlug={clubSlug}
        />
        <ServiceManager
          services={serviceList}
          clubId={club.id}
          clubSlug={clubSlug}
        />
        <WheelManager
          segments={(segments ?? []).map((s) => ({
            id: s.id,
            label: s.label,
            color: s.color ?? "#16a34a",
            label_color: s.label_color ?? "#ffffff",
            probability: Number(s.probability),
            display_order: s.display_order,
          }))}
          clubId={club.id}
          clubSlug={clubSlug}
        />
        <RoleManager
          roles={roles ?? []}
          clubId={club.id}
          clubSlug={clubSlug}
        />
      </div>
    </div>
  );
}
