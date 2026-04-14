import { redirect } from "next/navigation";
import { getMemberFromCookie } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { EventsClient } from "./events-client";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

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

  const [{ data: events }, { data: rsvps }, { data: checkins }] = await Promise.all([
    supabase
      .from("events")
      .select(
        "id, title, description, title_es, description_es, date, time, end_time, price, image_url, link, reward_spins",
      )
      .eq("club_id", session.club_id)
      .eq("active", true)
      .order("date", { ascending: true }),
    supabase
      .from("event_rsvps")
      .select("event_id")
      .eq("member_id", session.member_id),
    supabase
      .from("event_checkins")
      .select("event_id")
      .eq("member_id", session.member_id),
  ]);

  const locale = await getServerLocale();
  const rsvpSet = new Set((rsvps ?? []).map((r) => r.event_id));
  const checkinSet = new Set((checkins ?? []).map((c) => c.event_id));

  const eventList = (events ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    title_es: e.title_es,
    description_es: e.description_es,
    date: e.date,
    time: e.time,
    end_time: e.end_time ?? null,
    price: e.price != null ? Number(e.price) : null,
    image_url: e.image_url,
    link: e.link,
    reward_spins: e.reward_spins,
    hasRsvp: rsvpSet.has(e.id),
    checkedIn: checkinSet.has(e.id),
  }));

  return (
    <div className="min-h-screen" style={{ background: "var(--m-surface-sunken)" }}>
      <header
        className="border-b px-5 pt-12 pb-5"
        style={{
          background: "var(--m-surface)",
          borderColor: "var(--m-border)",
          paddingTop: "calc(env(safe-area-inset-top) + 2.5rem)",
        }}
      >
        <p className="m-caption">{t(locale, "events.upcoming")}</p>
        <h1 className="m-display mt-1 text-[color:var(--m-ink)]">
          {t(locale, "events.title")}
        </h1>
      </header>

      <div className="mx-auto max-w-md px-5 pb-10 pt-5">
        <EventsClient events={eventList} memberId={session.member_id} clubSlug={clubSlug} />
      </div>
    </div>
  );
}
