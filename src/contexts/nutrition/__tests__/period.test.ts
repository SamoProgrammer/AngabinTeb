import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { validatePeriodInput } from "../actions";

describe("period validation", () => {
  it("rejects end before start", () => {
    const r = validatePeriodInput({ title: "هفته ۱", startsOn: "2026-09-10", endsOn: "2026-09-01" });
    expect(r.ok).toBe(false);
  });
  it("accepts a sane week", () => {
    const r = validatePeriodInput({ title: "هفته ۱", startsOn: "2026-09-01", endsOn: "2026-09-07" });
    expect(r.ok).toBe(true);
  });
});
