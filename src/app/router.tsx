import { createBrowserRouter, Navigate, Route } from "react-router-dom";
import { AdminUserList } from "@/pages/admin/AdminUserList";
import { AdminOnlyRoute } from "@/components/AdminOnlyRoute";
import { AdminUsers } from "@/pages/dashboard/AdminUsers";
import { Analytics } from "@/pages/dashboard/Analytics";
import { ROUTES } from "@/app/config/routes";
import { ProtectedRoute } from "@/app/guards/ProtectedRoute";
import AuthCallback from "@/pages/auth/callback";
import { MarketingLayout } from "@/layouts/MarketingLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Home } from "@/pages/marketing/Home";
import { HowItWorks } from "@/pages/marketing/HowItWorks";
import { Standards } from "@/pages/marketing/Standards";
import { ForFarmers } from "@/pages/marketing/ForFarmers";
import { ForBuyers } from "@/pages/marketing/ForBuyers";
import { Contact } from "@/pages/marketing/Contact";
import { SignIn } from "@/pages/auth/SignIn";
import { SignUp } from "@/pages/auth/SignUp";
import { VerifyEmail } from "@/pages/auth/VerifyEmail";
import { Overview } from "@/pages/dashboard/Overview";
import { Lots } from "@/pages/dashboard/Lots";
import { LotDetails } from "@/pages/dashboard/LotDetails";
import { Cooperatives } from "@/pages/dashboard/Cooperatives";
import { Buyers } from "@/pages/dashboard/Buyers";
import { RFQs } from "@/pages/dashboard/RFQs";
import { Contracts } from "@/pages/dashboard/Contracts";
import { Settings } from "@/pages/dashboard/Settings";
import { NotFound } from "@/pages/errors/NotFound";
import { Forbidden } from "@/pages/errors/Forbidden";
import { LotCreate } from "@/pages/dashboard/LotCreate";

<Route path={ROUTES.DASHBOARD.LOT_CREATE} element={<LotCreate />} />


export const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <MarketingLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: ROUTES.HOW_IT_WORKS.replace("/", ""), element: <HowItWorks /> },
      { path: ROUTES.STANDARDS.replace("/", ""), element: <Standards /> },
      { path: ROUTES.FOR_FARMERS.replace("/", ""), element: <ForFarmers /> },
      { path: ROUTES.FOR_BUYERS.replace("/", ""), element: <ForBuyers /> },
      { path: ROUTES.CONTACT.replace("/", ""), element: <Contact /> },
      { path: "auth/sign-in", element: <SignIn /> },
      { path: "auth/sign-up", element: <SignUp /> },
      { path: "auth/verify-email", element: <VerifyEmail /> },
      { path: "auth/callback", element: <AuthCallback /> },

      { path: "forbidden", element: <Forbidden /> },

      { path: "*", element: <NotFound /> }
    ]
  },

  {
    path: ROUTES.DASHBOARD.ROOT,
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Overview /> },

      { path: "lots", element: <Lots /> },
      { path: "lots/:lotId", element: <LotDetails /> },

      { path: "cooperatives", element: <Cooperatives /> },
      { path: "buyers", element: <Buyers /> },
      { path: "rfqs", element: <RFQs /> },
      { path: "contracts", element: <Contracts /> },
      { path: "settings", element: <Settings /> },
      {
        path: ROUTES.DASHBOARD.ADMIN_USERS,
        element: (
          <AdminOnlyRoute>
            <AdminUsers />
          </AdminOnlyRoute>
        )
      },
      {
        path: ROUTES.DASHBOARD.ADMIN_ANALYTICS,
        element: (
          <AdminOnlyRoute>
            <Analytics />
          </AdminOnlyRoute>
        )
      },
      {
        path: ROUTES.DASHBOARD.ADMIN_USERLIST,
        element: (
          <AdminOnlyRoute>
            <AdminUserList />
          </AdminOnlyRoute>
        )
      },
      { path: "*", element: <NotFound /> }
    ]
  },

  {
    path: "/404",
    element: <NotFound />
  },
  {
    path: "*",
    element: <Navigate to="/404" replace />
  }
]);
