import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

type AdminOnlyRouteProps = {
  children: ReactNode;
};

export function AdminOnlyRoute({ children }: AdminOnlyRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/dashboard/overview" replace />;
  }

  return <>{children}</>;
}
