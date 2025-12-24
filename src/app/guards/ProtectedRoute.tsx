// agrotrust-az/src/app/guards/ProtectedRoute.tsx

import { useContext, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { ROUTES } from "@/app/config/routes";
import { AuthContext, type UserRole } from "@/app/providers/AuthProvider";

type Props = {
  children: ReactNode;

  /**
   * Optional role-based gate for future expansion.
   * If omitted, any authenticated user can pass.
   */
  allowedRoles?: UserRole[];

  /**
   * Optional override for where unauthenticated users go.
   */
  redirectTo?: string;
};

/**
 * ProtectedRoute
 *
 * A lightweight guard for the dashboard and any future protected areas.
 * Uses the AuthProvider's mock auth state for the hackathon MVP.
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = ROUTES.AUTH.SIGN_IN
}: Props) {
  const location = useLocation();
  const ctx = useContext(AuthContext);

  if (!ctx) {
    // If this triggers, the app is missing <AuthProvider> in main.tsx.
    throw new Error("AuthContext not found. Ensure AuthProvider wraps the app.");
  }

  const { isLoading, isAuthenticated, user } = ctx;

  if (isLoading) {
    return (
      <div style={{ padding: 24 }}>
        <p>Loading session…</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
}
