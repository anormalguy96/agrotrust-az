// agrotrust-az/src/app/config/env.ts

/**
 * Centralised access to Vite environment variables.
 * This avoids sprinkling import.meta.env all over the codebase.
 */

import { BRAND, DEFAULTS } from "./constants";

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return fallback;

  const v = value.trim().toLowerCase();
  if (["true", "1", "yes", "y", "on"].includes(v)) return true;
  if (["false", "0", "no", "n", "off"].includes(v)) return false;

  return fallback;
}

function toString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

export const env = {
  appName: toString(import.meta.env.VITE_APP_NAME, BRAND.productName),

  /**
   * Base API path.
   * In Netlify production, this is mapped via redirects to functions.
   */
  apiBase: toString(import.meta.env.VITE_API_BASE, "/api"),

  /**
   * Controls whether mock data paths should be used in the UI.
   */
  enableMocks: false,

  /**
   * Reserved for future auth integration.
   * Keep defaults safe for hackathon use.
   */
  auth: {
    provider: toString(import.meta.env.VITE_AUTH_PROVIDER, "none"),
    domain: toString(import.meta.env.VITE_AUTH_DOMAIN, ""),
    clientId: toString(import.meta.env.VITE_AUTH_CLIENT_ID, "")
  }
} as const;