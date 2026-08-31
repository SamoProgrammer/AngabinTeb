import { test, expect } from "@playwright/test";

test.beforeAll(async ({ request }) => {
  const res = await request.post("/api-test/login");
  expect(res.ok()).toBeTruthy();
});

test("concurrent booking cannot double-book a capacity-1 slot", async ({ page }) => {
  const resp = await Promise.all([
    page.request.post("/api-test/book", { data: { slotId: process.env.TEST_SLOT_ID ?? "slot-test-2" } }),
    page.request.post("/api-test/book", { data: { slotId: process.env.TEST_SLOT_ID ?? "slot-test-2" } }),
  ]);
  const statuses = (await Promise.all(resp.map((r) => r.json()))).map((r) => r.ok);
  expect(statuses.filter(Boolean).length).toBe(1);
});