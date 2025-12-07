// agrotrust-az/playwright.config.ts
/// <reference types="@playwright/test" />
import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for AgroTrust AZ
 *
 * Notes:
 * - We keep Playwright tests separate from Vitest unit tests.
 * - testMatch uses a ".pw.test.ts" suffix to avoid clashes with Vitest.
 * - Default dev URL aligns with Vite's default port.
 */

const PORT = process.env.PORT ? Number(process.env.PORT) : 5173;
const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["**/*.pw.test.ts"],

  timeout: 30_000,
  expect: {
    timeout: 5_000
  },

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: [
    ["list"],
    ["html", { open: "never" }]
  ],

  use: {
    baseURL: BASE_URL,
    headless: !!process.env.CI,
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },

  /**
   * If your "npm run dev" script exists, this will just work.
   * If you prefer Netlify local functions during E2E,
   * change command to "npm run netlify:dev" and keep the URL.
   */
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] }
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] }
    }
  ]
});
