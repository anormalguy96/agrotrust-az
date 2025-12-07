// agrotrust-az/src/app/providers/ThemeProvider.tsx

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

export type ThemeMode = "light" | "dark" | "system";

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedMode: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
};

const STORAGE_KEY = "agrotrust.theme.mode";

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined
);

type Props = {
  children: ReactNode;
};

/**
 * Minimal ThemeProvider.
 *
 * Strategy:
 * - store user's preference in localStorage
 * - apply a class to <html>:
 *     "theme-light" or "theme-dark"
 *
 * Your CSS can then target:
 *   :root.theme-light { ... }
 *   :root.theme-dark  { ... }
 */
export function ThemeProvider({ children }: Props) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">("light");

  const readStoredMode = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "light" || raw === "dark" || raw === "system") return raw;
    } catch {
      // ignore
    }
    return "system";
  };

  useEffect(() => {
    setModeState(readStoredMode());
  }, []);

  const getSystemMode = useCallback((): "light" | "dark" => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }, []);

  const applyThemeClass = useCallback((finalMode: "light" | "dark") => {
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark");
    root.classList.add(finalMode === "dark" ? "theme-dark" : "theme-light");
  }, []);

  useEffect(() => {
    const finalMode = mode === "system" ? getSystemMode() : mode;

    setResolvedMode(finalMode);
    applyThemeClass(finalMode);

    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  }, [mode, getSystemMode, applyThemeClass]);

  useEffect(() => {
    if (!window.matchMedia) return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");

    const handler = () => {
      if (mode === "system") {
        const sys = getSystemMode();
        setResolvedMode(sys);
        applyThemeClass(sys);
      }
    };

    // Support older browsers
    if ("addEventListener" in mql) {
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    } else {
      // @ts-expect-error legacy
      mql.addListener(handler);
      // @ts-expect-error legacy
      return () => mql.removeListener(handler);
    }
  }, [mode, getSystemMode, applyThemeClass]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
  }, []);

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const current = prev === "system" ? getSystemMode() : prev;
      return current === "dark" ? "light" : "dark";
    });
  }, [getSystemMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolvedMode,
      setMode,
      toggle
    }),
    [mode, resolvedMode, setMode, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
