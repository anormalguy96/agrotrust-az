import { createBrowserRouter, Navigate } from "react-router-dom";
import { ROUTES } from "@/app/config/routes";
import { ProtectedRoute } from "@/app/guards/ProtectedRoute";
import { AdminOnlyRoute } from "@/components/AdminOnlyRoute";

import { MarketingLayout } from "@/layouts/MarketingLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";

import BuyerPassport from "@/pages/buyers/BuyerPassport";

import { Home } from "@/pages/marketing/Home";
import { HowItWorks } from "@/pages/marketing/HowItWorks";
import { Standards } from "@/pages/marketing/Standards";
import { ForFarmers } from "@/pages/marketing/ForFarmers";
import { ForBuyers } from "@/pages/marketing/ForBuyers";
import { Contact } from "@/pages/marketing/Contact";

import { SignIn } from "@/pages/auth/SignIn";
import { SignUp } from "@/pages/auth/SignUp";
import { VerifyEmail } from "@/pages/auth/VerifyEmail";
import AuthCallback from "@/pages/auth/callback";

import { Overview } from "@/pages/dashboard/Overview";
import { Lots } from "@/pages/dashboard/Lots";
import { LotCreate } from "@/pages/dashboard/LotCreate";
import { LotDetails } from "@/pages/dashboard/LotDetails";
import { Cooperatives } from "@/pages/dashboard/Cooperatives";
import { Buyers } from "@/pages/dashboard/Buyers";
import { RFQs } from "@/pages/dashboard/RFQs";
import { Contracts } from "@/pages/dashboard/Contracts";
import { Settings } from "@/pages/dashboard/Settings";

import EscrowInit from "@/pages/dashboard/EscrowInit";
import { AdminUsers } from "@/pages/dashboard/AdminUsers";
import { Analytics } from "@/pages/dashboard/Analytics";

import { NotFound } from "@/pages/errors/NotFound";
import { Forbidden } from "@/pages/errors/Forbidden";

export const router = createBrowserRouter([
  {
    element: <MarketingLayout />,
    children: [
      { path: ROUTES.HOME, element: <Home /> },
      { path: ROUTES.HOW_IT_WORKS, element: <HowItWorks /> },
      { path: ROUTES.STANDARDS, element: <Standards /> },
      { path: ROUTES.FOR_FARMERS, element: <ForFarmers /> },
      { path: ROUTES.FOR_BUYERS, element: <ForBuyers /> },
      { path: ROUTES.CONTACT, element: <Contact /> },

      { path: ROUTES.AUTH.SIGN_IN, element: <SignIn /> },
      { path: ROUTES.AUTH.SIGN_UP, element: <SignUp /> },
      { path: ROUTES.AUTH.VERIFY_EMAIL, element: <VerifyEmail /> },

      { path: "/auth/callback", element: <AuthCallback /> },
      { path: "/buyers/passport", element: <BuyerPassport /> },
    ],
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

      { path: ROUTES.DASHBOARD.LOTS, element: <Lots /> },
      { path: ROUTES.DASHBOARD.LOT_CREATE, element: <LotCreate /> },
      { path: ROUTES.DASHBOARD.LOT_DETAILS, element: <LotDetails /> },

      { path: ROUTES.DASHBOARD.COOPERATIVES, element: <Cooperatives /> },
      { path: ROUTES.DASHBOARD.BUYERS, element: <Buyers /> },
      { path: ROUTES.DASHBOARD.RFQS, element: <RFQs /> },
      { path: ROUTES.DASHBOARD.CONTRACTS, element: <Contracts /> },
      { path: ROUTES.DASHBOARD.SETTINGS, element: <Settings /> },

      { path: "/dashboard/escrow/init", element: <EscrowInit /> },

      {
        path: ROUTES.DASHBOARD.ADMIN_USERS,
        element: (
          <AdminOnlyRoute>
            <AdminUsers />
          </AdminOnlyRoute>
        ),
      },
      {
        path: ROUTES.DASHBOARD.ADMIN_ANALYTICS,
        element: (
          <AdminOnlyRoute>
            <Analytics />
          </AdminOnlyRoute>
        ),
      },
    ],
  },

  { path: "/forbidden", element: <Forbidden /> },

  { path: "/dashboard/admin", element: <Navigate to={ROUTES.DASHBOARD.ADMIN_USERS} replace /> },

  { path: "*", element: <NotFound /> },
]);