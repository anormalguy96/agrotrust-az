// agrotrust-az/tests/e2e/settings.smoke.pw.test.ts

import { test, expect, type Page } from "@playwright/test";

/**
 * AgroTrust AZ - Settings smoke tests (Playwright)
 *
 * Goal:
 * - Confirm the Settings page renders with mock auth.
 * - Keep assertions resilient for hackathon iteration.
 *
 * Assumptions:
 * - /dashboard/settings exists.
 * - Settings may include profile, organisation, preferences, and demo toggles.
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
  id: "USR-0010",
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

test.describe("Settings surface smoke (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test("Settings page loads", async ({ page }) => {
    await page.goto("/dashboard/settings");

    const heading = page.getByRole("heading", { name: /settings/i });
    await expect(heading.first()).toBeVisible();
  });

  test("Profile or organisation blocks appear if implemented (soft)", async ({ page }) => {
    await page.goto("/dashboard/settings");

    const profileText = page.locator("text=/profile|account|user/i").first();
    const orgText = page.locator("text=/organisation|organization|cooperative|buyer/i").first();

    await expect.soft(profileText.or(orgText)).toBeVisible();
  });

  test("Preferences or toggles surface appears if implemented (soft)", async ({ page }) => {
    await page.goto("/dashboard/settings");

    const prefsText = page.locator("text=/preferences|theme|language|notifications|demo|mocks/i").first();
    await expect.soft(prefsText).toBeVisible();

    const anyToggle = page.locator('input[type="checkbox"], [role="switch"]').first();
    await expect.soft(anyToggle).toBeVisible();
  });

  test("Save action exists if implemented (soft)", async ({ page }) => {
    await page.goto("/dashboard/settings");

    const saveBtn = page.getByRole("button", {
      name: /save|update|apply|confirm/i
    }).first();

    await expect.soft(saveBtn).toBeVisible();
  });
});

test.describe("Settings surface smoke (unauthenticated)", () => {
  test("Settings route redirects or blocks without token", async ({ page }) => {
    await page.goto("/dashboard/settings");

    const heading = page.getByRole("heading", {
      name: /sign in|forbidden|unauthorised|unauthorized|access/i
    });

    await expect(heading.first()).toBeVisible();
  });
});