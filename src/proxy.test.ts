import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

function proxyReq(path: string) {
  return new NextRequest(new URL(`http://localhost${path}`));
}

function location(path: string) {
  return proxy(proxyReq(path)).headers.get("location");
}

describe("proxy routing (legacy + bare-link 307s nuked)", () => {
  it("redirects only the site root to the default locale", () => {
    expect(location("/")).toBe("http://localhost/fa");
  });
  it("lets removed legacy paths fall through with no redirect", () => {
    for (const p of [
      "/fa/nutrition/calorie",
      "/fa/nutrition/body",
      "/fa/nutrition/diet",
      "/fa/nutrition/diet/abc",
      "/fa/nutrition",
      "/fa/registry/form/x",
    ]) {
      expect(proxy(proxyReq(p)).headers.get("location")).toBeNull();
    }
  });
  it("lets locale-less paths fall through with no redirect", () => {
    for (const p of ["/diet", "/services", "/profile"]) {
      expect(proxy(proxyReq(p)).headers.get("location")).toBeNull();
    }
  });
  it("passes live routes through with no redirect", () => {
    for (const p of ["/fa/diet", "/fa/profile/diets", "/fa/profile/calorie", "/fa/foods", "/fa/nutrition-knowledge"]) {
      const res = proxy(proxyReq(p));
      expect(res.headers.get("location")).toBeNull();
    }
  });
  it("passes guarded routes through with no redirect", () => {
    for (const p of ["/fa/profile", "/fa/notifications", "/fa/admin", "/fa/support", "/fa/diet/payment", "/fa/diet/check"]) {
      const res = proxy(proxyReq(p));
      expect(res.headers.get("location")).toBeNull();
    }
  });
});
