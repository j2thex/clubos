import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatTime,
  getDayKeyInTimezone,
  getMinutesInTimezone,
  getStatus,
  isOpenAt,
  timeToMinutes,
  type WorkingHours,
} from "@/lib/working-hours";

const MADRID = "Europe/Madrid";
const NY = "America/New_York";
const UTC = "UTC";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("timeToMinutes", () => {
  it("converts midnight", () => {
    expect(timeToMinutes("00:00")).toBe(0);
  });
  it("converts morning", () => {
    expect(timeToMinutes("09:30")).toBe(570);
  });
  it("converts last minute", () => {
    expect(timeToMinutes("23:59")).toBe(1439);
  });
});

describe("formatTime", () => {
  it("english 12h morning", () => {
    expect(formatTime("09:00", "en")).toBe("9:00 AM");
  });
  it("english 12h evening", () => {
    expect(formatTime("21:30", "en")).toBe("9:30 PM");
  });
  it("english midnight", () => {
    expect(formatTime("00:00", "en")).toBe("12:00 AM");
  });
  it("english noon", () => {
    expect(formatTime("12:00", "en")).toBe("12:00 PM");
  });
  it("spanish uses 24h morning", () => {
    expect(formatTime("09:00", "es")).toBe("9:00");
  });
  it("spanish uses 24h evening", () => {
    expect(formatTime("21:30", "es")).toBe("21:30");
  });
});

describe("getDayKeyInTimezone", () => {
  it("returns today in Madrid for a Tuesday UTC noon", () => {
    expect(getDayKeyInTimezone(MADRID, new Date("2026-04-28T12:00:00Z"))).toBe("tue");
  });
  it("flips day when Madrid crosses midnight before UTC", () => {
    expect(getDayKeyInTimezone(MADRID, new Date("2026-04-28T22:30:00Z"))).toBe("wed");
  });
  it("falls back gracefully on garbage timezone", () => {
    const result = getDayKeyInTimezone("Not/A_Zone", new Date("2026-04-28T12:00:00Z"));
    expect(["sun", "mon", "tue", "wed", "thu", "fri", "sat"]).toContain(result);
  });
});

describe("getMinutesInTimezone", () => {
  it("matches Madrid wall clock", () => {
    expect(getMinutesInTimezone(MADRID, new Date("2026-04-28T10:00:00Z"))).toBe(720);
  });
  it("matches New York wall clock", () => {
    expect(getMinutesInTimezone(NY, new Date("2026-04-28T18:00:00Z"))).toBe(840);
  });
  it("matches UTC trivially", () => {
    expect(getMinutesInTimezone(UTC, new Date("2026-04-28T07:15:00Z"))).toBe(7 * 60 + 15);
  });
});

describe("isOpenAt — regular hours", () => {
  const hours: WorkingHours = {
    mon: { open: "09:00", close: "18:00" },
    tue: { open: "09:00", close: "18:00" },
    wed: null,
    thu: { open: "09:00", close: "18:00" },
    fri: { open: "09:00", close: "18:00" },
    sat: null,
    sun: null,
  };

  it("open mid-window", () => {
    expect(isOpenAt(hours, MADRID, new Date("2026-04-28T12:00:00Z"))).toBe(true);
  });
  it("closed before open", () => {
    expect(isOpenAt(hours, MADRID, new Date("2026-04-28T06:59:00Z"))).toBe(false);
  });
  it("closed exactly at close (strict <)", () => {
    expect(isOpenAt(hours, MADRID, new Date("2026-04-28T16:00:00Z"))).toBe(false);
  });
  it("open one minute before close", () => {
    expect(isOpenAt(hours, MADRID, new Date("2026-04-28T15:59:00Z"))).toBe(true);
  });
  it("closed on a null day", () => {
    expect(isOpenAt(hours, MADRID, new Date("2026-04-29T10:00:00Z"))).toBe(false);
  });
});

describe("isOpenAt — overnight hours", () => {
  const hours: WorkingHours = {
    mon: null,
    tue: { open: "22:00", close: "02:00" },
    wed: { open: "22:00", close: "02:00" },
    thu: null,
    fri: null,
    sat: null,
    sun: null,
  };

  it("open at 23:00 same day", () => {
    expect(isOpenAt(hours, MADRID, new Date("2026-04-28T21:00:00Z"))).toBe(true);
  });
  it("open at 01:30 next-day morning (yesterday's tail)", () => {
    expect(isOpenAt(hours, MADRID, new Date("2026-04-28T23:30:00Z"))).toBe(true);
  });
  it("closed exactly at 02:00", () => {
    expect(isOpenAt(hours, MADRID, new Date("2026-04-29T00:00:00Z"))).toBe(false);
  });
  it("closed at 21:59 before opening", () => {
    expect(isOpenAt(hours, MADRID, new Date("2026-04-28T19:59:00Z"))).toBe(false);
  });
  it("Wed overnight tail does not bleed into Thu after close", () => {
    expect(isOpenAt(hours, MADRID, new Date("2026-04-30T01:00:00Z"))).toBe(false);
  });
});

describe("isOpenAt — null/empty hours", () => {
  it("null hours returns false", () => {
    expect(isOpenAt(null, MADRID, new Date())).toBe(false);
  });
  it("undefined hours returns false", () => {
    expect(isOpenAt(undefined, MADRID, new Date())).toBe(false);
  });
  it("all-null days returns false", () => {
    const hours: WorkingHours = {
      mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null,
    };
    expect(isOpenAt(hours, MADRID, new Date())).toBe(false);
  });
});

describe("isOpenAt — DST transition (Europe/Madrid spring forward 2026-03-29)", () => {
  const hours: WorkingHours = {
    sun: { open: "10:00", close: "14:00" },
  };
  it("open after the jump (10:30 Madrid = 08:30 UTC since CEST is UTC+2)", () => {
    expect(isOpenAt(hours, MADRID, new Date("2026-03-29T08:30:00Z"))).toBe(true);
  });
  it("closed before open (09:30 Madrid = 07:30 UTC)", () => {
    expect(isOpenAt(hours, MADRID, new Date("2026-03-29T07:30:00Z"))).toBe(false);
  });
});

describe("noon-to-midnight (admin default)", () => {
  // The default a fresh admin form pre-fills when a day is toggled open.
  const hours: WorkingHours = {
    mon: { open: "12:00", close: "00:00" },
    tue: { open: "12:00", close: "00:00" },
    wed: { open: "12:00", close: "00:00" },
    thu: { open: "12:00", close: "00:00" },
    fri: { open: "12:00", close: "00:00" },
    sat: { open: "12:00", close: "00:00" },
    sun: { open: "12:00", close: "00:00" },
  };

  it("open at 14:00 Madrid (12:00 UTC)", () => {
    expect(isOpenAt(hours, MADRID, new Date("2026-04-28T12:00:00Z"))).toBe(true);
  });
  it("open at 23:59 Madrid (21:59 UTC)", () => {
    expect(isOpenAt(hours, MADRID, new Date("2026-04-28T21:59:00Z"))).toBe(true);
  });
  it("closed at 00:00 Madrid sharp (22:00 UTC prev day)", () => {
    // Tue 00:00 Madrid = Mon 22:00 UTC. We close exactly at midnight.
    expect(isOpenAt(hours, MADRID, new Date("2026-04-27T22:00:00Z"))).toBe(false);
  });
  it("closed at 11:00 Madrid (09:00 UTC) before noon open", () => {
    expect(isOpenAt(hours, MADRID, new Date("2026-04-28T09:00:00Z"))).toBe(false);
  });
  it("getStatus reports closesAt 00:00 while open", () => {
    expect(getStatus(hours, MADRID, new Date("2026-04-28T20:00:00Z"))).toEqual({
      open: true,
      closesAt: "00:00",
    });
  });
  it("getStatus reports next-open 12:00 today when before noon", () => {
    expect(getStatus(hours, MADRID, new Date("2026-04-28T08:00:00Z"))).toEqual({
      open: false,
      nextOpenDay: "tue",
      nextOpenTime: "12:00",
    });
  });
});

describe("getStatus", () => {
  const monFri: WorkingHours = {
    mon: { open: "09:00", close: "18:00" },
    tue: { open: "09:00", close: "18:00" },
    wed: { open: "09:00", close: "18:00" },
    thu: { open: "09:00", close: "18:00" },
    fri: { open: "09:00", close: "18:00" },
    sat: null,
    sun: null,
  };

  it("returns null for null hours", () => {
    expect(getStatus(null, MADRID, new Date())).toBeNull();
  });

  it("returns null for all-null days", () => {
    const empty: WorkingHours = {
      mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null,
    };
    expect(getStatus(empty, MADRID, new Date())).toBeNull();
  });

  it("open during business hours", () => {
    const status = getStatus(monFri, MADRID, new Date("2026-04-28T12:00:00Z"));
    expect(status).toEqual({ open: true, closesAt: "18:00" });
  });

  it("closed before today's open", () => {
    const status = getStatus(monFri, MADRID, new Date("2026-04-28T06:00:00Z"));
    expect(status).toEqual({ open: false, nextOpenDay: "tue", nextOpenTime: "09:00" });
  });

  it("closed after today's close — finds tomorrow", () => {
    const status = getStatus(monFri, MADRID, new Date("2026-04-28T17:00:00Z"));
    expect(status).toEqual({ open: false, nextOpenDay: "wed", nextOpenTime: "09:00" });
  });

  it("closed on the weekend — finds Monday", () => {
    const status = getStatus(monFri, MADRID, new Date("2026-05-02T10:00:00Z"));
    expect(status).toEqual({ open: false, nextOpenDay: "mon", nextOpenTime: "09:00" });
  });

  it("overnight: open in the early hours via yesterday tail", () => {
    const overnight: WorkingHours = {
      mon: null,
      tue: { open: "22:00", close: "02:00" },
      wed: null, thu: null, fri: null, sat: null, sun: null,
    };
    const status = getStatus(overnight, MADRID, new Date("2026-04-28T23:00:00Z"));
    expect(status).toEqual({ open: true, closesAt: "02:00" });
  });
});
