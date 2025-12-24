import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import type { AuthChangeEvent, Session, User } from "@supabase/auth-js";

export type UserRole = "cooperative" | "buyer" | "admin";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type SignInInput = { email: string; password: string };

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
  const r = String(role ?? "").trim().toLowerCase();
  if (r === "admin") return "admin";
  if (r === "buyer") return "buyer";
  return "cooperative";
}

function minimalUserFromAuth(u: User): AuthUser {
  const email = String(u.email ?? "");
  return {
    id: u.id,
    email,
    name: email ? email.split("@")[0] : "User",
    role: "cooperative",
  };
}

async function hydrateFromProfile(u: User): Promise<AuthUser> {
  const minimal = minimalUserFromAuth(u);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, full_name, first_name, last_name, company_name, email")
    .eq("id", u.id)
    .maybeSingle();

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
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          if (alive) setUser(null);
          return;
        }

        const u = data.session?.user;

        if (u && alive) {
          setUser(minimalUserFromAuth(u));
          const full = await hydrateFromProfile(u);
          if (alive) setUser(full);
        } else if (alive) {
          setUser((prev) => (prev ? prev : null));
        }
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    void boot();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!alive) return;

        if (event === "SIGNED_OUT" || !session?.user) {
          setUser(null);
          return;
        }

        const u = session.user;
        setUser((prev) => prev ?? minimalUserFromAuth(u));
        const full = await hydrateFromProfile(u);
        if (alive) setUser(full);
      }
    );

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async ({ email, password }: SignInInput) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) throw new Error("Email and password are required.");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    if (error) throw error;

    const u = data.user;
    if (!u) throw new Error("Sign-in succeeded but missing user.");

    const minimal = minimalUserFromAuth(u);
    setUser(minimal);
    return minimal;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  }, []);

  const getRoleLabel = useCallback((role?: UserRole) => {
    if (role === "buyer") return "Buyer";
    if (role === "admin") return "Admin";
    return "Cooperative";
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