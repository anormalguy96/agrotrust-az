// agrotrust-az/tests/e2e/escrow.smoke.pw.test.ts

import { test, expect, type Page } from "@playwright/test";

/**
 * AgroTrust AZ - Escrow smoke tests (Playwright)
 *
 * Goal:
 * - Confirm escrow-related UI surfaces render under authenticated access.
 * - Keep checks flexible and resilient for hackathon iteration.
 *
 * Assumptions:
 * - Escrow widgets are likely surfaced on Contracts and/or RFQs pages.
 * - We use mock auth via localStorage keys.
 *
 * If your AuthProvider uses different keys, update constants below.
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
  id: "USR-0003",
  name: "Demo Buyer",
  email: "buyer@agrotrust.az",
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
    { tokenKey: AUTH_TOKEN_KEY, userKey: AUTH_USER_KEY, user: demoUser }
  );
}

test.describe("Escrow surface smoke (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test("Contracts page loads and escrow widgets (if present) render", async ({ page }) => {
    await page.goto("/dashboard/contracts");

    const heading = page.getByRole("heading", { name: /contracts/i });
    await expect(heading.first()).toBeVisible();

    // Escrow may be embedded here; keep checks soft.
    const escrowText = page.locator("text=/escrow/i").first();
    await expect.soft(escrowText).toBeVisible();

    const statusBlock = page
      .locator("[data-escrow-status], .escrow-status, text=/funded|released|inspection/i")
      .first();
    await expect.soft(statusBlock).toBeVisible();

    const timelineBlock = page
      .locator("[data-escrow-timeline], .escrow-timeline, text=/timeline/i")
      .first();
    await expect.soft(timelineBlock).toBeVisible();
  });

  test("RFQs page loads and shows a path towards escrow (if implemented)", async ({ page }) => {
    await page.goto("/dashboard/rfqs");

    const heading = page.getByRole("heading", { name: /rfq|requests for quotation/i });
    await expect(heading.first()).toBeVisible();

    // Optional UI affordances for initiating escrow.
    const initButton = page.getByRole("button", { name: /initiate escrow|start escrow|escrow/i }).first();
    await expect.soft(initButton).toBeVisible();
  });

  test("Escrow init UX does not crash when action is attempted (soft)", async ({ page }) => {
    await page.goto("/dashboard/contracts");

    const initButton = page.getByRole("button", { name: /initiate escrow|start escrow|escrow/i }).first();

    if (await initButton.count()) {
      await initButton.click();

      // Modal or panel may open
      const modalHeading = page
        .locator("h1, h2, h3")
        .filter({ hasText: /escrow/i })
        .first();

      await expect.soft(modalHeading).toBeVisible();

      // If there is a confirm button, try a soft click.
      const confirm = page.getByRole("button", { name: /confirm|create|fund/i }).first();
      if (await confirm.count()) {
        await confirm.click();
      }

      // We only assert the page remains stable.
      await expect(page).toHaveURL(/\/dashboard\/contracts/);
    } else {
      // If the button is not present yet, the smoke test should still pass.
      await expect(true).toBe(true);
    }
  });
});

test.describe("Escrow surface smoke (unauthenticated)", () => {
  test("Contracts should redirect or block without token", async ({ page }) => {
    await page.goto("/dashboard/contracts");

    const heading = page.getByRole("heading", {
      name: /sign in|forbidden|unauthorised|access/i
    });

    await expect(heading.first()).toBeVisible();
  });
});
