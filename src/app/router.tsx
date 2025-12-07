// agrotrust-az/src/app/router.tsx

import { createBrowserRouter, Navigate } from "react-router-dom";

import { ROUTES } from "@/app/config/routes";
import { ProtectedRoute } from "@/app/guards/ProtectedRoute";

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

export const router = createBrowserRouter([
  /**
   * Marketing + Public pages
   */
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

      // Auth under marketing shell for MVP simplicity
      { path: "auth/sign-in", element: <SignIn /> },
      { path: "auth/sign-up", element: <SignUp /> },
      { path: "auth/verify-email", element: <VerifyEmail /> },

      // Friendly explicit error route
      { path: "forbidden", element: <Forbidden /> },

      // Catch-all for public area
      { path: "*", element: <NotFound /> }
    ]
  },

  /**
   * Protected dashboard
   */
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

      { path: "*", element: <NotFound /> }
    ]
  },

  /**
   * Safety fallback: if something slips outside groups
   */
  {
    path: "/404",
    element: <NotFound />
  },
  {
    path: "*",
    element: <Navigate to="/404" replace />
  }
]);
