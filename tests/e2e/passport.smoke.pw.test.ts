// agrotrust-az/tests/e2e/passport.smoke.pw.test.ts

import { test, expect, type Page } from "@playwright/test";

/**
 * AgroTrust AZ - Passport smoke tests (Playwright)
 *
 * Philosophy:
 * - Keep these tests resilient for hackathon pace.
 * - Avoid hard assumptions about exact button labels or mock data shape.
 * - Seed mock auth to access dashboard routes.
 *
 * These tests primarily validate that:
 * - Lots area is reachable with auth.
 * - A lot details route renders.
 * - Passport-related UI elements, if present, do not crash rendering.
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
  id: "USR-0002",
  name: "Demo Farmer",
  email: "farmer@agrotrust.az",
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

test.describe("Passport surface smoke (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test("Lots page loads and shows a stable layout", async ({ page }) => {
    await page.goto("/dashboard/lots");

    // We keep this flexible: any reasonable page heading is acceptable.
    const heading = page.locator("h1, h2").filter({ hasText: /lots/i }).first();
    await expect(heading).toBeVisible();

    // Table, grid, or cards may be used depending on your implementation.
    const table = page.getByRole("table").first();
    const grid = page.getByRole("grid").first();
    const cards = page.locator("[data-lot-card], .lot-card").first();

    await expect(table.or(grid).or(cards)).toBeVisible();
  });

  test("Lot details route renders (demo id)", async ({ page }) => {
    // The app may load mock lots and support a friendly ID like LOT-0001.
    await page.goto("/dashboard/lots/LOT-0001");

    // Ensure we did not get bounced to auth.
    await expect(page).toHaveURL(/\/dashboard\/lots\/.+/);

    // A broad heading match to avoid brittle coupling.
    const heading = page
      .locator("h1, h2")
      .filter({ hasText: /lot|details|passport/i })
      .first();

    await expect(heading).toBeVisible();

    // Passport UI is desirable but not mandatory for this smoke test.
    // We mark these as soft checks to avoid unnecessary failures
    // if your LotDetails implementation is minimal.
    const passportSection = page
      .locator("section, div")
      .filter({ hasText: /passport|traceability|qr/i })
      .first();

    await expect.soft(passportSection).toBeVisible();

    const qrImg = page.locator('img[alt*="QR" i], img[src*="create-qr-code"]').first();
    await expect.soft(qrImg).toBeVisible();
  });

  test("Passport-related components do not break basic rendering", async ({ page }) => {
    // Some implementations may render passport previews directly on lots page.
    await page.goto("/dashboard/lots");

    // Look for any visible passport keyword in the UI.
    const anyPassportText = page.locator("text=/passport/i").first();
    await expect.soft(anyPassportText).toBeVisible();
  });
});

test.describe("Passport surface smoke (unauthenticated)", () => {
  test("Lot details should redirect or block without token", async ({ page }) => {
    await page.goto("/dashboard/lots/LOT-0001");

    const heading = page.getByRole("heading", {
      name: /sign in|forbidden|unauthorised|access/i
    });

    await expect(heading.first()).toBeVisible();
  });
});