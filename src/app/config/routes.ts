// agrotrust-az/src/app/config/routes.ts

/**
 * Route path constants and small helpers.
 * These should match your router setup and page file structure.
 */

export const ROUTES = {
  // Marketing
  HOME: "/",
  HOW_IT_WORKS: "/how-it-works",
  STANDARDS: "/standards",
  FOR_FARMERS: "/for-farmers",
  FOR_BUYERS: "/for-buyers",
  CONTACT: "/contact",

  // Auth
  AUTH: {
    SIGN_IN: "/auth/sign-in",
    SIGN_UP: "/auth/sign-up",
    VERIFY_EMAIL: "/auth/verify-email"
  },

  // Dashboard
  DASHBOARD: {
    ROOT: "/dashboard",
    OVERVIEW: "/dashboard",
    LOTS: "/dashboard/lots",
    LOT_DETAILS: "/dashboard/lots/:lotId",
    COOPERATIVES: "/dashboard/cooperatives",
    BUYERS: "/dashboard/buyers",
    RFQS: "/dashboard/rfqs",
    CONTRACTS: "/dashboard/contracts",
    SETTINGS: "/dashboard/settings"
  }
} as const;

export function lotDetailsPath(lotId: string) {
  return `/dashboard/lots/${encodeURIComponent(lotId)}`;
}

export function isDashboardPath(pathname: string) {
  return pathname.startsWith(ROUTES.DASHBOARD.ROOT);
}

export function isAuthPath(pathname: string) {
  return pathname.startsWith("/auth");
}