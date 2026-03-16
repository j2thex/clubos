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

  const [{ data: events }, { data: rsvps }, { data: checkins }, { data: branding }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, description, title_es, description_es, date, time, price, image_url, link, reward_spins")
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
    supabase
      .from("club_branding")
      .select("logo_url")
      .eq("club_id", session.club_id)
      .single(),
  ]);

  const logoUrl = branding?.logo_url ?? null;
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
    price: e.price != null ? Number(e.price) : null,
    image_url: e.image_url,
    link: e.link,
    reward_spins: e.reward_spins,
    hasRsvp: rsvpSet.has(e.id),
    checkedIn: checkinSet.has(e.id),
  }));

  return (
    <div className="min-h-screen club-page-bg">
      <div className="club-hero px-6 pt-10 pb-12 text-center">
        {logoUrl && (
          <img src={logoUrl} alt="Club logo" className="w-10 h-10 rounded-lg object-cover mx-auto mb-2 shadow ring-2 ring-white/20" />
        )}
        <h1 className="text-2xl font-bold text-white">{t(locale, "events.title")}</h1>
        <p className="mt-1 club-light-text text-sm">{t(locale, "events.subtitle")}</p>
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
