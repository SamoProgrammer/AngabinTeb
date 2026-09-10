import { describe, it, expect } from "vitest";
import { parseListParams, paginate, PAGE_SIZE } from "../list-params";

describe("parseListParams", () => {
  const tabs = ["all", "open", "closed"] as const;
  it("normalizes q, page, and a known tab", () => {
    expect(parseListParams({ q: "  Ali ", page: "2", tab: "open" }, { tabs, defaultTab: "all" }))
      .toEqual({ q: "ali", page: 2, tab: "open" });
  });
  it("falls back to defaults on garbage", () => {
    expect(parseListParams({ page: "abc", tab: "nope" }, { tabs, defaultTab: "all" }))
      .toEqual({ q: "", page: 1, tab: "all" });
  });
  it("clamps page minimum to 1 and reads first array value", () => {
    expect(parseListParams({ page: ["-3"] }, { tabs, defaultTab: "all" }).page).toBe(1);
  });
});

describe("paginate", () => {
  it("slices the requested page and reports totals", () => {
    const rows = Array.from({ length: 45 }, (_, i) => i);
    expect(paginate(rows, 2, 20)).toEqual({ items: rows.slice(20, 40), totalPages: 3, total: 45 });
  });
  it("defaults to PAGE_SIZE of 20", () => {
    expect(PAGE_SIZE).toBe(20);
  });
});
