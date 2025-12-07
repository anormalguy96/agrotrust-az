/// <reference types="@playwright/test" />

// agrotrust-az/tests/e2e/app.smoke.pw.test.ts

import { test, expect } from "@playwright/test";

/**
 * AgroTrust AZ - Playwright smoke tests
 *
 * Goal:
 * - Confirm the app boots and key public pages are reachable.
 * - Keep selectors resilient for hackathon speed.
 *
 * Note:
 * - These tests assume your Playwright config sets baseURL
 *   and starts the dev server.
 */

test.describe("Marketing smoke", () => {
  test("Home page loads and shows brand heading", async ({ page }) => {
    await page.goto("/");

    // Prefer robust role-based selectors
    const heading = page.getByRole("heading", { name: /AgroTrust/i });
    await expect(heading).toBeVisible();

    // Basic nav sanity if your Navbar is present
    const navHome = page.getByRole("link", { name: /home/i });
    await expect(navHome).toBeVisible();
  });

  test("How it works page is reachable", async ({ page }) => {
    await page.goto("/how-it-works");

    const heading = page.getByRole("heading", { name: /how it works/i });
    await expect(heading).toBeVisible();
  });

  test("Standards page is reachable", async ({ page }) => {
    await page.goto("/standards");

    const heading = page.getByRole("heading", { name: /standards/i });
    await expect(heading).toBeVisible();
  });

  test("For farmers page is reachable", async ({ page }) => {
    await page.goto("/for-farmers");

    const heading = page.getByRole("heading", { name: /farmers/i });
    await expect(heading).toBeVisible();
  });

  test("For buyers page is reachable", async ({ page }) => {
    await page.goto("/for-buyers");

    const heading = page.getByRole("heading", { name: /buyers/i });
    await expect(heading).toBeVisible();
  });

  test("Contact page is reachable", async ({ page }) => {
    await page.goto("/contact");

    const heading = page.getByRole("heading", { name: /contact/i });
    await expect(heading).toBeVisible();
  });
});

test.describe("Routing smoke", () => {
  test("Unknown route shows Not Found page", async ({ page }) => {
    await page.goto("/this-route-should-not-exist");

    // Your NotFound page likely has a clear heading
    const heading = page.getByRole("heading", { name: /not found|404/i });
    await expect(heading).toBeVisible();
  });
});
