export type BookingStatus = "confirmed" | "cancelled" | "completed" | "no_show";

export type SlotView = {
  capacity: number;
  bookedCount: number;
  heldUntil: Date | null;
};

export function holdExpired(slot: Pick<SlotView, "heldUntil">, now: Date): boolean {
  return slot.heldUntil !== null && slot.heldUntil <= now;
}

export function canBook(slot: SlotView, partySize: number, now: Date): boolean {
  if (!holdExpired(slot, now) && slot.heldUntil !== null) return false;
  return slot.bookedCount + partySize <= slot.capacity;
}

export function canCancel(status: BookingStatus): boolean {
  return status === "confirmed";
}

export function reschedulePlan(
  slot: SlotView,
  partySize: number,
  now: Date,
): { ok: true } | { ok: false; reason: "capacity" | "held" } {
  if (!holdExpired(slot, now) && slot.heldUntil !== null) return { ok: false, reason: "held" };
  if (slot.bookedCount + partySize > slot.capacity) return { ok: false, reason: "capacity" };
  return { ok: true };
}

export function validatePartySize(n: unknown): n is 1 | 2 | 3 | 4 {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 4;
}