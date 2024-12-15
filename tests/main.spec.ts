import { test, expect } from "@playwright/test";

test("should log in successfully", async ({ page }) => {
  // Go to the login page
  await page.goto("http://localhost:3003/");

  // Fill in the login form
  await page.fill("textarea", "hello");

  // Expect the login to succeed by checking for a logout button
  await expect(page.locator("text=Suggest random question")).toBeVisible();
});
