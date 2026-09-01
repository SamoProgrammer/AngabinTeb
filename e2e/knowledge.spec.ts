import { test, expect } from "@playwright/test";

test("J-005 learn about a health issue", async ({ page }) => {
  await page.goto("/fa/topics/diabetes");
  await expect(page.getByRole("heading", { name: /دیابت/ })).toBeVisible();
  await page.getByRole("link", { name: /دیابت/ }).first().click();
  await expect(page.getByRole("main")).toContainText(/دیابت/);
  await page.goto("/fa/search?q=قلب");
  await expect(page.getByRole("link", { name: /ECG|نوار قلب/ }).first()).toBeVisible();
});