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

  // Buyers
  BUYERS: {
    PASSPORT: "/buyers/passport",
    MARKET: "/buyers/market",
    LOT_DETAILS: "/buyers/lots/:lotId"
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
    SETTINGS: "/dashboard/settings",
    ADMIN_USERS: "/dashboard/admin/users",
    ADMIN_ANALYTICS: "/dashboard/admin/analytics",
    ADMIN_USERLIST: "/dashboard/admin/AdminUserList",
    LOT_CREATE:"/dashboard/lots/new"
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
