import { describe, expect, it } from "vitest";
import { overlayTranslations } from "@/lib/translate";

describe("overlayTranslations", () => {
  const base = [{ id: "s1", name: "نوار قلب", bio: "پزشک" }];

  it("returns base columns when no overrides exist", () => {
    expect(overlayTranslations("service", base, [], "en", ["name"])).toEqual([
      { id: "s1", name: "نوار قلب", bio: "پزشک" },
    ]);
  });

  it("overlays matching locale+field, leaves others untouched", () => {
    const rows = overlayTranslations("service", base, [
      { entityType: "service", entityId: "s1", locale: "en", field: "name", value: "ECG" },
      { entityType: "service", entityId: "s1", locale: "ar", field: "name", value: "تخطيط القلب" },
    ], "en", ["name"]);
    expect(rows[0].name).toBe("ECG");
    expect(rows[0].bio).toBe("پزشک");
  });

  it("ignores overrides for other entities", () => {
    const rows = overlayTranslations("service", base, [
      { entityType: "provider", entityId: "s1", locale: "en", field: "name", value: "NOPE" },
    ], "en", ["name"]);
    expect(rows[0].name).toBe("نوار قلب");
  });
});