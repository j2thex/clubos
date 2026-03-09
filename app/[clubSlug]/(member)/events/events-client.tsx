"use client";

import { useState, useTransition } from "react";
import { rsvpEvent, cancelRsvp } from "./actions";

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  price: number | null;
  image_url: string | null;
  link: string | null;
  reward_spins: number;
  hasRsvp: boolean;
}

export function EventsClient({
  events,
  memberId,
  clubSlug,
}: {
  events: Event[];
  memberId: string;
  clubSlug: string;
}) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [rsvpState, setRsvpState] = useState<Record<string, boolean>>(
    Object.fromEntries(events.map((e) => [e.id, e.hasRsvp])),
  );
  const [isPending, startTransition] = useTransition();

  function handleRsvp(eventId: string) {
    startTransition(async () => {
      const hasIt = rsvpState[eventId];
      if (hasIt) {
        const res = await cancelRsvp(eventId, memberId);
        if (!("error" in res)) {
          setRsvpState((prev) => ({ ...prev, [eventId]: false }));
        }
      } else {
        const res = await rsvpEvent(eventId, memberId);
        if (!("error" in res)) {
          setRsvpState((prev) => ({ ...prev, [eventId]: true }));
        }
      }
    });
  }

  function formatDate(d: string) {
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  function formatTime(t: string) {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }

  // Calendar logic
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  const eventDates = new Set(events.map((e) => e.date));

  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfWeek(year: number, month: number) {
    return new Date(year, month, 1).getDay();
  }

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfWeek(calYear, calMonth);
  const monthName = new Date(calYear, calMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  function prevMonth() {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  }

  function nextMonth() {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  }

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setView("list")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            view === "list"
              ? "bg-white text-gray-900 shadow"
              : "text-white/70 hover:text-white"
          }`}
        >
          List
        </button>
        <button
          onClick={() => setView("calendar")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            view === "calendar"
              ? "bg-white text-gray-900 shadow"
              : "text-white/70 hover:text-white"
          }`}
        >
          Calendar
        </button>
      </div>

      {view === "list" ? (
        <div className="space-y-3">
          {events.length === 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
              <p className="text-gray-700 font-semibold text-lg">No events yet</p>
              <p className="text-gray-400 text-sm mt-1">Check back soon for upcoming club events.</p>
            </div>
          )}
          {events.map((ev) => (
            <a
              key={ev.id}
              href={`/${clubSlug}/events/${ev.id}`}
              className="block bg-white rounded-2xl shadow overflow-hidden"
            >
              {ev.image_url && (
                <img
                  src={ev.image_url}
                  alt=""
                  className="w-full h-36 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{ev.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(ev.date)}
                      {ev.time && ` at ${formatTime(ev.time)}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {ev.price != null ? (
                      <span className="text-sm font-bold text-gray-900">${Number(ev.price).toFixed(2)}</span>
                    ) : (
                      <span className="text-sm font-bold text-green-600">Free</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs club-tint-text font-medium px-2 py-0.5 club-tint-bg rounded-full">
                    +{ev.reward_spins} spin{ev.reward_spins === 1 ? "" : "s"}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleRsvp(ev.id);
                    }}
                    disabled={isPending}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                      rsvpState[ev.id]
                        ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        : "club-primary-bg text-white hover:opacity-90"
                    } disabled:opacity-50`}
                  >
                    {rsvpState[ev.id] ? "Signed Up" : "Sign Up"}
                  </button>
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-4">
          {/* Calendar header */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <p className="text-sm font-semibold text-gray-900">{monthName}</p>
            <button onClick={nextMonth} className="p-1 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <span key={d} className="text-xs font-medium text-gray-400">{d}</span>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const hasEvent = eventDates.has(dateStr);
              const isToday =
                day === today.getDate() &&
                calMonth === today.getMonth() &&
                calYear === today.getFullYear();

              return (
                <div
                  key={day}
                  className={`relative h-9 flex items-center justify-center rounded-lg text-sm ${
                    isToday ? "font-bold text-gray-900 bg-gray-100" : "text-gray-700"
                  }`}
                >
                  {day}
                  {hasEvent && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full club-primary-bg" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
