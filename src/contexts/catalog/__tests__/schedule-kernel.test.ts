import { describe, expect, it } from "vitest";
import { validateScheduleInput, isClosedDay, expandSchedules } from "../schedule-kernel";

describe("schedule-kernel", () => {
  it("rejects end <= start", () => {
    expect(validateScheduleInput({ weekday: 6, startTime: "13:00", endTime: "09:00", durationMinutes: 30, capacity: 1 })).toBe(false);
  });
  it("accepts a valid row", () => {
    expect(validateScheduleInput({ weekday: 6, startTime: "09:00", endTime: "13:00", durationMinutes: 30, capacity: 1 })).toBe(true);
  });
  it("whole-doctor exception closes any service; service exception closes only that service", () => {
    const ex = [{ providerId: "d1", serviceId: null as string | null, exceptionDate: "2026-09-12" }];
    expect(isClosedDay(ex, "d1", "s1", "2026-09-12")).toBe(true);
    expect(isClosedDay(ex, "d1", "s1", "2026-09-13")).toBe(false);
    const exSvc = [{ providerId: "d1", serviceId: "s1", exceptionDate: "2026-09-12" }];
    expect(isClosedDay(exSvc, "d1", "s1", "2026-09-12")).toBe(true);
    expect(isClosedDay(exSvc, "d1", "s2", "2026-09-12")).toBe(false);
  });
  it("expansion skips closed dates", () => {
    // 2026-09-12 is a Saturday (getUTCDay 6)
    const out = expandSchedules(
      [{ providerId: "d1", serviceId: "s1", weekday: 6, startTime: "09:00", endTime: "10:00", durationMinutes: 30, capacity: 1, isActive: true }],
      [{ providerId: "d1", serviceId: null, exceptionDate: "2026-09-12" }],
      "2026-09-12",
      "2026-09-12",
    );
    expect(out).toEqual([]);
  });
});
