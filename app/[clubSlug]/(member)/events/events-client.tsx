"use client";

import { useState, useTransition, useMemo } from "react";
import { rsvpEvent, cancelRsvp } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";
import { getDateLocale, localized } from "@/lib/i18n";

interface Event {
  id: string;
  title: string;
  description: string | null;
  title_es: string | null;
  description_es: string | null;
  date: string;
  time: string | null;
  price: number | null;
  image_url: string | null;
  link: string | null;
  reward_spins: number;
  hasRsvp: boolean;
  checkedIn: boolean;
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
  const { t, locale } = useLanguage();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [rsvpState, setRsvpState] = useState<Record<string, boolean>>(
    Object.fromEntries(events.map((e) => [e.id, e.hasRsvp])),
  );
  const [isPending, startTransition] = useTransition();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Client-side date split using browser timezone
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const upcomingEvents = useMemo(() => events.filter((e) => e.date >= todayStr), [events, todayStr]);
  const pastEvents = useMemo(() => events.filter((e) => e.date < todayStr).reverse(), [events, todayStr]);

  const checkedInSet = useMemo(() => new Set(events.filter((e) => e.checkedIn).map((e) => e.id)), [events]);

  function handleRsvp(eventId: string) {
    if (checkedInSet.has(eventId)) return;
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
    return new Date(d + "T00:00:00").toLocaleDateString(getDateLocale(locale), {
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
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  const eventDates = new Set(events.map((e) => e.date));
  const upcomingEventDates = new Set(upcomingEvents.map((e) => e.date));

  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfWeek(year: number, month: number) {
    return new Date(year, month, 1).getDay();
  }

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfWeek(calYear, calMonth);
  const monthName = new Date(calYear, calMonth).toLocaleDateString(getDateLocale(locale), { month: "long", year: "numeric" });

  function prevMonth() {
    setSelectedDate(null);
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  }

  function nextMonth() {
    setSelectedDate(null);
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  }

  function getInitialSelectedDate() {
    const upcoming = upcomingEvents[0];
    return upcoming?.date ?? null;
  }

  function renderRsvpButton(ev: Event) {
    if (checkedInSet.has(ev.id)) {
      return (
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
          {t("events.checkedIn")}
        </span>
      );
    }
    return (
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
        {rsvpState[ev.id] ? t("events.signedUp") : t("events.signUp")}
      </button>
    );
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
          {t("events.viewList")}
        </button>
        <button
          onClick={() => {
            setView("calendar");
            setSelectedDate(getInitialSelectedDate());
          }}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            view === "calendar"
              ? "bg-white text-gray-900 shadow"
              : "text-white/70 hover:text-white"
          }`}
        >
          {t("events.viewCalendar")}
        </button>
      </div>

      {view === "list" ? (
        <div className="space-y-3">
          {upcomingEvents.length === 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
              <p className="text-gray-700 font-semibold text-lg">{t("events.noUpcoming")}</p>
              <p className="text-gray-400 text-sm mt-1">{t("events.checkBackSoon")}</p>
            </div>
          )}
          {upcomingEvents.map((ev) => (
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
                    <p className="font-semibold text-gray-900">{localized(ev.title, ev.title_es, locale)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(ev.date)}
                      {ev.time && ` at ${formatTime(ev.time)}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {ev.price != null ? (
                      <span className="text-sm font-bold text-gray-900">${Number(ev.price).toFixed(2)}</span>
                    ) : (
                      <span className="text-sm font-bold text-green-600">{t("common.free")}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs club-tint-text font-medium px-2 py-0.5 club-tint-bg rounded-full">
                    +{ev.reward_spins} {ev.reward_spins === 1 ? t("common.spin") : t("common.spins")}
                  </span>
                  {renderRsvpButton(ev)}
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
              const isSelected = dateStr === selectedDate;
              const isToday =
                day === today.getDate() &&
                calMonth === today.getMonth() &&
                calYear === today.getFullYear();

              return (
                <div
                  key={day}
                  onClick={hasEvent ? () => setSelectedDate(isSelected ? null : dateStr) : undefined}
                  className={`relative h-9 flex items-center justify-center rounded-lg text-sm transition-colors ${
                    isSelected
                      ? "club-primary-bg text-white font-semibold"
                      : isToday
                        ? "font-bold text-gray-900 bg-gray-100"
                        : "text-gray-700"
                  } ${hasEvent ? "cursor-pointer" : ""}`}
                >
                  {day}
                  {hasEvent && (
                    <span
                      className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                        isSelected
                          ? "bg-white"
                          : upcomingEventDates.has(dateStr)
                            ? "club-primary-bg"
                            : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Event panel for selected date */}
          {selectedDate && (() => {
            const dayEvents = events.filter((e) => e.date === selectedDate);
            const isPastDate = !upcomingEventDates.has(selectedDate);
            if (dayEvents.length === 0) return null;
            return (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                <p className="text-xs font-medium text-gray-400 px-1">
                  {formatDate(selectedDate)}
                  {isPastDate && <span className="ml-1 text-gray-300">&middot; {t("events.past")}</span>}
                </p>
                {dayEvents.map((ev) => (
                  <a
                    key={ev.id}
                    href={`/${clubSlug}/events/${ev.id}`}
                    className={`block rounded-xl bg-gray-50 p-3 hover:bg-gray-100 transition-colors ${isPastDate ? "opacity-70" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      {ev.image_url && (
                        <img
                          src={ev.image_url}
                          alt=""
                          className={`w-12 h-12 rounded-lg object-cover shrink-0 ${isPastDate ? "grayscale-[30%]" : ""}`}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm truncate ${isPastDate ? "text-gray-600" : "text-gray-900"}`}>
                          {localized(ev.title, ev.title_es, locale)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {ev.time ? formatTime(ev.time) : t("events.allDay")}
                          {ev.price != null
                            ? ` · $${Number(ev.price).toFixed(2)}`
                            : ` · ${t("common.free")}`}
                        </p>
                      </div>
                      {!isPastDate && (
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          <span className="text-xs club-tint-text font-medium px-2 py-0.5 club-tint-bg rounded-full">
                            +{ev.reward_spins}
                          </span>
                          {renderRsvpButton(ev)}
                        </div>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
