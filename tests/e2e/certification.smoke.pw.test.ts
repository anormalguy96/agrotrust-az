// agrotrust-az/tests/e2e/certification.smoke.pw.test.ts

import { test, expect, type Page } from "@playwright/test";

/**
 * AgroTrust AZ - Certification smoke tests (Playwright)
 *
 * Goal:
 * - Confirm certification-related UI surfaces do not crash rendering.
 * - Keep expectations flexible because the MVP may surface certifications
 *   inside Lots, Lot Details, Overview, or embedded cards rather than
 *   having a dedicated route.
 *
 * Strategy:
 * - Seed mock auth.
 * - Visit the most likely surfaces.
 * - Use soft assertions for optional UI blocks.
 *
 * If your AuthProvider uses different localStorage keys, update constants.
 */

const AUTH_TOKEN_KEY = "agrotrust:auth:token";
const AUTH_USER_KEY = "agrotrust:auth:user";

type DemoRole = "guest" | "farmer" | "buyer" | "admin";

interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: DemoRole;
  organisationId?: string;
  organisationName?: string;
  verifiedEmail?: boolean;
}

const demoUser: DemoUser = {
  id: "USR-0006",
  name: "Demo Admin",
  email: "demo.admin@agrotrust.az",
  role: "admin",
  organisationId: "COOP-0001",
  organisationName: "Demo Cooperative",
  verifiedEmail: true
};

async function seedAuth(page: Page) {
  await page.addInitScript(
    (args: { tokenKey: string; userKey: string; user: DemoUser }) => {
      const { tokenKey, userKey, user } = args;

      try {
        window.localStorage.setItem(tokenKey, "demo-token");
        window.localStorage.setItem(userKey, JSON.stringify(user));
      } catch {
        // ignore
      }
    },
    { tokenKey: AUTH_TOKEN_KEY, userKey: AUTH_USER_KEY, user: demoUser }
  );
}

test.describe("Certification surface smoke (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test("Lots page loads and shows certification signals if present", async ({ page }) => {
    await page.goto("/dashboard/lots");

    const heading = page.getByRole("heading", { name: /lots/i });
    await expect(heading.first()).toBeVisible();

    // Certifications may be surfaced as badges, cards, or text.
    const certText = page.locator("text=/certification|standard|globalg\.a\.p|organic|haccp|iso 22000/i").first();
    await expect.soft(certText).toBeVisible();

    // Optional: badge-like UI
    const badge = page.locator("[data-badge*='cert'], .badge, .cert-badge").first();
    await expect.soft(badge).toBeVisible();
  });

  test("Lot details page renders and certification section (if any) is stable", async ({ page }) => {
    await page.goto("/dashboard/lots/LOT-0001");

    await expect(page).toHaveURL(/\/dashboard\/lots\/.+/);

    const heading = page
      .locator("h1, h2")
      .filter({ hasText: /lot|details|passport|certification|standards/i })
      .first();

    await expect(heading).toBeVisible();

    const certSection = page
      .locator("section, div")
      .filter({ hasText: /certification|standards|globalg\.a\.p|organic|haccp|iso/i })
      .first();

    await expect.soft(certSection).toBeVisible();
  });

  test("Overview page loads and certification KPIs (if implemented) do not break", async ({ page }) => {
    await page.goto("/dashboard");

    const heading = page.getByRole("heading", { name: /overview|dashboard/i });
    await expect(heading.first()).toBeVisible();

    const kpi = page.locator("text=/certified|pending review|verified|rejected/i").first();
    await expect.soft(kpi).toBeVisible();
  });

  test("Settings page does not crash if it references standards", async ({ page }) => {
    await page.goto("/dashboard/settings");

    const heading = page.getByRole("heading", { name: /settings/i });
    await expect(heading.first()).toBeVisible();

    const standardsText = page.locator("text=/standards|certification/i").first();
    await expect.soft(standardsText).toBeVisible();
  });
});

test.describe("Certification surface smoke (unauthenticated)", () => {
  test("Lots route redirects or blocks without token", async ({ page }) => {
    await page.goto("/dashboard/lots");

    const heading = page.getByRole("heading", {
      name: /sign in|forbidden|unauthorised|access/i
    });

    await expect(heading.first()).toBeVisible();
  });
});
