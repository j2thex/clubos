"use client";

import { useState } from "react";
import { type Locale } from "@/lib/i18n";
import { isCurrentlyOpen, timeToMinutes, type DayKey } from "@/lib/working-hours";

type WorkingHours = Record<string, { open: string; close: string } | null>;

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const DAY_LABELS: Record<string, { en: string; es: string }> = {
  mon: { en: "Monday", es: "Lunes" },
  tue: { en: "Tuesday", es: "Martes" },
  wed: { en: "Wednesday", es: "Miércoles" },
  thu: { en: "Thursday", es: "Jueves" },
  fri: { en: "Friday", es: "Viernes" },
  sat: { en: "Saturday", es: "Sábado" },
  sun: { en: "Sunday", es: "Domingo" },
};

// JS getDay() returns 0=Sun, we need to map to our day keys
const JS_DAY_MAP = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function getTodayKey(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      timeZone: timezone,
    });
    const weekday = formatter.format(now).toLowerCase();
    return weekday.slice(0, 3);
  } catch {
    return JS_DAY_MAP[new Date().getDay()];
  }
}

function getCurrentTime(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: timezone,
    });
    return formatter.format(now); // "14:30"
  } catch {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const minute = m ?? "00";
  if (hour === 0) return `12:${minute} AM`;
  if (hour < 12) return `${hour}:${minute} AM`;
  if (hour === 12) return `12:${minute} PM`;
  return `${hour - 12}:${minute} PM`;
}

function entryCoversMinute(
  entry: { open: string; close: string } | null,
  currentMinutes: number,
): boolean {
  if (!entry) return false;
  const o = timeToMinutes(entry.open);
  const c = timeToMinutes(entry.close);
  if (c > o) return currentMinutes >= o && currentMinutes < c;
  if (c < o) return currentMinutes >= o || currentMinutes < c;
  return true; // 24h
}

function getNextOpenInfo(
  workingHours: WorkingHours,
  todayKey: string,
  locale: Locale,
): string | null {
  const todayIdx = DAYS.indexOf(todayKey as (typeof DAYS)[number]);
  if (todayIdx === -1) return null;

  for (let offset = 1; offset <= 7; offset++) {
    const dayKey = DAYS[(todayIdx + offset) % 7];
    const entry = workingHours[dayKey];
    if (entry) {
      const dayLabel = locale === "es" ? DAY_LABELS[dayKey].es : DAY_LABELS[dayKey].en;
      return `${dayLabel} ${formatTime(entry.open)}`;
    }
  }
  return null;
}

export function WorkingHoursDisplay({
  workingHours,
  timezone,
  locale,
}: {
  workingHours: WorkingHours;
  timezone: string;
  locale: Locale;
}) {
  const [expanded, setExpanded] = useState(false);
  const todayKey = getTodayKey(timezone);
  const todayEntry = workingHours[todayKey] ?? null;
  const currentTime = getCurrentTime(timezone);
  const currentMinutes = timeToMinutes(currentTime);

  const isOpen = isCurrentlyOpen(workingHours, todayKey as DayKey, currentMinutes);

  // Closing time shown depends on which window is active: today's own
  // hours, or yesterday's overnight tail (e.g. Sat 22:00 → Sun 02:00 when
  // "today" is Sunday and it's 01:30).
  const todayIdxForYest = DAYS.indexOf(todayKey as (typeof DAYS)[number]);
  const yesterdayKey =
    todayIdxForYest === -1 ? null : DAYS[(todayIdxForYest + 6) % 7];
  const yesterdayEntry = yesterdayKey ? workingHours[yesterdayKey] ?? null : null;
  const activeCloseEntry = isOpen
    ? entryCoversMinute(todayEntry, currentMinutes)
      ? todayEntry
      : yesterdayEntry
    : null;

  // Build summary text
  let statusText: string;
  if (isOpen && activeCloseEntry) {
    const closeLabel = formatTime(activeCloseEntry.close);
    statusText =
      locale === "es"
        ? `Abierto · Cierra ${closeLabel}`
        : `Open · Closes ${closeLabel}`;
  } else if (todayEntry && currentMinutes < timeToMinutes(todayEntry.open)) {
    statusText =
      locale === "es"
        ? `Cerrado · Abre ${formatTime(todayEntry.open)}`
        : `Closed · Opens ${formatTime(todayEntry.open)}`;
  } else {
    const nextOpen = getNextOpenInfo(workingHours, todayKey, locale);
    statusText = nextOpen
      ? locale === "es"
        ? `Cerrado · Abre ${nextOpen}`
        : `Closed · Opens ${nextOpen}`
      : locale === "es"
        ? "Cerrado"
        : "Closed";
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Summary row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-5 py-3 flex items-center gap-3 hover:bg-gray-50/60 transition-colors"
      >
        {/* Status dot */}
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${isOpen ? "bg-green-500" : "bg-red-400"}`}
        />
        {/* Status text */}
        <span className="text-sm font-semibold text-gray-900 flex-1 text-left">
          {statusText}
        </span>
        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded day list */}
      {expanded && (
        <div className="divide-y divide-gray-50 border-t border-gray-100">
          {DAYS.map((day) => {
            const isToday = day === todayKey;
            const entry = workingHours[day] ?? null;
            const label = locale === "es" ? DAY_LABELS[day].es : DAY_LABELS[day].en;
            return (
              <div
                key={day}
                className={`px-5 py-2.5 flex items-center justify-between ${
                  isToday ? "bg-green-50/60" : ""
                }`}
              >
                <span
                  className={`text-sm ${
                    isToday ? "font-semibold text-gray-900" : "font-medium text-gray-600"
                  }`}
                >
                  {label}
                  {isToday && (
                    <span className="ml-1.5 text-[10px] font-semibold text-green-600 uppercase">
                      {locale === "es" ? "Hoy" : "Today"}
                    </span>
                  )}
                </span>
                {entry ? (
                  <span className={`text-sm ${isToday ? "font-semibold text-gray-900" : "text-gray-500"}`}>
                    {formatTime(entry.open)} — {formatTime(entry.close)}
                  </span>
                ) : (
                  <span className="text-sm text-gray-300 italic">
                    {locale === "es" ? "Cerrado" : "Closed"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
