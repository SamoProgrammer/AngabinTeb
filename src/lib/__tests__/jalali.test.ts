import { describe, expect, it } from "vitest";
import {
  addDays,
  gregorianIso,
  jalaliMonthLength,
  jalaliMonthStart,
  jalaliParts,
  noonUtc,
  parseIso,
  saturdayFirstIndex,
  tehranTodayIso,
} from "@/lib/jalali";

describe("jalaliParts", () => {
  it("resolves Nowruz 1403", () => {
    expect(jalaliParts(new Date("2024-03-20T12:00:00Z"))).toEqual({ jy: 1403, jm: 1, jd: 1 });
  });
  it("resolves Esfand month-end (leap year 1403 has 30 days)", () => {
    expect(jalaliParts(new Date("2025-03-20T12:00:00Z"))).toEqual({ jy: 1403, jm: 12, jd: 30 });
  });
});

describe("jalaliMonthStart / jalaliMonthLength", () => {
  it("finds Farvardin 1 1403 and its 31-day length", () => {
    const start = jalaliMonthStart(new Date("2024-04-10T12:00:00Z"));
    expect(jalaliParts(start)).toEqual({ jy: 1403, jm: 1, jd: 1 });
    expect(jalaliMonthLength(start)).toBe(31);
  });
  it("finds Bahman length (30 days)", () => {
    const start = jalaliMonthStart(new Date("2025-02-10T12:00:00Z"));
    expect(jalaliParts(start).jm).toBe(11);
    expect(jalaliMonthLength(start)).toBe(30);
  });
  it("finds Esfand 1403 length (leap: 30 days)", () => {
    const start = jalaliMonthStart(new Date("2025-03-10T12:00:00Z"));
    expect(jalaliParts(start).jm).toBe(12);
    expect(jalaliMonthLength(start)).toBe(30);
  });
});

describe("saturdayFirstIndex", () => {
  it("maps Saturday to 0 and Friday to 6", () => {
    expect(saturdayFirstIndex(noonUtc(2024, 2, 23))).toBe(0); // Saturday
    expect(saturdayFirstIndex(noonUtc(2024, 2, 29))).toBe(6); // Friday
  });
});

describe("parseIso / gregorianIso / tehranTodayIso", () => {
  it("round-trips Gregorian ISO days", () => {
    expect(gregorianIso(parseIso("2026-09-07")!)).toBe("2026-09-07");
    expect(parseIso("not-a-date")).toBeNull();
  });
  it("returns a Tehran calendar day in ISO shape", () => {
    expect(tehranTodayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it("addDays crosses month boundaries", () => {
    expect(gregorianIso(addDays(noonUtc(2024, 2, 31), 1))).toBe("2024-04-01");
  });
});
