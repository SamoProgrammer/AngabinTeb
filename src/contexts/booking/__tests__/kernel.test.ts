import { describe, expect, it } from "vitest";
import { canBook, holdExpired, canCancel, reschedulePlan, validatePartySize } from "../kernel";

const now = new Date("2026-09-01T10:00:00Z");
const freeSlot = { capacity: 2, bookedCount: 1, heldUntil: null };
const heldSlot = { capacity: 2, bookedCount: 1, heldUntil: new Date("2026-09-01T10:10:00Z") };

describe("canBook", () => {
  it("accepts a party that fits", () => {
    expect(canBook(freeSlot, 1, now)).toBe(true);
  });
  it("rejects a party exceeding capacity", () => {
    expect(canBook(freeSlot, 2, now)).toBe(false);
  });
  it("rejects an active hold by someone else", () => {
    expect(canBook(heldSlot, 1, now)).toBe(false);
  });
  it("accepts an expired hold", () => {
    expect(canBook({ ...heldSlot, heldUntil: new Date("2026-09-01T09:00:00Z") }, 1, now)).toBe(true);
  });
});

describe("holdExpired", () => {
  it("treats null holds as not held", () => expect(holdExpired({ heldUntil: null }, now)).toBe(false));
  it("expires past holds", () => expect(holdExpired({ heldUntil: new Date("2026-09-01T09:00:00Z") }, now)).toBe(true));
});

describe("canCancel", () => {
  it("cancels only confirmed appointments", () => {
    expect(canCancel("confirmed")).toBe(true);
    expect(canCancel("cancelled")).toBe(false);
    expect(canCancel("completed")).toBe(false);
    expect(canCancel("no_show")).toBe(false);
  });
});

describe("reschedulePlan", () => {
  it("succeeds when capacity remains", () => expect(reschedulePlan(freeSlot, 1, now)).toEqual({ ok: true }));
  it("fails on capacity", () => expect(reschedulePlan(freeSlot, 2, now)).toEqual({ ok: false, reason: "capacity" }));
  it("fails on an active hold", () => expect(reschedulePlan(heldSlot, 1, now)).toEqual({ ok: false, reason: "held" }));
});

describe("validatePartySize", () => {
  it("accepts 1-4 and rejects everything else", () => {
    expect(validatePartySize(1)).toBe(true);
    expect(validatePartySize(4)).toBe(true);
    expect(validatePartySize(0)).toBe(false);
    expect(validatePartySize(5)).toBe(false);
    expect(validatePartySize("3")).toBe(false);
  });
});