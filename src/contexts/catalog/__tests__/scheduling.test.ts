import { describe, expect, it } from "vitest";
import { expandPattern } from "../actions";

describe("expandPattern", () => {
  it("expands a weekly pattern into concrete slots", () => {
    const slots = expandPattern({
      weekday: 2, // Tuesday
      startsAt: "09:00",
      endsAt: "17:00",
      durationMinutes: 60,
      from: new Date("2026-09-01T00:00:00Z"),
      to: new Date("2026-09-30T00:00:00Z"),
    });
    expect(slots.length).toBe(40); // 5 Tuesdays (Sep 1, 8, 15, 22, 29) × 8 one-hour slots
    expect(slots[0]).toEqual(new Date("2026-09-01T09:00:00Z"));
    expect(slots[slots.length - 1]).toEqual(new Date("2026-09-29T16:00:00Z"));
  });

  it("rejects an end before start", () => {
    expect(() => expandPattern({
      weekday: 1, startsAt: "17:00", endsAt: "09:00", durationMinutes: 60,
      from: new Date("2026-09-01T00:00:00Z"), to: new Date("2026-09-30T00:00:00Z"),
    })).toThrow("endsAt must be after startsAt");
  });
});