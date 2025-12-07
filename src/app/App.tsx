// agrotrust-az/src/app/App.tsx

import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";

import { env } from "@/app/config/env";
import { router } from "@/app/router";

/**
 * App root component.
 * Keeps responsibilities minimal:
 * - sets document title
 * - mounts the router
 */
export function App() {
  useEffect(() => {
    document.title = env.appName;
  }, []);

  return <RouterProvider router={router} />;
}
