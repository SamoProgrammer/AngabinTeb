import { describe, expect, it } from "vitest";
import { nextPaymentState } from "../kernel";

describe("nextPaymentState", () => {
  it("pays a pending booking", () => {
    expect(nextPaymentState("pending", true)).toBe("paid_online");
  });
  it("keeps pending on gateway failure", () => {
    expect(nextPaymentState("pending", false)).toBe("pending");
  });
  it("never overwrites an existing paid state", () => {
    expect(nextPaymentState("paid_online", true)).toBe("paid_online");
  });
});