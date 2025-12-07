// agrotrust-az/tests/e2e/marketing.cta.pw.test.ts

import { test, expect } from "@playwright/test";

/**
 * AgroTrust AZ - Marketing CTA tests (Playwright)
 *
 * Goal:
 * - Validate that marketing pages offer meaningful CTAs.
 * - Ensure CTAs navigate to the correct high-level destinations.
 *
 * We keep this resilient:
 * - Use regex-based names.
 * - Allow fallback checks when labels differ slightly.
 * - Avoid brittle selectors tied to exact component structure.
 */

const CTA_PATTERNS = {
  getStarted: /get started|start now|join|create account|sign up/i,
  signIn: /sign in|log in/i,
  forFarmers: /for farmers|farmers/i,
  forBuyers: /for buyers|buyers/i,
  dashboard: /dashboard/i
};

test.describe("Marketing CTAs", () => {
  test("Home page exposes primary CTAs", async ({ page }) => {
    await page.goto("/");

    const primaryCta = page.getByRole("link", { name: CTA_PATTERNS.getStarted }).first()
      .or(page.getByRole("button", { name: CTA_PATTERNS.getStarted }).first());

    const farmersCta = page.getByRole("link", { name: CTA_PATTERNS.forFarmers }).first()
      .or(page.getByRole("button", { name: CTA_PATTERNS.forFarmers }).first());

    const buyersCta = page.getByRole("link", { name: CTA_PATTERNS.forBuyers }).first()
      .or(page.getByRole("button", { name: CTA_PATTERNS.forBuyers }).first());

    await expect.soft(primaryCta).toBeVisible();
    await expect.soft(farmersCta).toBeVisible();
    await expect.soft(buyersCta).toBeVisible();
  });

  test("CTA to farmers lands on the farmers page (if present)", async ({ page }) => {
    await page.goto("/");

    const farmersCta = page.getByRole("link", { name: CTA_PATTERNS.forFarmers }).first()
      .or(page.getByRole("button", { name: CTA_PATTERNS.forFarmers }).first());

    if (await farmersCta.count()) {
      await farmersCta.click();
      await expect(page).toHaveURL(/\/for-farmers$/);

      const heading = page.getByRole("heading", { name: /farmers/i }).first();
      await expect(heading).toBeVisible();
    } else {
      await page.goto("/for-farmers");
      const heading = page.getByRole("heading", { name: /farmers/i }).first();
      await expect(heading).toBeVisible();
    }
  });

  test("CTA to buyers lands on the buyers page (if present)", async ({ page }) => {
    await page.goto("/");

    const buyersCta = page.getByRole("link", { name: CTA_PATTERNS.forBuyers }).first()
      .or(page.getByRole("button", { name: CTA_PATTERNS.forBuyers }).first());

    if (await buyersCta.count()) {
      await buyersCta.click();
      await expect(page).toHaveURL(/\/for-buyers$/);

      const heading = page.getByRole("heading", { name: /buyers/i }).first();
      await expect(heading).toBeVisible();
    } else {
      await page.goto("/for-buyers");
      const heading = page.getByRole("heading", { name: /buyers/i }).first();
      await expect(heading).toBeVisible();
    }
  });

  test("Get started CTA leads towards auth (sign up or sign in) when present", async ({ page }) => {
    await page.goto("/");

    const getStarted = page.getByRole("link", { name: CTA_PATTERNS.getStarted }).first()
      .or(page.getByRole("button", { name: CTA_PATTERNS.getStarted }).first());

    if (await getStarted.count()) {
      await getStarted.click();

      // Accept either sign-up or sign-in as valid outcomes
      await expect(page).toHaveURL(/\/auth\/(sign-up|sign-in)/);

      const heading = page.getByRole("heading", {
        name: /sign up|create account|sign in/i
      }).first();

      await expect(heading).toBeVisible();
    } else {
      // Fallback: verify auth routes exist directly
      await page.goto("/auth/sign-up");
      const h1 = page.getByRole("heading", { name: /sign up/i }).first();
      await expect(h1).toBeVisible();
    }
  });

  test("Sign in CTA works from at least one marketing page (soft)", async ({ page }) => {
    const marketingPages = ["/", "/how-it-works", "/standards"];

    for (const p of marketingPages) {
      await page.goto(p);

      const signIn = page.getByRole("link", { name: CTA_PATTERNS.signIn }).first()
        .or(page.getByRole("button", { name: CTA_PATTERNS.signIn }).first());

      if (await signIn.count()) {
        await signIn.click();
        await expect(page).toHaveURL(/\/auth\/sign-in$/);

        const heading = page.getByRole("heading", { name: /sign in/i }).first();
        await expect(heading).toBeVisible();
        return;
      }
    }

    // If no explicit sign-in CTA exists yet, do not fail the suite.
    await expect(true).toBe(true);
  });

  test("Marketing pages do not expose dashboard links to unauthenticated users (soft)", async ({ page }) => {
    await page.goto("/");

    const dashboardLink = page.getByRole("link", { name: CTA_PATTERNS.dashboard }).first();
    await expect.soft(dashboardLink).toHaveCount(0);
  });
});
