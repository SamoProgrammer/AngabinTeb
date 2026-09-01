import { test, expect } from "@playwright/test";

test.beforeAll(async ({ request }) => {
  const res = await request.post("/api-test/setup");
  expect(res.ok()).toBeTruthy();
});

test("J-004 analyze food intake", async ({ page }) => {
  // Patient session via the Phase 1 test-only helper (no OTP path in Playwright)
  const res = await page.request.post("/api-test/login");
  const { token } = await res.json();
  await page.context().addCookies([
    { name: "better-auth.session_token", value: token, url: "http://localhost:3000" },
  ]);
  await page.goto("/fa/diary");
  await page.getByLabel("Food").selectOption({ label: "آش رشته" });
  await page.getByLabel("Serving").selectOption({ label: "بشقاب" });
  await page.getByLabel("Quantity").fill("1");
  await page.getByRole("button", { name: "Log intake" }).click();
  await expect(page.getByText(/276/)).toBeVisible(); // energy kcal for one plate
});