import { useContext, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { ROUTES } from "@/app/config/routes";
import { AuthContext, type UserRole } from "@/app/providers/AuthProvider";

type Props = {
  children: ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
};

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = ROUTES.AUTH.SIGN_IN,
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

  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
}