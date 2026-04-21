export type RangePreset = "today" | "week" | "month" | "custom";

export interface Range {
  preset: RangePreset;
  from: Date;
  to: Date;
  compareFrom: Date;
  compareTo: Date;
  label: string;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function parseIso(value: string | undefined): Date | null {
  if (!value) return null;
  const m = value.match(/^\d{4}-\d{2}-\d{2}$/);
  if (!m) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Parse searchParams into a Range. Defaults to "month" (rolling 30 days).
 * Comparison window is the same-length period immediately preceding.
 */
export function resolveRange(searchParams: URLSearchParams | Record<string, string | undefined>): Range {
  const get = (k: string): string | undefined =>
    searchParams instanceof URLSearchParams
      ? searchParams.get(k) ?? undefined
      : searchParams[k];

  const preset = (get("range") ?? "month") as RangePreset;
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);

  let from: Date;
  let to: Date;
  let actualPreset: RangePreset = preset;

  switch (preset) {
    case "today":
      from = todayStart;
      to = tomorrowStart;
      break;
    case "week":
      from = addDays(todayStart, -6);
      to = tomorrowStart;
      break;
    case "custom": {
      const customFrom = parseIso(get("from"));
      const customTo = parseIso(get("to"));
      if (customFrom && customTo && customFrom < customTo) {
        from = customFrom;
        to = addDays(customTo, 1);
      } else {
        from = addDays(todayStart, -29);
        to = tomorrowStart;
        actualPreset = "month";
      }
      break;
    }
    case "month":
    default:
      from = addDays(todayStart, -29);
      to = tomorrowStart;
      actualPreset = "month";
      break;
  }

  const lengthMs = to.getTime() - from.getTime();
  const compareTo = new Date(from.getTime());
  const compareFrom = new Date(from.getTime() - lengthMs);

  return {
    preset: actualPreset,
    from,
    to,
    compareFrom,
    compareTo,
    label: actualPreset,
  };
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
