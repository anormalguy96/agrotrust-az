// agrotrust-az/tests/e2e/lots.smoke.pw.test.ts

import { test, expect, type Page } from "@playwright/test";

/**
 * AgroTrust AZ - Lots smoke tests (Playwright)
 *
 * Goal:
 * - Confirm lots list and lot details surfaces render with mock auth.
 * - Keep selectors resilient for hackathon iteration.
 *
 * Assumptions:
 * - /dashboard/lots exists.
 * - /dashboard/lots/:lotId exists (expects a friendly mock id like LOT-0001).
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
  id: "USR-0005",
  name: "Demo Farmer",
  email: "demo.farmer@agrotrust.az",
  role: "farmer",
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

test.describe("Lots surface smoke (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test("Lots page loads", async ({ page }) => {
    await page.goto("/dashboard/lots");

    const heading = page.getByRole("heading", { name: /lots/i });
    await expect(heading.first()).toBeVisible();
  });

  test("Lots list renders as table, grid, or cards", async ({ page }) => {
    await page.goto("/dashboard/lots");

    const table = page.getByRole("table").first();
    const grid = page.getByRole("grid").first();
    const cards = page.locator("[data-lot-card], .lot-card").first();

    await expect(table.or(grid).or(cards)).toBeVisible();
  });

  test("Filters surface appears if implemented (soft)", async ({ page }) => {
    await page.goto("/dashboard/lots");

    const filterText = page.locator("text=/filter|category|status|region|certification/i").first();
    await expect.soft(filterText).toBeVisible();

    const anySelect = page.locator("select").first();
    await expect.soft(anySelect).toBeVisible();
  });

  test("Lot details page renders for a demo lot id", async ({ page }) => {
    await page.goto("/dashboard/lots/LOT-0001");

    await expect(page).toHaveURL(/\/dashboard\/lots\/.+/);

    const heading = page
      .locator("h1, h2")
      .filter({ hasText: /lot|details|tomato|hazelnut|persimmon|passport/i })
      .first();

    await expect(heading).toBeVisible();
  });

  test("Passport affordance on lot details exists if implemented (soft)", async ({ page }) => {
    await page.goto("/dashboard/lots/LOT-0001");

    const passportAction = page.getByRole("button", {
      name: /create passport|view passport|passport/i
    }).first();

    const passportText = page.locator("text=/passport|traceability|qr/i").first();

    await expect.soft(passportAction.or(passportText)).toBeVisible();
  });
});

test.describe("Lots surface smoke (unauthenticated)", () => {
  test("Lots route redirects or blocks without token", async ({ page }) => {
    await page.goto("/dashboard/lots");

    const heading = page.getByRole("heading", {
      name: /sign in|forbidden|unauthorised|access/i
    });

    await expect(heading.first()).toBeVisible();
  });

  test("Lot details route redirects or blocks without token", async ({ page }) => {
    await page.goto("/dashboard/lots/LOT-0001");

    const heading = page.getByRole("heading", {
      name: /sign in|forbidden|unauthorised|access/i
    });

    await expect(heading.first()).toBeVisible();
  });
});
