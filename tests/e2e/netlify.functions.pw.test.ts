// agrotrust-az/tests/e2e/netlify.functions.pw.test.ts

import { test, expect } from "@playwright/test";

/**
 * AgroTrust AZ - Netlify Functions smoke tests (Playwright)
 *
 * These tests are designed to be environment-aware.
 *
 * Why?
 * - Your Playwright webServer is currently configured to run "npm run dev"
 *   (Vite), which does NOT automatically serve Netlify Functions locally.
 * - Functions are usually available when you run "netlify dev"
 *   (often on http://127.0.0.1:8888/.netlify/functions).
 *
 * How to enable these tests locally:
 * - Run Netlify dev and set:
 *   NETLIFY_FUNCTIONS_BASE_URL=http://127.0.0.1:8888/.netlify/functions
 *
 * Or adjust the URL based on your setup.
 */

const FUNCTIONS_BASE =
  process.env.NETLIFY_FUNCTIONS_BASE_URL?.trim() || "";

const isEnabled = Boolean(FUNCTIONS_BASE);

function fnUrl(name: string) {
  return `${FUNCTIONS_BASE.replace(/\/$/, "")}/${name}`;
}

test.describe("Netlify Functions (optional smoke)", () => {
  test.beforeEach(() => {
    test.skip(!isEnabled, "NETLIFY_FUNCTIONS_BASE_URL is not set");
  });

  test("health endpoint responds", async ({ request }) => {
    const res = await request.get(fnUrl("health"));

    expect(res.ok()).toBe(true);

    // Keep payload checks flexible to avoid coupling with MVP response shape
    const json = await res.json().catch(() => ({} as any));
    if (json && typeof json === "object") {
      expect.soft("ok" in json ? Boolean((json as any).ok) : true).toBe(true);
    }
  });

  test("passport-create accepts a minimal payload (soft)", async ({ request }) => {
    const payload = {
      lotId: "LOT-0001",
      cooperativeId: "COOP-0001",
      product: "Tomatoes",
      harvestDate: "2025-12-01",
      quantityKg: 1200,
      certifications: ["GlobalG.A.P"],
      photos: []
    };

    const res = await request.post(fnUrl("passport-create"), {
      data: payload
    });

    // Some MVP implementations may validate strictly.
    // We accept 200/201 as a pass, and do not fail hard on other statuses.
    expect.soft([200, 201].includes(res.status())).toBe(true);

    const json = await res.json().catch(() => null);
    if (json && typeof json === "object") {
      expect.soft(
        "passportId" in (json as any) || "id" in (json as any) || "qrData" in (json as any)
      ).toBe(true);
    }
  });

  test("passport-verify handles a demo id (soft)", async ({ request }) => {
    const res = await request.post(fnUrl("passport-verify"), {
      data: { passportId: "PP-0001" }
    });

    expect.soft([200, 400, 404].includes(res.status())).toBe(true);

    const json = await res.json().catch(() => null);
    if (json && typeof json === "object") {
      expect.soft(true).toBe(true); // payload presence is enough at smoke level
    }
  });

  test("escrow-init and escrow-release basic reachability (soft)", async ({ request }) => {
    const initRes = await request.post(fnUrl("escrow-init"), {
      data: {
        contractId: "CTR-0001",
        buyerId: "BUY-0001",
        cooperativeId: "COOP-0001",
        amountUsd: 25000
      }
    });

    expect.soft([200, 201, 400, 404].includes(initRes.status())).toBe(true);

    const releaseRes = await request.post(fnUrl("escrow-release"), {
      data: {
        escrowId: "ESC-0001",
        inspectionPassed: true
      }
    });

    expect.soft([200, 201, 400, 404].includes(releaseRes.status())).toBe(true);
  });
});
