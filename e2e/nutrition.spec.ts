import { test, expect } from "@playwright/test";

test.beforeAll(async ({ request }) => {
  const res = await request.post("/api-test/setup");
  expect(res.ok()).toBeTruthy();
});

// Same patient-session pattern as e2e/journeys.spec.ts (no OTP path in Playwright).
async function signIn(page: import("@playwright/test").Page) {
  const res = await page.request.post("/api-test/login");
  const { token } = await res.json();
  await page.context().addCookies([
    { name: "better-auth.session_token", value: token, url: "http://localhost:3000" },
  ]);
}

// Public diet wizard: type → program → org. Stops before claim/payment (needs auth).
// Needs seeded diet programs (bun run db:seed:nutrition); /api-test/setup only seeds slots.
test("J-004 diet wizard public steps", async ({ page }) => {
  await page.goto("/fa/diet");
  const step1 = page.locator('section[aria-label="WizardStep1"]');
  await expect(step1).toBeVisible();
  await step1.locator("a").first().click();
  const step2 = page.locator('section[aria-label="WizardStep2"]');
  await expect(step2).toBeVisible();
  await step2.locator('a[aria-label="SelectProgram"]').first().click();
  const step3 = page.locator('section[aria-label="WizardStep3"]');
  await expect(step3).toBeVisible();
  await step3.locator('a[aria-label^="Org-"]').first().click();
  await expect(page.getByRole("button", { name: "ConfirmClaim" })).toBeVisible();
});

// NOTE (manual-only): admin approval of a paid claim + AI program generation needs an
// admin session and a live AI key — not covered here, verify by hand (R10).
test("J-006 guests bounce from profile nutrition pages to signin", async ({ page }) => {
  await page.goto("/fa/profile/diets");
  await expect(page).toHaveURL(/\/signin/);
  await page.goto("/fa/profile/calorie");
  await expect(page).toHaveURL(/\/signin/);
});

test("J-007 signed-in profile diets + calorie smoke", async ({ page }) => {
  await signIn(page);
  await page.goto("/fa/profile/diets");
  await expect(page.getByRole("heading").first()).toBeVisible();
  await page.goto("/fa/profile/calorie");
  await expect(page.getByRole("heading").first()).toBeVisible();
});

test("J-008 calculator smoke (public)", async ({ page }) => {
  await page.goto("/fa/calculator");
  await expect(page.locator("#metabolism-widget")).toBeVisible();
});
