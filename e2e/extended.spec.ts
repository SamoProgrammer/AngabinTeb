import { test, expect } from "@playwright/test";

test.beforeAll(async ({ request }) => {
  const res = await request.post("/api-test/setup");
  expect(res.ok()).toBeTruthy();
});

async function signIn(page: import("@playwright/test").Page, role?: string) {
  const res = await page.request.post(
    role ? `/api-test/login?role=${role}` : "/api-test/login",
  );
  const { token } = await res.json();
  await page.context().addCookies([
    { name: "better-auth.session_token", value: token, url: "http://localhost:3000" },
  ]);
}

test("home care booking requires a serviceable address", async ({ page }) => {
  // Patient session via the Phase 1 test-only helper
  await signIn(page);
  await page.goto("/fa/services");
  await page.getByRole("link", { name: /پرستاری در منزل/ }).first().click();
  await page.getByRole("link", { name: "Book this service" }).click();
  // Slots are seeded for tomorrow (Phase 1 R40) — select the date and a time
  const tomorrow = new Date(Date.now() + 86400_000).toISOString().slice(0, 10);
  await page.locator("#date").fill(tomorrow);
  await page.locator("#date").press("Enter");
  await page.getByRole("button", { name: /^\d{2}:\d{2}$/ }).first().click();
  await page.getByLabel("City").selectOption("3"); // unserviceable
  await page.getByRole("button", { name: "Confirm booking" }).click();
  await expect(page.getByText(/not available in your area/i)).toBeVisible();
});

test("provider portal schedules slots", async ({ page }) => {
  // provider-role session: seed the provider helper from Task 4.5, then set the
  // better-auth.session_token cookie the same way the Phase 1 helper does
  await signIn(page, "provider");
  await page.goto("/fa/provider/schedule");
  await page.getByLabel("Weekday").selectOption("2");
  await page.getByLabel("Start").fill("09:00");
  await page.getByLabel("End").fill("10:00");
  await page.getByRole("button", { name: /Generate/ }).click();
  await expect(page.getByText(/generated/i)).toBeVisible();
});
