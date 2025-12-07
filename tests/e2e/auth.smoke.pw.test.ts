// agrotrust-az/tests/e2e/auth.smoke.pw.test.ts

import { test, expect } from "@playwright/test";

/**
 * AgroTrust AZ - Auth smoke tests (Playwright)
 *
 * Purpose:
 * - Confirm auth routes render without errors.
 * - Keep selectors resilient and role-based.
 *
 * Assumptions based on our MVP pages:
 * - /auth/sign-in has a "Sign In" heading and a basic form
 * - /auth/sign-up has a "Sign Up" heading and a basic form
 * - /auth/verify-email has a "Verify Email" heading
 *
 * If you later rename headings, update the regex patterns here.
 */

test.describe("Auth routes smoke", () => {
  test("Sign In page loads", async ({ page }) => {
    await page.goto("/auth/sign-in");

    const heading = page.getByRole("heading", { name: /sign in/i });
    await expect(heading).toBeVisible();

    // Soft form presence checks (do not overfit to exact labels)
    const emailInput =
      page.getByRole("textbox", { name: /email/i }).first();
    await expect(emailInput).toBeVisible();

    // Password inputs are not always exposed as textbox role in all browsers,
    // so we check by placeholder OR input type via locator fallback.
    const passwordInput = page.locator(
      'input[type="password"], input[placeholder*="Password" i]'
    ).first();
    await expect(passwordInput).toBeVisible();
  });

  test("Sign Up page loads", async ({ page }) => {
    await page.goto("/auth/sign-up");

    const heading = page.getByRole("heading", { name: /sign up/i });
    await expect(heading).toBeVisible();

    const emailInput =
      page.getByRole("textbox", { name: /email/i }).first();
    await expect(emailInput).toBeVisible();

    const passwordInput = page.locator(
      'input[type="password"], input[placeholder*="Password" i]'
    ).first();
    await expect(passwordInput).toBeVisible();
  });

  test("Verify Email page loads", async ({ page }) => {
    await page.goto("/auth/verify-email");

    const heading = page.getByRole("heading", { name: /verify email/i });
    await expect(heading).toBeVisible();
  });
});

test.describe("Protected route behaviour (lightweight)", () => {
  test("Dashboard root redirects or blocks when not signed in", async ({ page }) => {
    await page.goto("/dashboard");

    // We do not assume a specific redirect strategy.
    // Accept either:
    // - landing on sign-in
    // - or seeing a forbidden/please sign in message
    const possibleHeadings = page.getByRole("heading", {
      name: /sign in|forbidden|unauthorised|access/i
    });

    await expect(possibleHeadings.first()).toBeVisible();
  });
});
