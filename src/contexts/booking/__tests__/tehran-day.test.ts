import { describe, it, expect } from "vitest";
import { tehranDayBounds } from "../kernel";

describe("tehranDayBounds", () => {
  it("pins a Jalali-day window to Asia/Tehran midnight", () => {
    const { start, end } = tehranDayBounds(new Date("2026-09-10T08:00:00Z"));
    expect(start.toISOString()).toBe("2026-09-09T20:30:00.000Z");
    expect(end.toISOString()).toBe("2026-09-10T20:30:00.000Z");
  });
});
