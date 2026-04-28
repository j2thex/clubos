import type { Locale } from "@/lib/i18n";

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type DayHours = { open: string; close: string };

/**
 * Per-day open/close in 24h "HH:MM". null entry = closed that day.
 * The whole record being null = no hours configured at all.
 */
export type WorkingHours = Partial<Record<DayKey, DayHours | null>>;

export const DAY_KEYS: readonly DayKey[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

const JS_DAY_TO_KEY: readonly DayKey[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
] as const;

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":");
  return parseInt(h, 10) * 60 + parseInt(m ?? "0", 10);
}

/**
 * Locale-aware time formatting.
 * - "en": 12h with AM/PM ("9:00 AM", "12:00 PM").
 * - "es": 24h ("9:00", "21:30") — Spanish convention.
 */
export function formatTime(time: string, locale: Locale): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const minute = (m ?? "00").padStart(2, "0");

  if (locale === "es") {
    return `${hour}:${minute}`;
  }
  if (hour === 0) return `12:${minute} AM`;
  if (hour < 12) return `${hour}:${minute} AM`;
  if (hour === 12) return `12:${minute} PM`;
  return `${hour - 12}:${minute} PM`;
}

export function getDayKeyInTimezone(timezone: string, now: Date = new Date()): DayKey {
  try {
    const weekday = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      timeZone: timezone,
    })
      .format(now)
      .toLowerCase()
      .slice(0, 3) as DayKey;
    if (DAY_KEYS.includes(weekday)) return weekday;
    return JS_DAY_TO_KEY[now.getDay()];
  } catch {
    return JS_DAY_TO_KEY[now.getDay()];
  }
}

export function getMinutesInTimezone(
  timezone: string,
  now: Date = new Date(),
): number {
  try {
    const formatted = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: timezone,
    }).format(now);
    const [hRaw, m] = formatted.split(":");
    const h = parseInt(hRaw, 10) % 24;
    return h * 60 + parseInt(m ?? "0", 10);
  } catch {
    return now.getHours() * 60 + now.getMinutes();
  }
}

function previousDayKey(key: DayKey): DayKey {
  const idx = DAY_KEYS.indexOf(key);
  return DAY_KEYS[(idx + 6) % 7];
}

function nextDayKey(key: DayKey, offset = 1): DayKey {
  const idx = DAY_KEYS.indexOf(key);
  return DAY_KEYS[(idx + offset) % 7];
}

function isOvernight(entry: DayHours): boolean {
  return timeToMinutes(entry.close) <= timeToMinutes(entry.open);
}

export function isOpenAt(
  hours: WorkingHours | null | undefined,
  timezone: string,
  now: Date = new Date(),
): boolean {
  if (!hours) return false;
  const todayKey = getDayKeyInTimezone(timezone, now);
  const nowMin = getMinutesInTimezone(timezone, now);

  const today = hours[todayKey] ?? null;
  if (today) {
    const open = timeToMinutes(today.open);
    const close = timeToMinutes(today.close);
    if (!isOvernight(today)) {
      if (nowMin >= open && nowMin < close) return true;
    } else {
      if (nowMin >= open) return true;
    }
  }

  const yKey = previousDayKey(todayKey);
  const yesterday = hours[yKey] ?? null;
  if (yesterday && isOvernight(yesterday)) {
    if (nowMin < timeToMinutes(yesterday.close)) return true;
  }

  return false;
}

export type Status =
  | { open: true; closesAt: string }
  | { open: false; nextOpenDay: DayKey | null; nextOpenTime: string | null };

export function getStatus(
  hours: WorkingHours | null | undefined,
  timezone: string,
  now: Date = new Date(),
): Status | null {
  if (!hours) return null;
  const hasAnyHours = DAY_KEYS.some((d) => hours[d]);
  if (!hasAnyHours) return null;

  const todayKey = getDayKeyInTimezone(timezone, now);
  const nowMin = getMinutesInTimezone(timezone, now);

  if (isOpenAt(hours, timezone, now)) {
    const today = hours[todayKey] ?? null;
    if (today) {
      const open = timeToMinutes(today.open);
      const close = timeToMinutes(today.close);
      const overnight = isOvernight(today);
      if (!overnight && nowMin >= open && nowMin < close) {
        return { open: true, closesAt: today.close };
      }
      if (overnight && nowMin >= open) {
        return { open: true, closesAt: today.close };
      }
    }
    const yesterday = hours[previousDayKey(todayKey)] ?? null;
    if (yesterday) {
      return { open: true, closesAt: yesterday.close };
    }
  }

  const today = hours[todayKey] ?? null;
  if (today && nowMin < timeToMinutes(today.open)) {
    return { open: false, nextOpenDay: todayKey, nextOpenTime: today.open };
  }

  for (let offset = 1; offset <= 7; offset++) {
    const key = nextDayKey(todayKey, offset);
    const entry = hours[key];
    if (entry) {
      return { open: false, nextOpenDay: key, nextOpenTime: entry.open };
    }
  }

  return { open: false, nextOpenDay: null, nextOpenTime: null };
}
