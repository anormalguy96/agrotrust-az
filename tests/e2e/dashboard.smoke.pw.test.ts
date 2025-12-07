// agrotrust-az/tests/e2e/dashboard.smoke.pw.test.ts

import { test, expect, type Page } from "@playwright/test";

/**
 * AgroTrust AZ - Dashboard smoke tests (Playwright)
 *
 * We assume a mock-auth approach in the MVP.
 * To avoid brittle coupling with internal AuthProvider logic,
 * we seed a demo token and a lightweight demo user in localStorage.
 *
 * If your AuthProvider uses different keys, update these constants.
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
  id: "USR-0001",
  name: "Demo Admin",
  email: "demo@agrotrust.az",
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

test.describe("Dashboard smoke (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test("Dashboard overview loads", async ({ page }) => {
    await page.goto("/dashboard");
    const heading = page.getByRole("heading", { name: /overview|dashboard/i });
    await expect(heading.first()).toBeVisible();
  });

  test("Lots page loads", async ({ page }) => {
    await page.goto("/dashboard/lots");

    const heading = page.getByRole("heading", { name: /lots/i });
    await expect(heading.first()).toBeVisible();

    // Soft check: table or grid exists
    const table = page.getByRole("table").first();
    const grid = page.getByRole("grid").first();

    // One of these should exist depending on your implementation
    await expect(table.or(grid)).toBeVisible();
  });

  test("Cooperatives page loads", async ({ page }) => {
    await page.goto("/dashboard/cooperatives");
    const heading = page.getByRole("heading", { name: /cooperatives|co-ops/i });
    await expect(heading.first()).toBeVisible();
  });

  test("Buyers page loads", async ({ page }) => {
    await page.goto("/dashboard/buyers");
    const heading = page.getByRole("heading", { name: /buyers/i });
    await expect(heading.first()).toBeVisible();
  });

  test("RFQs page loads", async ({ page }) => {
    await page.goto("/dashboard/rfqs");
    const heading = page.getByRole("heading", {
      name: /rfq|requests for quotation/i
    });
    await expect(heading.first()).toBeVisible();
  });

  test("Contracts page loads", async ({ page }) => {
    await page.goto("/dashboard/contracts");
    const heading = page.getByRole("heading", { name: /contracts/i });
    await expect(heading.first()).toBeVisible();
  });

  test("Settings page loads", async ({ page }) => {
    await page.goto("/dashboard/settings");
    const heading = page.getByRole("heading", { name: /settings/i });
    await expect(heading.first()).toBeVisible();
  });
});

test.describe("Dashboard smoke (unauthenticated)", () => {
  test("Dashboard blocks or redirects when no token is present", async ({ page }) => {
    await page.goto("/dashboard");

    const heading = page.getByRole("heading", {
      name: /sign in|forbidden|unauthorised|access/i
    });

    await expect(heading.first()).toBeVisible();
  });
});
