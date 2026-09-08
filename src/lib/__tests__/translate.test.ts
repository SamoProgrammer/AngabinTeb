import { describe, expect, it, vi } from "vitest";
import type { db } from "@/db";

vi.mock("server-only", () => ({}));

import { localizedRows } from "@/lib/translate";

// Seam: fake the query client so fabricated override rows exercise the
// entity-type scoping with no database involved.
function fakeDb(overrides: unknown[]) {
  return {
    select: () => ({ from: () => ({ where: async () => overrides }) }),
  } as unknown as typeof db;
}

describe("localizedRows", () => {
  const base = [{ id: "s1", name: "نوار قلب", bio: "پزشک" }];

  it("returns base columns when no overrides exist", async () => {
    await expect(localizedRows("service", base, "en", ["name"], fakeDb([]))).resolves.toEqual([
      { id: "s1", name: "نوار قلب", bio: "پزشک" },
    ]);
  });

  it("overlays matching locale+field, leaves others untouched", async () => {
    const rows = await localizedRows("service", base, "en", ["name"], fakeDb([
      { entityType: "service", entityId: "s1", locale: "en", field: "name", value: "ECG" },
      { entityType: "service", entityId: "s1", locale: "ar", field: "name", value: "تخطيط القلب" },
    ]));
    expect(rows[0].name).toBe("ECG");
    expect(rows[0].bio).toBe("پزشک");
  });

  it("ignores overrides for other entity types sharing the id", async () => {
    const rows = await localizedRows("service", base, "en", ["name"], fakeDb([
      { entityType: "provider", entityId: "s1", locale: "en", field: "name", value: "NOPE" },
    ]));
    expect(rows[0].name).toBe("نوار قلب");
  });
});
