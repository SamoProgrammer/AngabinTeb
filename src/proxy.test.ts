import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

function proxyReq(path: string) {
  return new NextRequest(new URL(`http://localhost${path}`));
}

function location(path: string) {
  return proxy(proxyReq(path)).headers.get("location");
}

describe("proxy legacy nutrition/registry 307s", () => {
  it("maps /fa/nutrition/calorie* to /fa/profile/calorie* (remainder kept)", () => {
    expect(location("/fa/nutrition/calorie")).toBe("http://localhost/fa/profile/calorie");
    expect(location("/fa/nutrition/calorie/abc")).toBe("http://localhost/fa/profile/calorie/abc");
  });
  it("maps /fa/nutrition/body to /fa/profile/body", () => {
    expect(location("/fa/nutrition/body")).toBe("http://localhost/fa/profile/body");
  });
  it("maps /fa/nutrition/diet to the /fa/diet wizard entry", () => {
    expect(location("/fa/nutrition/diet")).toBe("http://localhost/fa/diet");
  });
  it("maps /fa/nutrition/diet/:id to the /fa/profile/diets list", () => {
    expect(location("/fa/nutrition/diet/abc")).toBe("http://localhost/fa/profile/diets");
  });
  it("maps /fa/registry/form/* and bare /fa/registry to /fa/profile/clinical", () => {
    expect(location("/fa/registry/form/x")).toBe("http://localhost/fa/profile/clinical");
    expect(location("/fa/registry")).toBe("http://localhost/fa/profile/clinical");
  });
  it("maps /fa/nutrition to /fa/profile", () => {
    expect(location("/fa/nutrition")).toBe("http://localhost/fa/profile");
  });
  it("preserves searchParams and uses 307", () => {
    const res = proxy(proxyReq("/fa/nutrition/calorie/abc?calc=1"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/fa/profile/calorie/abc?calc=1");
  });
  it("passes live routes through with no redirect", () => {
    for (const p of ["/fa/diet", "/fa/profile/diets", "/fa/profile/calorie", "/fa/foods", "/fa/nutrition-knowledge"]) {
      const res = proxy(proxyReq(p));
      expect(res.headers.get("location")).toBeNull();
    }
  });
});
