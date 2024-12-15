import { test, expect } from "@playwright/test";

test("submit question should work", async ({ page }) => {
  // Go to the login page
  await page.goto("http://localhost:3003/");

  // Fill in the login form
  await page.fill("textarea", "hello");
  await page.keyboard.press("Enter");

  // Check that at least one fadeout-text element exists
  await expect(page.locator(".fadeout-text").first()).toBeVisible();
});
