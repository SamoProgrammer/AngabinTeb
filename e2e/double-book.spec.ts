import { test, expect } from "@playwright/test";

let slotId2 = "slot-test-2";
test.beforeAll(async ({ request }) => {
  const login = await request.post("/api-test/login");
  expect(login.ok()).toBeTruthy();
  const setup = await request.post("/api-test/setup");
  expect(setup.ok()).toBeTruthy();
  slotId2 = (await setup.json()).slotId2;
});

test("concurrent booking cannot double-book a capacity-1 slot", async ({ page }) => {
  const slotId = process.env.TEST_SLOT_ID ?? slotId2;
  const resp = await Promise.all([
    page.request.post("/api-test/book", { data: { slotId } }),
    page.request.post("/api-test/book", { data: { slotId } }),
  ]);
  const statuses = (await Promise.all(resp.map((r) => r.json()))).map((r) => r.ok);
  expect(statuses.filter(Boolean).length).toBe(1);
});