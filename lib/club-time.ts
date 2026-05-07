// Server-side helpers for "what time is it in this club's timezone".
// Vercel functions run in UTC, so any new Date() / getHours() / toDateString()
// reflects UTC, not the club's local day. These helpers honour clubs.timezone
// (fallback Europe/Madrid).

export function clubHourOf(now: Date, timezone: string): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: timezone,
    }).format(now),
  );
}

export function clubTodayYmd(now: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timezone,
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

// Returns the UTC ISO timestamp of midnight-today in the club's timezone.
// Used as the lower bound for "today's sales / capacity / etc." filters.
// Handles DST by deriving the offset from the current instant.
export function clubDayStartIso(now: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const num = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const wallClockNowAsUtc = Date.UTC(
    num("year"),
    num("month") - 1,
    num("day"),
    num("hour"),
    num("minute"),
    num("second"),
  );
  const offsetMs = now.getTime() - wallClockNowAsUtc;
  const wallClockMidnightAsUtc = Date.UTC(
    num("year"),
    num("month") - 1,
    num("day"),
    0,
    0,
    0,
  );
  return new Date(wallClockMidnightAsUtc + offsetMs).toISOString();
}
