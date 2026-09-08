import { describe, expect, it } from "vitest";
import {
  formatJalaliDate,
  formatJalaliDateTime,
  formatJalaliTime,
  formatJalaliWeekday,
  jalaliLocale,
} from "@/lib/format";

// Anchor: 2024-03-20T00:00:00Z is 1 Farvardin 1403 (Nowruz).
// Asia/Tehran is UTC+3:30, so it stays Far 1 after the zone shift.
const NOWRUZ_1403 = new Date("2024-03-20T00:00:00Z");

describe("jalaliLocale", () => {
  it("pins every locale to the Persian calendar", () => {
    expect(jalaliLocale("fa")).toContain("ca-persian");
    expect(jalaliLocale("en")).toContain("ca-persian");
    expect(jalaliLocale("ar")).toContain("ca-persian");
  });
});

describe("formatJalaliDate", () => {
  it("renders Nowruz 1403 in Persian", () => {
    const out = formatJalaliDate(NOWRUZ_1403, "fa");
    expect(out).toContain("فروردین");
    expect(out).toContain("۱۴۰۳");
  });
  it("renders the same Jalali date in Latin digits for en", () => {
    const out = formatJalaliDate(NOWRUZ_1403, "en");
    expect(out).toContain("1403");
    expect(out).not.toMatch(/[۰-۹]/);
  });
});

describe("formatJalaliTime", () => {
  it("converts UTC to Tehran wall time", () => {
    // 12:00Z = 15:30 in Tehran (UTC+3:30, late March).
    const out = formatJalaliTime(new Date("2024-03-20T12:00:00Z"), "en", {
      hour12: false,
    });
    expect(out).toContain("15:30");
  });
});

describe("formatJalaliDateTime", () => {
  it("combines Jalali date and Tehran time", () => {
    const out = formatJalaliDateTime(NOWRUZ_1403, "fa");
    expect(out).toContain("فروردین");
  });
});

describe("formatJalaliWeekday", () => {
  it("names the weekday (2024-03-20 was a Wednesday)", () => {
    expect(formatJalaliWeekday(NOWRUZ_1403, "fa")).toContain("چهارشنبه");
    expect(formatJalaliWeekday(NOWRUZ_1403, "en")).toContain("Wednesday");
  });
});
