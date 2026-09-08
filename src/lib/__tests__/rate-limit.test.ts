import { describe, expect, it, beforeEach } from "vitest";
import {
  checkRateLimit,
  resetRateLimit,
  OTP_SEND_RULE,
  BOOKING_RULE,
} from "@/lib/rate-limit";

const RULE = { limit: 3, windowMs: 60_000 };

describe("checkRateLimit", () => {
  beforeEach(() => resetRateLimit());

  it("allows up to the limit then trips", () => {
    const now = 1_000_000;
    expect(checkRateLimit("k", RULE, now)).toEqual({ ok: true, retryAfterMs: 0 });
    expect(checkRateLimit("k", RULE, now)).toEqual({ ok: true, retryAfterMs: 0 });
    expect(checkRateLimit("k", RULE, now)).toEqual({ ok: true, retryAfterMs: 0 });
    const throttled = checkRateLimit("k", RULE, now);
    expect(throttled.ok).toBe(false);
    expect(throttled.retryAfterMs).toBe(60_000);
  });

  it("resets after the window passes", () => {
    const now = 1_000_000;
    for (let i = 0; i < 3; i++) checkRateLimit("k", RULE, now);
    expect(checkRateLimit("k", RULE, now).ok).toBe(false);
    expect(checkRateLimit("k", RULE, now + 60_000)).toEqual({ ok: true, retryAfterMs: 0 });
  });

  it("tracks keys independently", () => {
    const now = 1_000_000;
    for (let i = 0; i < 3; i++) checkRateLimit("a", RULE, now);
    expect(checkRateLimit("a", RULE, now).ok).toBe(false);
    expect(checkRateLimit("b", RULE, now).ok).toBe(true);
  });

  it("resetRateLimit clears a single key or everything", () => {
    const now = 1_000_000;
    for (let i = 0; i < 3; i++) {
      checkRateLimit("a", RULE, now);
      checkRateLimit("b", RULE, now);
    }
    resetRateLimit("a");
    expect(checkRateLimit("a", RULE, now).ok).toBe(true);
    expect(checkRateLimit("b", RULE, now).ok).toBe(false);
    resetRateLimit();
    expect(checkRateLimit("b", RULE, now).ok).toBe(true);
  });

  it("ships sane production rules", () => {
    expect(OTP_SEND_RULE).toEqual({ limit: 5, windowMs: 10 * 60 * 1000 });
    expect(BOOKING_RULE).toEqual({ limit: 30, windowMs: 60 * 1000 });
  });
});
