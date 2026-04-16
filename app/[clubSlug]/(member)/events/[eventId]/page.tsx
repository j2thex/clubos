import { redirect, notFound } from "next/navigation";
import { getMemberFromCookie } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { EventDetailClient } from "./event-detail-client";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ clubSlug: string; eventId: string }>;
}) {
  const { clubSlug, eventId } = await params;
  const session = await getMemberFromCookie();

  if (!session) {
    redirect(`/${clubSlug}/login`);
  }

  const supabase = createAdminClient();

  const [{ data: event }, { data: rsvp }, { data: checkin }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, description, date, time, end_time, price, image_url, link, reward_spins")
      .eq("id", eventId)
      .eq("club_id", session.club_id)
      .eq("active", true)
      .single(),
    supabase
      .from("event_rsvps")
      .select("id")
      .eq("event_id", eventId)
      .eq("member_id", session.member_id)
      .maybeSingle(),
    supabase
      .from("event_checkins")
      .select("id")
      .eq("event_id", eventId)
      .eq("member_id", session.member_id)
      .maybeSingle(),
  ]);

  if (!event) notFound();

  return (
    <div className="min-h-screen club-page-bg">
      {event.image_url ? (
        <div className="relative">
          <img
            src={event.image_url}
            alt=""
            className="w-full h-52 object-cover"
          />
          <a
            href={`/${clubSlug}/events`}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </a>
        </div>
      ) : (
        <div className="club-hero px-6 pt-10 pb-12">
          <a
            href={`/${clubSlug}/events`}
            className="inline-flex items-center gap-1 text-white/70 text-sm mb-3 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Events
          </a>
          <h1 className="text-2xl font-bold text-white">{event.title}</h1>
        </div>
      )}

      <div className={`px-4 pb-10 max-w-md mx-auto ${event.image_url ? "mt-4" : "-mt-6"}`}>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-5 space-y-4">
            {event.image_url && (
              <h1 className="text-xl font-bold text-gray-900">{event.title}</h1>
            )}

            {/* Date & Time */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full club-tint-bg flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 club-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(event.date + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                {event.time && (
                  <p className="text-xs text-gray-500">
                    {(() => {
                      const fmt = (t: string) => {
                        const [h, m] = t.split(":");
                        const hour = parseInt(h);
                        const ampm = hour >= 12 ? "PM" : "AM";
                        const h12 = hour % 12 || 12;
                        return `${h12}:${m} ${ampm}`;
                      };
                      return `${fmt(event.time)}${event.end_time ? ` – ${fmt(event.end_time)}` : ""}`;
                    })()}
                  </p>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {event.price != null ? `$${Number(event.price).toFixed(2)}` : "Free"}
              </p>
            </div>

            {/* Reward spins */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full club-tint-bg flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 club-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </div>
              <p className="text-sm text-gray-900">
                <span className="font-semibold">+{event.reward_spins}</span>{" "}
                spin{event.reward_spins === 1 ? "" : "s"} for attending
              </p>
            </div>

            {/* Description */}
            {event.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{event.description}</p>
            )}

            {/* External link */}
            {event.link && (
              <a
                href={event.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium club-primary underline"
              >
                More info
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            )}
          </div>

          {/* RSVP button */}
          <div className="px-5 pb-5">
            <EventDetailClient
              eventId={event.id}
              memberId={session.member_id}
              hasRsvp={!!rsvp}
              checkedIn={!!checkin}
              eventDate={event.date}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
