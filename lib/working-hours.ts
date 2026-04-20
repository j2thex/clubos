export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

// Loose record type — callers may index by arbitrary string (e.g. the
// output of Intl.DateTimeFormat). All seven keys are expected but not
// enforced; missing keys are treated as closed.
export type WorkingHours = Record<string, { open: string; close: string } | null>;

export const DAY_KEYS: readonly DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

// Default hospitality hours for a new club: noon to midnight, every day.
// "00:00" is interpreted as end-of-day (same-day close is impossible when
// close equals open; callers treat equal-open-and-close as 24h). Working-
// hours display's overnight branch handles 12:00 → 00:00 by treating 00:00
// as next-day midnight, so "Open · Closes 12:00 AM" renders correctly.
export const DEFAULT_OPEN = "12:00";
export const DEFAULT_CLOSE = "00:00";

export const DEFAULT_WORKING_HOURS: Record<DayKey, { open: string; close: string }> = {
  mon: { open: DEFAULT_OPEN, close: DEFAULT_CLOSE },
  tue: { open: DEFAULT_OPEN, close: DEFAULT_CLOSE },
  wed: { open: DEFAULT_OPEN, close: DEFAULT_CLOSE },
  thu: { open: DEFAULT_OPEN, close: DEFAULT_CLOSE },
  fri: { open: DEFAULT_OPEN, close: DEFAULT_CLOSE },
  sat: { open: DEFAULT_OPEN, close: DEFAULT_CLOSE },
  sun: { open: DEFAULT_OPEN, close: DEFAULT_CLOSE },
};

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":");
  return parseInt(h, 10) * 60 + parseInt(m ?? "0", 10);
}

// True if `currentMinutes` (in the club's local timezone) falls inside the
// club's working hours for `todayKey`. Handles three cases:
//   • same-day window (09:00–18:00)
//   • overnight window (22:00–02:00) — close < open
//   • yesterday's overnight tail: if yesterday was 22:00–02:00 and now is
//     01:30, today reads "closed" but we're still in yesterday's window.
//   • open == close is treated as 24h open.
export function isCurrentlyOpen(
  workingHours: WorkingHours,
  todayKey: DayKey,
  currentMinutes: number,
): boolean {
  const today = workingHours[todayKey];
  if (today) {
    const openMin = timeToMinutes(today.open);
    const closeMin = timeToMinutes(today.close);
    if (closeMin > openMin) {
      return currentMinutes >= openMin && currentMinutes < closeMin;
    }
    if (closeMin < openMin) {
      return currentMinutes >= openMin || currentMinutes < closeMin;
    }
    return true; // close === open → 24h
  }
  const todayIdx = DAY_KEYS.indexOf(todayKey);
  if (todayIdx === -1) return false;
  const yesterdayKey = DAY_KEYS[(todayIdx + 6) % 7];
  const yest = workingHours[yesterdayKey];
  if (yest) {
    const yOpen = timeToMinutes(yest.open);
    const yClose = timeToMinutes(yest.close);
    if (yClose < yOpen && currentMinutes < yClose) return true;
  }
  return false;
}
