// src/app/providers/AuthProvider.tsx

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabaseClient";

export type UserRole = "cooperative" | "buyer" | "admin";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  cooperativeId?: string;
  coopId?: string;
};

type SignInInput = {
  email: string;
  password: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (input: SignInInput) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  getRoleLabel: (role?: UserRole) => string;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

type Props = { children: ReactNode };

function normalizeRole(role: any): UserRole {
  const r = String(role ?? "").toLowerCase();
  if (r === "admin") return "admin";
  if (r === "buyer") return "buyer";
  return "cooperative";
}

async function buildUserFromSession(): Promise<AuthUser | null> {
  const { data: authData } = await supabase.auth.getUser();
  const u = authData.user;
  if (!u) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, full_name, first_name, last_name, company_name")
    .eq("id", u.id)
    .single();

  const role = normalizeRole(profile?.role);

  const name =
    profile?.full_name?.trim() ||
    `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() ||
    profile?.company_name?.trim() ||
    u.email?.split("@")[0] ||
    "User";

  return {
    id: u.id,
    email: u.email ?? "",
    name,
    role,
    cooperativeId: u.id,
  };
}

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const built = await buildUserFromSession();
        if (alive) setUser(built);
      } finally {
        if (alive) setIsLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async () => {
      const built = await buildUserFromSession();
      if (alive) setUser(built);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (input: SignInInput) => {
    const email = input.email?.trim().toLowerCase();
    const password = input.password?.trim();

    if (!email || !password) throw new Error("Email and password are required.");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const built = await buildUserFromSession();
    if (!built) throw new Error("Sign-in succeeded but no user session found.");

    setUser(built);
    return built;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const getRoleLabel = useCallback((role?: UserRole) => {
    switch (role) {
      case "buyer":
        return "Buyer";
      case "admin":
        return "Admin";
      case "cooperative":
      default:
        return "Cooperative";
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      signIn,
      signOut,
      getRoleLabel,
    }),
    [user, isLoading, signIn, signOut, getRoleLabel]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
