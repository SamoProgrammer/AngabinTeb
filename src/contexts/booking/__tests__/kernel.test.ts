import { describe, expect, it } from "vitest";
import { canCancel, validatePartySize } from "../kernel";

describe("canCancel", () => {
  it("cancels only confirmed appointments", () => {
    expect(canCancel("confirmed")).toBe(true);
    expect(canCancel("cancelled")).toBe(false);
    expect(canCancel("completed")).toBe(false);
    expect(canCancel("no_show")).toBe(false);
  });
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