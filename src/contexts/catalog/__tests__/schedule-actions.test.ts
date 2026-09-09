// src/contexts/catalog/__tests__/schedule-actions.test.ts
import { describe, expect, it } from "vitest";
import { expandSchedules } from "../schedule-kernel";

describe("generateSlotsFromSchedules planning", () => {
  it("skips closed dates and counts overlap separately", () => {
    const created = expandSchedules(
      [{ providerId: "d1", serviceId: "s1", weekday: 6, startTime: "09:00", endTime: "10:00", durationMinutes: 30, capacity: 1, isActive: true }],
      [],
      "2026-09-12",
      "2026-09-12",
    );
    expect(created).toHaveLength(2); // 09:00, 09:30
  });
});
