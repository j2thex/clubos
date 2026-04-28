import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { EventManager } from "../../../event-manager";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, spin_display_decimals")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  const [{ data: events }, { data: eventRsvps }, { data: eventCheckins }] =
    await Promise.all([
      supabase
        .from("events")
        .select(
          "id, title, description, date, time, end_time, price, image_url, icon, link, reward_spins, is_public, title_es, description_es, recurrence_rule, recurrence_parent_id, recurrence_end_date, location_name, latitude, longitude"
        )
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
    ]);

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
    end_time: e.end_time ?? null,
    price: e.price != null ? Number(e.price) : null,
    image_url: e.image_url,
    icon: e.icon ?? null,
    link: e.link,
    reward_spins: e.reward_spins,
    rsvps: rsvpCounts.get(e.id) ?? 0,
    checkins: checkinCounts.get(e.id) ?? 0,
    is_public: e.is_public ?? false,
    title_es: e.title_es ?? null,
    description_es: e.description_es ?? null,
    recurrence_rule: e.recurrence_rule ?? null,
    recurrence_parent_id: e.recurrence_parent_id ?? null,
    recurrence_end_date: e.recurrence_end_date ?? null,
    location_name: e.location_name ?? null,
    latitude: e.latitude != null ? Number(e.latitude) : null,
    longitude: e.longitude != null ? Number(e.longitude) : null,
  }));

  return (
    <EventManager events={eventList} clubId={club.id} clubSlug={clubSlug} spinDisplayDecimals={club.spin_display_decimals ?? 0} />
  );
}
