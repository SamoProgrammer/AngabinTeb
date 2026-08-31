import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/translate", () => ({ overlayTranslations: (_entityType: string, rows: unknown[]) => rows }));

import { searchAll } from "../queries";

describe("searchAll", () => {
  it("returns an empty array for a blank term without touching the DB", async () => {
    const results = await searchAll("   ", "fa");
    expect(results).toEqual([]);
  });
});