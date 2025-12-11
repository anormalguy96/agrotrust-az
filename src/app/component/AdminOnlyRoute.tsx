import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/app/config/routes";

export function AdminOnlyRoute({ children }: { children: React.ReactElement }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={ROUTES.AUTH.SIGN_IN} replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to={ROUTES.DASHBOARD.OVERVIEW} replace />;
  }

  return children;
}
