import { test, expect } from "@playwright/test";

test("concurrent booking cannot double-book a capacity-1 slot", async ({ page }) => {
  const resp = await Promise.all([
    page.request.post("/api-test/book", { data: { slotId: process.env.TEST_SLOT_ID ?? "slot-test-1" } }),
    page.request.post("/api-test/book", { data: { slotId: process.env.TEST_SLOT_ID ?? "slot-test-1" } }),
  ]);
  const statuses = (await Promise.all(resp.map((r) => r.json()))).map((r) => r.ok);
  expect(statuses.filter(Boolean).length).toBe(1);
});