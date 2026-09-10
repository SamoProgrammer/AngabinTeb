export type BookingStatus = "confirmed" | "cancelled" | "completed" | "no_show";

// Capacity and hold enforcement lives in the conditional SQL UPDATE inside
// bookAppointmentWithUser (src/contexts/booking/actions.ts). This module keeps
// only the pure predicates the action actually invokes.

export function canCancel(status: BookingStatus): boolean {
  return status === "confirmed";
}

export function validatePartySize(n: unknown): n is 1 | 2 | 3 | 4 {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 4;
}

// Iran fixed UTC+3:30 since Sep 2022 (no DST) — revisit if the law changes.
const TEHRAN_OFFSET_MS = 3.5 * 3_600_000;

export function tehranDayBounds(now: Date = new Date()): { start: Date; end: Date } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now).split("-").map(Number);
  const start = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]) - TEHRAN_OFFSET_MS);
  return { start, end: new Date(start.getTime() + 86_400_000) };
}