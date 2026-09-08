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