import { describe, expect, it } from "vitest";
import { initialDispatchStatus } from "../ambulance";

describe("initialDispatchStatus", () => {
  it("starts scheduled", () => {
    expect(initialDispatchStatus("confirmed")).toBe("scheduled");
  });
});