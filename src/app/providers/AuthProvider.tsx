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

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type Props = { children: ReactNode };

function normalizeRole(role: unknown): UserRole {
  const r = String(role ?? "").toLowerCase();
  if (r === "admin") return "admin";
  if (r === "buyer") return "buyer";
  return "cooperative";
}

function minimalUserFromAuth(u: { id: string; email?: string | null }): AuthUser {
  const role: UserRole = "cooperative";
  const email = String(u.email ?? "");
  return {
    id: u.id,
    email,
    name: email ? email.split("@")[0] : "User",
    role,
  };
}

async function hydrateFromProfile(u: { id: string; email?: string | null }): Promise<AuthUser> {
  const minimal = minimalUserFromAuth(u);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, full_name, first_name, last_name, company_name, email")
    .eq("id", u.id)
    .maybeSingle();

  // If RLS blocks or profile missing, keep minimal (don’t break auth)
  if (error || !profile) return minimal;

  const role = normalizeRole(profile.role);
  const name =
    String(profile.full_name ?? "").trim() ||
    `${String(profile.first_name ?? "").trim()} ${String(profile.last_name ?? "").trim()}`.trim() ||
    String(profile.company_name ?? "").trim() ||
    minimal.name;

  return {
    id: u.id,
    email: String(profile.email ?? u.email ?? minimal.email),
    name,
    role,
  };
}

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const boot = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const u = data.session?.user;

        if (u && alive) {
          // set minimal immediately, then hydrate
          setUser(minimalUserFromAuth(u));
          const full = await hydrateFromProfile(u);
          if (alive) setUser(full);
        }
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    void boot();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!alive) return;

      // ✅ Only clear user when truly signed out
      if (event === "SIGNED_OUT" || !session?.user) {
        setUser(null);
        return;
      }

      const u = session.user;

      // ✅ Never wipe user during sign-in; set minimal, then hydrate
      setUser((prev) => prev ?? minimalUserFromAuth(u));
      const full = await hydrateFromProfile(u);
      if (alive) setUser(full);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (input: SignInInput): Promise<AuthUser> => {
    const email = input.email.trim().toLowerCase();
    const password = input.password; // don't trim

    if (!email || !password) throw new Error("Email and password are required.");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const u = data.user;
    if (!u) throw new Error("Sign-in succeeded but missing user.");

    const minimal = minimalUserFromAuth(u);
    setUser(minimal); // immediate
    return minimal;
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
