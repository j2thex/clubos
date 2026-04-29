"use client";

import { useState } from "react";
import { t, type Locale } from "@/lib/i18n";
import {
  DAY_KEYS,
  formatTime,
  getDayKeyInTimezone,
  getStatus,
  type DayKey,
  type WorkingHours,
} from "@/lib/working-hours";

function dayLabelLong(day: DayKey, locale: Locale): string {
  return t(locale, `workingHours.day.${day}Long`);
}

function dayLabelShort(day: DayKey, locale: Locale): string {
  return t(locale, `workingHours.day.${day}`);
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
  const status = getStatus(workingHours, timezone, new Date());
  const todayKey = getDayKeyInTimezone(timezone);

  let statusText: string;
  if (!status) {
    statusText = t(locale, "workingHours.noHours");
  } else if (status.open) {
    statusText = t(locale, "workingHours.openClosesAt", {
      time: formatTime(status.closesAt, locale),
    });
  } else if (status.nextOpenDay && status.nextOpenTime) {
    const isToday = status.nextOpenDay === todayKey;
    statusText = isToday
      ? t(locale, "workingHours.closedOpensAt", {
          time: formatTime(status.nextOpenTime, locale),
        })
      : t(locale, "workingHours.closedOpensOn", {
          day: dayLabelShort(status.nextOpenDay, locale),
          time: formatTime(status.nextOpenTime, locale),
        });
  } else {
    statusText = t(locale, "workingHours.closed");
  }

  const isOpen = status?.open === true;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-5 py-3 flex items-center gap-3 hover:bg-gray-50/60 transition-colors"
      >
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${isOpen ? "bg-green-500" : "bg-red-400"}`}
        />
        <span className="text-sm font-semibold text-gray-900 flex-1 text-left">
          {statusText}
        </span>
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

      {expanded && (
        <div className="divide-y divide-gray-50 border-t border-gray-100">
          {DAY_KEYS.map((day) => {
            const isToday = day === todayKey;
            const entry = workingHours[day] ?? null;
            return (
              <div
                key={day}
                className={`px-5 py-2.5 flex items-center justify-between ${isToday ? "bg-green-50/60" : ""}`}
              >
                <span
                  className={`text-sm ${isToday ? "font-semibold text-gray-900" : "font-medium text-gray-600"}`}
                >
                  {dayLabelLong(day, locale)}
                  {isToday && (
                    <span className="ml-1.5 text-[10px] font-semibold text-green-600 uppercase">
                      {t(locale, "workingHours.today")}
                    </span>
                  )}
                </span>
                {entry ? (
                  <span
                    className={`text-sm ${isToday ? "font-semibold text-gray-900" : "text-gray-500"}`}
                  >
                    {formatTime(entry.open, locale)} — {formatTime(entry.close, locale)}
                  </span>
                ) : (
                  <span className="text-sm text-gray-300 italic">
                    {t(locale, "workingHours.closed")}
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
