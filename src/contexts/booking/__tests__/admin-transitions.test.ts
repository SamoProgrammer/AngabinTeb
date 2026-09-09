import { describe, expect, it } from "vitest";
import { canCancel } from "../kernel";

describe("admin transitions", () => {
  it("only confirmed is cancellable", () => {
    expect(canCancel("confirmed")).toBe(true);
    expect(canCancel("completed")).toBe(false);
    expect(canCancel("cancelled")).toBe(false);
    expect(canCancel("no_show")).toBe(false);
  });
});
