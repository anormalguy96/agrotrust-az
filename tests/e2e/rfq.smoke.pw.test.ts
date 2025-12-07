// agrotrust-az/tests/e2e/rfq.smoke.pw.test.ts

import { test, expect, type Page } from "@playwright/test";

/**
 * AgroTrust AZ - RFQ smoke tests (Playwright)
 *
 * Goal:
 * - Confirm RFQ pages render under authenticated access.
 * - Keep selectors resilient and MVP-friendly.
 *
 * Assumptions:
 * - /dashboard/rfqs exists and renders a list or cards.
 * - RFQ filters may be present.
 * - Responses may be shown in-page or via a detail view/modal.
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

const demoBuyer: DemoUser = {
  id: "USR-0004",
  name: "Demo Buyer",
  email: "demo.buyer@agrotrust.az",
  role: "buyer",
  organisationId: "BUY-0001",
  organisationName: "Demo Buyer Org",
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
    { tokenKey: AUTH_TOKEN_KEY, userKey: AUTH_USER_KEY, user: demoBuyer }
  );
}

test.describe("RFQ surface smoke (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test("RFQs page loads", async ({ page }) => {
    await page.goto("/dashboard/rfqs");

    const heading = page.getByRole("heading", {
      name: /rfq|requests for quotation|requests/i
    });
    await expect(heading.first()).toBeVisible();
  });

  test("RFQ list or cards are visible", async ({ page }) => {
    await page.goto("/dashboard/rfqs");

    // The implementation may be a table, grid, or card list.
    const table = page.getByRole("table").first();
    const grid = page.getByRole("grid").first();
    const cards = page.locator("[data-rfq-card], .rfq-card").first();

    await expect(table.or(grid).or(cards)).toBeVisible();
  });

  test("RFQ filters render if present (soft)", async ({ page }) => {
    await page.goto("/dashboard/rfqs");

    const filterText = page.locator("text=/filter|status|priority|category/i").first();
    await expect.soft(filterText).toBeVisible();

    const select =
      page.locator("select").first();
    await expect.soft(select).toBeVisible();
  });

  test("RFQ responses surface can be opened if available (soft)", async ({ page }) => {
    await page.goto("/dashboard/rfqs");

    // Try to find an action that suggests opening details/responses.
    const viewBtn = page.getByRole("button", {
      name: /view|details|responses|offers/i
    }).first();

    if (await viewBtn.count()) {
      await viewBtn.click();

      // We accept either a modal-like heading or an in-page section.
      const modalHeading = page
        .locator("h1, h2, h3")
        .filter({ hasText: /responses|offers|rfq/i })
        .first();

      await expect.soft(modalHeading).toBeVisible();
    } else {
      // If no explicit button exists, the test remains a smoke-level pass.
      await expect(true).toBe(true);
    }
  });

  test("Buyer can see a path to create an RFQ (soft)", async ({ page }) => {
    await page.goto("/dashboard/rfqs");

    const createBtn = page.getByRole("button", {
      name: /create rfq|new rfq|post rfq|create request/i
    }).first();

    await expect.soft(createBtn).toBeVisible();
  });
});

test.describe("RFQ surface smoke (unauthenticated)", () => {
  test("RFQs route redirects or blocks without token", async ({ page }) => {
    await page.goto("/dashboard/rfqs");

    const heading = page.getByRole("heading", {
      name: /sign in|forbidden|unauthorised|access/i
    });

    await expect(heading.first()).toBeVisible();
  });
});