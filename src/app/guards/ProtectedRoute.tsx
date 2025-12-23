import { useContext, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { ROUTES } from "@/app/config/routes";
import { AuthContext, type UserRole } from "@/app/providers/AuthProvider";

type Props = {
  children: ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
  forbiddenTo?: string;
};

function normalizeRole(role: unknown): UserRole | null {
  if (typeof role !== "string") return null;
  const r = role.trim().toLowerCase();
  if (r === "admin" || r === "buyer" || r === "cooperative") return r as UserRole;
  return null;
}


function resolveUserRole(user: any): UserRole | null {
  const direct = normalizeRole(user?.role);

  const meta1 = normalizeRole(user?.user_metadata?.role);
  const meta2 = normalizeRole(user?.app_metadata?.role);

  const meta3 = normalizeRole(user?.user_metadata?.userType);

  return direct ?? meta1 ?? meta2 ?? meta3 ?? null;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = ROUTES.AUTH.SIGN_IN,
  forbiddenTo = ROUTES.FORBIDDEN ?? "/forbidden",
}: Props) {
  const location = useLocation();
  const ctx = useContext(AuthContext);

  if (!ctx) {
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
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  if (allowedRoles?.length) {
    const role = resolveUserRole(user);

    if (!role) {
      return <Navigate to={forbiddenTo} replace />;
    }

    const allowed = allowedRoles.map((r) => r.toLowerCase()) as UserRole[];
    if (!allowed.includes(role)) {
      return <Navigate to={forbiddenTo} replace />;
    }
  }

  return <>{children}</>;
}
