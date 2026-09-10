import { describe, expect, it } from "vitest";
import {
  defaultDashboard,
  isSafeReturn,
  parseLocale,
  safeReturnOrDefault,
  toSignin,
} from "../return";

describe("isSafeReturn", () => {
  it("accepts a same-locale deep link with query", () => {
    expect(isSafeReturn("/fa/diet/check?claim=abc", "fa")).toBe(true);
  });
  it("accepts the locale root", () => {
    expect(isSafeReturn("/fa", "fa")).toBe(true);
  });
  it("rejects cross-locale paths", () => {
    expect(isSafeReturn("/en/profile", "fa")).toBe(false);
  });
  it("rejects the signin loop", () => {
    expect(isSafeReturn("/fa/signin?returnUrl=%2Ffa%2Fprofile", "fa")).toBe(false);
  });
  it("rejects protocol-relative and absolute URLs", () => {
    expect(isSafeReturn("//evil.com/fa/profile", "fa")).toBe(false);
    expect(isSafeReturn("https://evil.com/fa/profile", "fa")).toBe(false);
  });
  it("rejects api-test paths", () => {
    expect(isSafeReturn("/fa/api-test/login", "fa")).toBe(false);
  });
  it("rejects null", () => {
    expect(isSafeReturn(null, "fa")).toBe(false);
  });
});

describe("parseLocale", () => {
  it("parses fa/en/ar prefixes", () => {
    expect(parseLocale("/fa/profile")).toBe("fa");
    expect(parseLocale("/en/diet?x=1")).toBe("en");
    expect(parseLocale("/ar")).toBe("ar");
  });
  it("falls back to fa", () => {
    expect(parseLocale(null)).toBe("fa");
    expect(parseLocale("/profile")).toBe("fa");
  });
});

describe("toSignin / safeReturnOrDefault", () => {
  it("encodes a safe return", () => {
    expect(toSignin("fa", "/fa/diet/check?claim=abc")).toBe(
      "/fa/signin?returnUrl=%2Ffa%2Fdiet%2Fcheck%3Fclaim%3Dabc",
    );
  });
  it("falls back to bare signin for unsafe input", () => {
    expect(toSignin("fa", "https://evil.com")).toBe("/fa/signin");
  });
  it("returns the dashboard default for unsafe input", () => {
    expect(safeReturnOrDefault("//evil.com", "fa")).toBe("/fa/profile/reservations");
    expect(defaultDashboard("en")).toBe("/en/profile/reservations");
  });
  it("encodes account routes outside /profile (notifications)", () => {
    expect(toSignin("fa", "/fa/notifications")).toBe("/fa/signin?returnUrl=%2Ffa%2Fnotifications");
  });
  it("encodes public-page returns (calculator signup, calorie diary)", () => {
    expect(toSignin("fa", "/fa/calculator")).toBe("/fa/signin?returnUrl=%2Ffa%2Fcalculator");
    expect(toSignin("fa", "/fa/profile/calorie")).toBe(
      "/fa/signin?returnUrl=%2Ffa%2Fprofile%2Fcalorie",
    );
  });
});
