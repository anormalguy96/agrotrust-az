// agrotrust-az/tests/e2e/cooperatives.smoke.pw.test.ts

import { test, expect, type Page } from "@playwright/test";

/**
 * AgroTrust AZ - Cooperatives smoke tests (Playwright)
 *
 * Goal:
 * - Confirm cooperative-related dashboard surfaces render with mock auth.
 * - Keep assertions resilient for hackathon iteration.
 *
 * Assumptions:
 * - /dashboard/cooperatives exists.
 * - Cooperatives may be displayed as a table, grid, or cards.
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
  id: "USR-0008",
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

test.describe("Cooperatives surface smoke (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test("Cooperatives page loads", async ({ page }) => {
    await page.goto("/dashboard/cooperatives");

    const heading = page.getByRole("heading", {
      name: /cooperatives|co-ops|farmer cooperatives/i
    });

    await expect(heading.first()).toBeVisible();
  });

  test("Cooperatives list renders as table, grid, or cards", async ({ page }) => {
    await page.goto("/dashboard/cooperatives");

    const table = page.getByRole("table").first();
    const grid = page.getByRole("grid").first();
    const cards = page.locator("[data-coop-card], .coop-card").first();

    await expect(table.or(grid).or(cards)).toBeVisible();
  });

  test("Filter or search surface appears if implemented (soft)", async ({ page }) => {
    await page.goto("/dashboard/cooperatives");

    const filterText = page.locator(
      "text=/filter|region|verification|members|search/i"
    ).first();

    await expect.soft(filterText).toBeVisible();

    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search" i]'
    ).first();

    await expect.soft(searchInput).toBeVisible();
  });

  test("Cooperative details affordance exists if implemented (soft)", async ({ page }) => {
    await page.goto("/dashboard/cooperatives");

    const viewBtn = page.getByRole("button", {
      name: /view|details|open|profile/i
    }).first();

    const linkRow = page.getByRole("link", {
      name: /cooperative|coop/i
    }).first();

    await expect.soft(viewBtn.or(linkRow)).toBeVisible();
  });
});

test.describe("Cooperatives surface smoke (unauthenticated)", () => {
  test("Cooperatives route redirects or blocks without token", async ({ page }) => {
    await page.goto("/dashboard/cooperatives");

    const heading = page.getByRole("heading", {
      name: /sign in|forbidden|unauthorised|unauthorized|access/i
    });

    await expect(heading.first()).toBeVisible();
  });
});