// agrotrust-az/src/hooks/useAuth.ts

import { useContext } from "react";
import { AuthContext } from "@/app/providers/AuthProvider";

/**
 * useAuth
 *
 * Small convenience hook to access AuthContext safely.
 * Keeps imports consistent across pages/components.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return ctx;
}