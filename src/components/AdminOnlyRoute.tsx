import { ReactNode, useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { ROUTES } from "@/app/config/routes";
import { AuthContext } from "@/app/providers/AuthProvider";

type AdminOnlyRouteProps = {
  children: ReactNode;
};

export function AdminOnlyRoute({ children }: AdminOnlyRouteProps) {
  const ctx = useContext(AuthContext);
  const location = useLocation();

  if (!ctx) {
    throw new Error("AuthContext not found. Ensure AuthProvider wraps the app.");
  }

  const { user, isLoading } = ctx;

  if (isLoading) {
    return <div style={{ padding: 24 }}>Loading session…</div>;
  }

  if (!user) {
    return <Navigate to={ROUTES.AUTH.SIGN_IN} state={{ from: location }} replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to={ROUTES.DASHBOARD.OVERVIEW} replace />;
  }

  return <>{children}</>;
}