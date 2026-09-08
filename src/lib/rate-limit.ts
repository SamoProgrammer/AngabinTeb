import "server-only";
// ponytail: fixed-window in-memory limiter. Ceiling: single server instance
// only — counters reset on restart/deploy and are not shared across
// instances. Move to Postgres (or Redis) when horizontally scaled.

export interface RateLimitRule {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  /** Ms until the window resets; 0 when allowed. */
  retryAfterMs: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  rule: RateLimitRule,
  now: number = Date.now(),
): RateLimitResult {
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return { ok: true, retryAfterMs: 0 };
  }
  if (bucket.count < rule.limit) {
    bucket.count += 1;
    return { ok: true, retryAfterMs: 0 };
  }
  return { ok: false, retryAfterMs: bucket.resetAt - now };
}

/** Clear one key, or everything when omitted. Tests and admin escape hatch. */
export function resetRateLimit(key?: string): void {
  if (key === undefined) buckets.clear();
  else buckets.delete(key);
}

/** Max 5 OTP sends per phone number per 10 minutes (SMS cost protection). */
export const OTP_SEND_RULE: RateLimitRule = { limit: 5, windowMs: 10 * 60 * 1000 };

/** Max 30 booking attempts per user per minute (abuse guard, generous for real use). */
export const BOOKING_RULE: RateLimitRule = { limit: 30, windowMs: 60 * 1000 };
