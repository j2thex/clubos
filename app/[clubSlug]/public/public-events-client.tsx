"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/provider";
import { getDateLocale, localized } from "@/lib/i18n";

interface PublicEvent {
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
}

export function PublicEventsClient({ events, clubSlug }: { events: PublicEvent[]; clubSlug: string }) {
  const { t, locale } = useLanguage();
  const [view, setView] = useState<"list" | "calendar">("calendar");

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const upcomingEvents = useMemo(() => events.filter((e) => e.date >= todayStr), [events, todayStr]);
  const initialDate = upcomingEvents[0]?.date ?? null;
  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate);

  function formatDate(d: string) {
    return new Date(d + "T00:00:00").toLocaleDateString(getDateLocale(locale), {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  function formatTime(ti: string) {
    const [h, m] = ti.split(":");
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

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
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

  return (
    <div className="space-y-3">
      {/* View toggle */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setView("list")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            view === "list"
              ? "bg-white text-gray-900 shadow"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          {t("events.viewList")}
        </button>
        <button
          onClick={() => {
            setView("calendar");
            if (!selectedDate) {
              const upcoming = upcomingEvents[0];
              setSelectedDate(upcoming?.date ?? null);
            }
          }}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            view === "calendar"
              ? "bg-white text-gray-900 shadow"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          {t("events.viewCalendar")}
        </button>
      </div>

      {view === "list" ? (
        <div className="space-y-3">
          {upcomingEvents.map((ev) => (
            <div key={ev.id} className="bg-white rounded-2xl shadow overflow-hidden">
              {ev.image_url && (
                <img src={ev.image_url} alt="" className="w-full h-36 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{localized(ev.title, ev.title_es, locale)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(ev.date)}
                      {ev.time && ` ${localized("at", "a las", locale)} ${formatTime(ev.time)}`}
                    </p>
                    {ev.description && (
                      <p className="text-xs text-gray-400 mt-1">{localized(ev.description, ev.description_es, locale)}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {ev.price != null ? (
                      <span className="text-sm font-bold text-gray-900">${Number(ev.price).toFixed(2)}</span>
                    ) : (
                      <span className="text-sm font-bold text-green-600">{t("common.free")}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {ev.reward_spins > 0 && (
                    <span className="text-xs club-tint-text font-medium px-2 py-0.5 club-tint-bg rounded-full">
                      +{ev.reward_spins} {ev.reward_spins === 1 ? t("common.spin") : t("common.spins")}
                    </span>
                  )}
                  {ev.link && (
                    <a
                      href={ev.link.match(/^https?:\/\//) ? ev.link : `https://${ev.link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium club-primary underline"
                    >
                      {localized("Learn more", "Más info", locale)}
                    </a>
                  )}
                  <Link
                    href={`/${clubSlug}/login`}
                    className="ml-auto club-btn px-4 py-1.5 rounded-full text-xs font-bold shadow-sm"
                  >
                    {localized("Join", "Unirse", locale)}
                  </Link>
                </div>
              </div>
            </div>
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
            if (dayEvents.length === 0) return null;
            return (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                <p className="text-xs font-medium text-gray-400 px-1">
                  {formatDate(selectedDate)}
                </p>
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-xl bg-gray-50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      {ev.image_url && (
                        <img
                          src={ev.image_url}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate text-gray-900">
                          {localized(ev.title, ev.title_es, locale)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {ev.time ? formatTime(ev.time) : t("events.allDay")}
                          {ev.price != null
                            ? ` · $${Number(ev.price).toFixed(2)}`
                            : ` · ${t("common.free")}`}
                        </p>
                      </div>
                      {ev.reward_spins > 0 && (
                        <span className="shrink-0 text-xs club-tint-text font-medium px-2 py-0.5 club-tint-bg rounded-full">
                          +{ev.reward_spins}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {ev.link && (
                        <a
                          href={ev.link.match(/^https?:\/\//) ? ev.link : `https://${ev.link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium club-primary underline"
                        >
                          {localized("Learn more", "Más info", locale)}
                        </a>
                      )}
                      <Link
                        href={`/${clubSlug}/login`}
                        className="ml-auto club-btn px-3 py-1 rounded-full text-xs font-bold shadow-sm"
                      >
                        {localized("Join", "Unirse", locale)}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
