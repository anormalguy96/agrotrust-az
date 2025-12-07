// agrotrust-az/src/app/providers/AuthProvider.tsx

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

export type UserRole = "coop" | "buyer" | "admin";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type SignInInput = {
  email: string;
  name?: string;
  role?: UserRole;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (input: SignInInput) => Promise<AuthUser>;
  signOut: () => void;
  getRoleLabel: (role?: UserRole) => string;
};

const STORAGE_KEY = "agrotrust.auth.user";

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type Props = {
  children: ReactNode;
};

/**
 * Hackathon MVP AuthProvider
 *
 * This is intentionally lightweight and mock-driven.
 * It persists a simple user object in localStorage.
 *
 * Later you can swap:
 * - signIn implementation
 * - storage model
 * - token handling
 * without changing consumer code.
 */
export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuthUser;
        if (parsed?.email && parsed?.role) {
          setUser(parsed);
        }
      }
    } catch {
      // ignore corrupted storage for MVP
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persist = useCallback((u: AuthUser | null) => {
    try {
      if (!u) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } catch {
      // ignore storage failures for MVP
    }
  }, []);

  const signIn = useCallback(
    async (input: SignInInput) => {
      const email = input.email?.trim();
      if (!email) {
        throw new Error("Email is required.");
      }

      // Simple deterministic ID for demo consistency
      const id = `user-${btoa(email).replace(/=+/g, "").slice(0, 12)}`;

      const role: UserRole = input.role ?? "coop";
      const name =
        input.name?.trim() ||
        (role === "buyer"
          ? "Foreign Buyer"
          : role === "admin"
          ? "Platform Admin"
          : "Cooperative Member");

      const newUser: AuthUser = { id, name, email, role };

      setUser(newUser);
      persist(newUser);

      return newUser;
    },
    [persist]
  );

  const signOut = useCallback(() => {
    setUser(null);
    persist(null);
  }, [persist]);

  const getRoleLabel = useCallback((role?: UserRole) => {
    switch (role) {
      case "buyer":
        return "Buyer";
      case "admin":
        return "Admin";
      case "coop":
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
      getRoleLabel
    }),
    [user, isLoading, signIn, signOut, getRoleLabel]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
