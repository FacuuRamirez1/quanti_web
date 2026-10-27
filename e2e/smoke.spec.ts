import { test, expect } from "@playwright/test";

test("la home responde 200 y muestra un h1", async ({ page }: { page: import("@playwright/test").Page }) => {
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1")).toBeVisible();
});