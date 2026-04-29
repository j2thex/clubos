"use client";

import { t, type Locale } from "@/lib/i18n";
import {
  formatTime,
  getDayKeyInTimezone,
  getStatus,
  type WorkingHours,
} from "@/lib/working-hours";

export function WorkingHoursBadge({
  workingHours,
  timezone,
  locale,
  className = "",
}: {
  workingHours: WorkingHours | null | undefined;
  timezone: string | null | undefined;
  locale: Locale;
  className?: string;
}) {
  if (!workingHours || !timezone) return null;
  const status = getStatus(workingHours, timezone, new Date());
  if (!status) return null;

  const todayKey = getDayKeyInTimezone(timezone);

  let label: string;
  if (status.open) {
    label = t(locale, "workingHours.openClosesAt", {
      time: formatTime(status.closesAt, locale),
    });
  } else if (status.nextOpenDay && status.nextOpenTime) {
    const isToday = status.nextOpenDay === todayKey;
    label = isToday
      ? t(locale, "workingHours.closedOpensAt", {
          time: formatTime(status.nextOpenTime, locale),
        })
      : t(locale, "workingHours.closedOpensOn", {
          day: t(locale, `workingHours.day.${status.nextOpenDay}`),
          time: formatTime(status.nextOpenTime, locale),
        });
  } else {
    label = t(locale, "workingHours.closed");
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs ${className}`}
      data-open={status.open ? "true" : "false"}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.open ? "bg-emerald-500" : "bg-red-400"}`}
      />
      <span className="truncate">{label}</span>
    </span>
  );
}
