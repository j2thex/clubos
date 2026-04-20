"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
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
  end_time: string | null;
  price: number | null;
  image_url: string | null;
  link: string | null;
  reward_spins: number;
  hasRsvp: boolean;
  checkedIn: boolean;
}

type View = "list" | "calendar";

function groupByDate(events: Event[]): { date: string; items: Event[] }[] {
  const groups = new Map<string, Event[]>();
  for (const ev of events) {
    const bucket = groups.get(ev.date) ?? [];
    bucket.push(ev);
    groups.set(ev.date, bucket);
  }
  return Array.from(groups.entries()).map(([date, items]) => ({ date, items }));
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
  const [view, setView] = useState<View>("calendar");
  const [showPast, setShowPast] = useState(false);
  const [rsvpState, setRsvpState] = useState<Record<string, boolean>>(
    Object.fromEntries(events.map((e) => [e.id, e.hasRsvp])),
  );
  const [isPending, startTransition] = useTransition();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const upcomingEvents = useMemo(
    () => events.filter((e) => e.date >= todayStr),
    [events, todayStr],
  );
  const pastEvents = useMemo(
    () => events.filter((e) => e.date < todayStr).reverse(),
    [events, todayStr],
  );
  const upcomingGroups = useMemo(() => groupByDate(upcomingEvents), [upcomingEvents]);
  const pastGroups = useMemo(() => groupByDate(pastEvents), [pastEvents]);

  const checkedInSet = useMemo(
    () => new Set(events.filter((e) => e.checkedIn).map((e) => e.id)),
    [events],
  );

  useEffect(() => {
    const stored = window.localStorage.getItem("clubos-events-view-member");
    if (stored === "list" || stored === "calendar") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setView(stored);
    }
    if (stored !== "list") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedDate((curr) => curr ?? getInitialSelectedDate());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function changeView(next: View) {
    setView(next);
    window.localStorage.setItem("clubos-events-view-member", next);
  }

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

  function formatDateHeader(d: string) {
    return new Date(d + "T00:00:00")
      .toLocaleDateString(getDateLocale(locale), {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
      .toUpperCase();
  }

  function formatTime(t: string) {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }

  // Calendar state
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
  const monthName = new Date(calYear, calMonth).toLocaleDateString(getDateLocale(locale), {
    month: "long",
    year: "numeric",
  });

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
    return upcomingEvents[0]?.date ?? null;
  }

  function renderRsvpPill(ev: Event) {
    if (checkedInSet.has(ev.id)) {
      return (
        <span
          className="inline-flex items-center rounded-[var(--m-radius-sm)] bg-green-600/10 px-2.5 py-1 text-[11px] font-semibold text-green-700"
        >
          {t("events.checkedIn")}
        </span>
      );
    }
    const signed = rsvpState[ev.id];
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          handleRsvp(ev.id);
        }}
        disabled={isPending}
        className={`inline-flex items-center rounded-[var(--m-radius-sm)] px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
          signed
            ? "border text-[color:var(--m-ink-muted)]"
            : "m-btn-ink"
        }`}
        style={
          signed
            ? { borderColor: "var(--m-border)", background: "var(--m-surface)" }
            : undefined
        }
      >
        {signed ? t("events.signedUp") : t("events.signUp")}
      </button>
    );
  }

  function EventRow({ ev, isPast }: { ev: Event; isPast?: boolean }) {
    return (
      <a
        href={`/${clubSlug}/events/${ev.id}`}
        className={`m-card block overflow-hidden transition-transform active:scale-[0.99] ${isPast ? "opacity-70" : ""}`}
      >
        <div className="flex items-stretch gap-3 p-3">
          {ev.image_url ? (
            <img
              src={ev.image_url}
              alt=""
              className="h-20 w-20 shrink-0 rounded-[var(--m-radius-sm)] object-cover"
            />
          ) : (
            <div
              className="h-20 w-20 shrink-0 rounded-[var(--m-radius-sm)]"
              style={{ background: "var(--m-surface-sunken)" }}
            />
          )}
          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div>
              <p className="m-headline line-clamp-2 text-[color:var(--m-ink)]">
                {localized(ev.title, ev.title_es, locale)}
              </p>
              <p className="mt-0.5 text-[11px] text-[color:var(--m-ink-muted)]">
                {ev.time
                  ? `${formatTime(ev.time)}${ev.end_time ? ` – ${formatTime(ev.end_time)}` : ""}`
                  : t("events.allDay")}
                {ev.price != null
                  ? ` · $${Number(ev.price).toFixed(2)}`
                  : ` · ${t("common.free")}`}
              </p>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              {ev.reward_spins > 0 ? (
                <span className="club-tint-text club-tint-bg inline-flex items-center rounded-[var(--m-radius-xs)] px-1.5 py-0.5 text-[10px] font-semibold">
                  +{ev.reward_spins}{" "}
                  {ev.reward_spins === 1 ? t("common.spin") : t("common.spins")}
                </span>
              ) : (
                <span />
              )}
              {!isPast && renderRsvpPill(ev)}
            </div>
          </div>
        </div>
      </a>
    );
  }

  return (
    <div className="space-y-5">
      {/* View toggle — editorial ink pill group */}
      <div
        className="inline-flex rounded-[var(--m-radius-sm)] border p-0.5"
        style={{ borderColor: "var(--m-border)", background: "var(--m-surface)" }}
      >
        <button
          type="button"
          onClick={() => changeView("list")}
          className={`min-h-[40px] rounded-[calc(var(--m-radius-sm)-1px)] px-4 text-[12px] font-semibold transition-colors ${
            view === "list" ? "m-btn-ink" : "text-[color:var(--m-ink-muted)]"
          }`}
        >
          {t("events.viewList")}
        </button>
        <button
          type="button"
          onClick={() => {
            changeView("calendar");
            setSelectedDate(getInitialSelectedDate());
          }}
          className={`min-h-[40px] rounded-[calc(var(--m-radius-sm)-1px)] px-4 text-[12px] font-semibold transition-colors ${
            view === "calendar" ? "m-btn-ink" : "text-[color:var(--m-ink-muted)]"
          }`}
        >
          {t("events.viewCalendar")}
        </button>
      </div>

      {view === "list" ? (
        <div className="space-y-5">
          {upcomingGroups.length === 0 && (
            <div className="m-card p-8 text-center">
              <p className="m-headline text-[color:var(--m-ink)]">
                {t("events.noUpcoming")}
              </p>
              <p className="mt-1 text-sm text-[color:var(--m-ink-muted)]">
                {t("events.checkBackSoon")}
              </p>
            </div>
          )}

          {upcomingGroups.map((group) => (
            <div key={group.date} className="space-y-2">
              <p className="m-caption px-1">{formatDateHeader(group.date)}</p>
              <div className="space-y-2">
                {group.items.map((ev) => (
                  <EventRow key={ev.id} ev={ev} />
                ))}
              </div>
            </div>
          ))}

          {pastGroups.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowPast((v) => !v)}
                className="inline-flex min-h-[44px] items-center gap-2 text-[12px] font-semibold text-[color:var(--m-ink-muted)] transition-colors hover:text-[color:var(--m-ink)]"
              >
                <span>{showPast ? t("events.hidePast") : t("events.showPast")}</span>
                <svg
                  className={`h-4 w-4 transition-transform ${showPast ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showPast && (
                <div className="mt-3 space-y-5">
                  {pastGroups.map((group) => (
                    <div key={group.date} className="space-y-2">
                      <p className="m-caption px-1">{formatDateHeader(group.date)}</p>
                      <div className="space-y-2">
                        {group.items.map((ev) => (
                          <EventRow key={ev.id} ev={ev} isPast />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="m-card p-4">
            {/* Calendar header */}
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={prevMonth}
                className="flex h-11 w-11 items-center justify-center text-[color:var(--m-ink-muted)] transition-colors hover:text-[color:var(--m-ink)]"
                aria-label="Previous month"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <p className="m-headline text-[color:var(--m-ink)]">{monthName}</p>
              <button
                onClick={nextMonth}
                className="flex h-11 w-11 items-center justify-center text-[color:var(--m-ink-muted)] transition-colors hover:text-[color:var(--m-ink)]"
                aria-label="Next month"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-1 text-center">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <span key={d} className="m-caption">
                  {d}
                </span>
              ))}
            </div>

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
                  <button
                    key={day}
                    type="button"
                    disabled={!hasEvent}
                    onClick={hasEvent ? () => setSelectedDate(isSelected ? null : dateStr) : undefined}
                    className={`relative flex h-10 items-center justify-center rounded-[var(--m-radius-sm)] text-sm transition-colors ${
                      isSelected
                        ? "m-btn-ink"
                        : isToday
                          ? "font-bold text-[color:var(--m-ink)]"
                          : "text-[color:var(--m-ink-muted)]"
                    } ${hasEvent ? "cursor-pointer" : ""}`}
                    style={
                      isToday && !isSelected
                        ? { background: "var(--m-surface-sunken)" }
                        : undefined
                    }
                  >
                    {day}
                    {hasEvent && (
                      <span
                        className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                          isSelected
                            ? "bg-white"
                            : upcomingEventDates.has(dateStr)
                              ? "club-primary-bg"
                              : "bg-gray-300"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agenda for selected date (Fantastical pattern — month + agenda in one view) */}
          {selectedDate && (() => {
            const dayEvents = events.filter((e) => e.date === selectedDate);
            const isPastDate = !upcomingEventDates.has(selectedDate);
            if (dayEvents.length === 0) return null;
            return (
              <div className="space-y-2">
                <p className="m-caption px-1">
                  {formatDateHeader(selectedDate)}
                  {isPastDate && ` · ${t("events.past")}`}
                </p>
                <div className="space-y-2">
                  {dayEvents.map((ev) => (
                    <EventRow key={ev.id} ev={ev} isPast={isPastDate} />
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
