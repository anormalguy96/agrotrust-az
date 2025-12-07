// agrotrust-az/tests/e2e/contracts.smoke.pw.test.ts

import { test, expect, type Page } from "@playwright/test";

/**
 * AgroTrust AZ - Contracts smoke tests (Playwright)
 *
 * Goal:
 * - Confirm contract-related dashboard surfaces render with mock auth.
 * - Keep assertions resilient for hackathon iteration.
 *
 * Assumptions:
 * - /dashboard/contracts exists.
 * - Contracts may be displayed as a table, grid, or cards.
 * - Escrow widgets may be embedded here, but are optional for smoke level.
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
  id: "USR-0007",
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

test.describe("Contracts surface smoke (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test("Contracts page loads", async ({ page }) => {
    await page.goto("/dashboard/contracts");

    const heading = page.getByRole("heading", { name: /contracts/i });
    await expect(heading.first()).toBeVisible();
  });

  test("Contracts list renders as table, grid, or cards", async ({ page }) => {
    await page.goto("/dashboard/contracts");

    const table = page.getByRole("table").first();
    const grid = page.getByRole("grid").first();
    const cards = page.locator("[data-contract-card], .contract-card").first();

    await expect(table.or(grid).or(cards)).toBeVisible();
  });

  test("Contract status badges or labels appear if implemented (soft)", async ({ page }) => {
    await page.goto("/dashboard/contracts");

    const statusText = page.locator(
      "text=/draft|signed|in fulfilment|in fulfillment|completed|terminated/i"
    ).first();

    await expect.soft(statusText).toBeVisible();

    const badge = page.locator("[data-badge], .badge").first();
    await expect.soft(badge).toBeVisible();
  });

  test("Escrow surfaces inside Contracts do not break rendering (soft)", async ({ page }) => {
    await page.goto("/dashboard/contracts");

    const escrowText = page.locator("text=/escrow/i").first();
    await expect.soft(escrowText).toBeVisible();

    const statusBlock = page
      .locator("[data-escrow-status], .escrow-status")
      .first();
    await expect.soft(statusBlock).toBeVisible();

    const timelineBlock = page
      .locator("[data-escrow-timeline], .escrow-timeline")
      .first();
    await expect.soft(timelineBlock).toBeVisible();
  });

  test("A path to create or view contract details exists if implemented (soft)", async ({ page }) => {
    await page.goto("/dashboard/contracts");

    const actionBtn = page.getByRole("button", {
      name: /create contract|new contract|view|details|open/i
    }).first();

    await expect.soft(actionBtn).toBeVisible();
  });
});

test.describe("Contracts surface smoke (unauthenticated)", () => {
  test("Contracts route redirects or blocks without token", async ({ page }) => {
    await page.goto("/dashboard/contracts");

    const heading = page.getByRole("heading", {
      name: /sign in|forbidden|unauthorised|unauthorized|access/i
    });

    await expect(heading.first()).toBeVisible();
  });
});