// agrotrust-az/tests/e2e/overview.smoke.pw.test.ts

import { test, expect, type Page } from "@playwright/test";

/**
 * AgroTrust AZ - Overview smoke tests (Playwright)
 *
 * Goal:
 * - Confirm the dashboard overview renders with mock auth.
 * - Validate that high-level KPI/summary blocks do not crash.
 * - Keep assertions flexible for rapid MVP iteration.
 *
 * Assumptions:
 * - /dashboard is the overview route.
 * - The overview may show cards for lots, certifications, RFQs, and escrow.
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
  id: "USR-0011",
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

test.describe("Overview smoke (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test("Dashboard overview loads", async ({ page }) => {
    await page.goto("/dashboard");

    const heading = page.getByRole("heading", {
      name: /overview|dashboard/i
    });

    await expect(heading.first()).toBeVisible();
  });

  test("Summary surfaces (lots, certifications, RFQs, escrow) are stable (soft)", async ({ page }) => {
    await page.goto("/dashboard");

    // These are intentionally broad to avoid brittle coupling.
    const lotsKpi = page.locator("text=/lots|batches/i").first();
    const certKpi = page.locator("text=/certification|standards|verified|pending review/i").first();
    const rfqKpi = page.locator("text=/rfq|requests for quotation|offers/i").first();
    const escrowKpi = page.locator("text=/escrow|funded|released|inspection/i").first();

    await expect.soft(lotsKpi).toBeVisible();
    await expect.soft(certKpi).toBeVisible();
    await expect.soft(rfqKpi).toBeVisible();
    await expect.soft(escrowKpi).toBeVisible();
  });

  test("Quick navigation links or cards exist (soft)", async ({ page }) => {
    await page.goto("/dashboard");

    const lotsLink = page.getByRole("link", { name: /lots/i }).first();
    const rfqLink = page.getByRole("link", { name: /rfq|requests/i }).first();
    const contractsLink = page.getByRole("link", { name: /contracts/i }).first();
    const settingsLink = page.getByRole("link", { name: /settings/i }).first();

    await expect.soft(lotsLink).toBeVisible();
    await expect.soft(rfqLink).toBeVisible();
    await expect.soft(contractsLink).toBeVisible();
    await expect.soft(settingsLink).toBeVisible();
  });
});

test.describe("Overview smoke (unauthenticated)", () => {
  test("Dashboard overview redirects or blocks without token", async ({ page }) => {
    await page.goto("/dashboard");

    const heading = page.getByRole("heading", {
      name: /sign in|forbidden|unauthorised|unauthorized|access/i
    });

    await expect(heading.first()).toBeVisible();
  });
});