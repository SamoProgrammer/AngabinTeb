import { test, expect } from "@playwright/test";

test.beforeAll(async ({ request }) => {
  const res = await request.post("/api-test/login");
  expect(res.ok()).toBeTruthy();
  const { token } = await res.json();
  await test.use({ storageState: undefined });
  // token is consumed per-context in each test below via the login route cookie
});

async function signIn(page: import("@playwright/test").Page) {
  const res = await page.request.post("/api-test/login");
  const { token } = await res.json();
  await page.context().addCookies([
    { name: "better-auth.session_token", value: token, url: "http://localhost:3000" },
  ]);
}

test("J-001 find and book a doctor service", async ({ page }) => {
  await signIn(page);
  await page.goto("/fa/search?q=قلب");
  await expect(page.getByRole("link", { name: /ECG|نوار قلب/ }).first()).toBeVisible();
  await page.getByRole("link", { name: /ECG|نوار قلب/ }).first().click();
  await page.getByRole("link", { name: "Book this service" }).click();
  await page.getByRole("button", { name: /^\d{2}:\d{2}$/ }).first().click();
  await page.getByRole("button", { name: /Confirm booking/ }).click();
  await expect(page).toHaveURL(/\/confirm\?id=/);
});

test("J-002 book a diagnostic service with prep visible", async ({ page }) => {
  await page.goto("/fa/services");
  await page.getByRole("link", { name: /ECG|نوار قلب/ }).first().click();
  await expect(page.getByText("Preparation")).toBeVisible();
});