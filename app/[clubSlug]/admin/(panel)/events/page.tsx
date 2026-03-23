import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EventManager } from "../../event-manager";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();
  const locale = await getServerLocale();

  const [{ data: events }, { data: eventRsvps }, { data: eventCheckins }] =
    await Promise.all([
      supabase
        .from("events")
        .select(
          "id, title, description, date, time, price, image_url, icon, link, reward_spins, is_public, title_es, description_es, recurrence_rule, recurrence_parent_id, recurrence_end_date"
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
  }));

  return (
    <div className="space-y-4">
      <Link
        href={`/${clubSlug}/admin/content`}
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {t(locale, "admin.backToContent")}
      </Link>
      <EventManager events={eventList} clubId={club.id} clubSlug={clubSlug} />
    </div>
  );
}
