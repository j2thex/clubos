import { redirect } from "next/navigation";
import { getMemberFromCookie } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { EventsClient } from "./events-client";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const session = await getMemberFromCookie();

  if (!session) {
    redirect(`/${clubSlug}/login`);
  }

  const supabase = createAdminClient();

  const [{ data: events }, { data: rsvps }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, description, date, time, price, image_url, link, reward_spins")
      .eq("club_id", session.club_id)
      .eq("active", true)
      .order("date", { ascending: true }),
    supabase
      .from("event_rsvps")
      .select("event_id")
      .eq("member_id", session.member_id),
  ]);

  const rsvpSet = new Set((rsvps ?? []).map((r) => r.event_id));

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
    hasRsvp: rsvpSet.has(e.id),
  }));

  return (
    <div className="min-h-screen club-page-bg">
      <div className="club-hero px-6 pt-10 pb-12 text-center">
        <h1 className="text-2xl font-bold text-white">Events</h1>
        <p className="mt-1 club-light-text text-sm">Upcoming club events</p>
      </div>

      <div className="px-4 -mt-6 pb-10 max-w-md mx-auto">
        <EventsClient
          events={eventList}
          memberId={session.member_id}
          clubSlug={clubSlug}
        />
      </div>
    </div>
  );
}
