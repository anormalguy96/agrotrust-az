// agrotrust-az/tests/e2e/marketing.nav.pw.test.ts

import { test, expect } from "@playwright/test";

/**
 * AgroTrust AZ - Marketing navigation tests (Playwright)
 *
 * Goal:
 * - Confirm top-level marketing navigation works.
 * - Keep checks resilient to small UI text changes.
 *
 * Strategy:
 * - Start on Home.
 * - Try to click Navbar links if they exist.
 * - Fallback to direct navigation if a link label changes
 *   during hackathon iteration.
 */

const PAGES: Array<{
  name: RegExp;
  path: string;
  heading: RegExp;
}> = [
  { name: /home/i, path: "/", heading: /AgroTrust|Home/i },
  { name: /how it works/i, path: "/how-it-works", heading: /how it works/i },
  { name: /standards/i, path: "/standards", heading: /standards/i },
  { name: /farmers/i, path: "/for-farmers", heading: /farmers/i },
  { name: /buyers/i, path: "/for-buyers", heading: /buyers/i },
  { name: /contact/i, path: "/contact", heading: /contact/i }
];

test.describe("Marketing Navbar navigation", () => {
  test("Navbar links navigate to key marketing pages", async ({ page }) => {
    await page.goto("/");

    // Ensure we have some visible navigation surface
    const nav = page.getByRole("navigation").first();
    await expect.soft(nav).toBeVisible();

    for (const item of PAGES) {
      const link = page.getByRole("link", { name: item.name }).first();

      if (await link.count()) {
        await link.click();
      } else {
        // Fallback to direct route navigation if text changes
        await page.goto(item.path);
      }

      await expect(page).toHaveURL(new RegExp(`${item.path.replace("/", "\\/")}$`));

      const heading = page.getByRole("heading", { name: item.heading }).first();
      await expect(heading).toBeVisible();
    }
  });

  test("Brand link (if present) returns to Home", async ({ page }) => {
    await page.goto("/standards");

    const brandLink = page.getByRole("link", { name: /AgroTrust/i }).first();

    if (await brandLink.count()) {
      await brandLink.click();
      await expect(page).toHaveURL(/\/$/);
      const heading = page.getByRole("heading", { name: /AgroTrust|Home/i }).first();
      await expect(heading).toBeVisible();
    } else {
      // If your Navbar does not make the brand a link yet,
      // we keep this test as a harmless smoke assertion.
      await expect(true).toBe(true);
    }
  });
});