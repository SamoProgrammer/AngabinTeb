import { describe, expect, it } from "vitest";
import { isServiceable } from "../address";

describe("isServiceable", () => {
  it("serves listed cities", () => {
    expect(isServiceable(["1", "2"], "1")).toBe(true);
  });
  it("rejects unlisted cities", () => {
    expect(isServiceable(["1", "2"], "3")).toBe(false);
  });
  it("rejects an empty service area", () => {
    expect(isServiceable([], "1")).toBe(false);
  });
});