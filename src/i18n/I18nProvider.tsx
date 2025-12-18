// src/i18n/I18nProvider.tsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { en } from "./en";
import { az } from "./az";
import type { Messages } from "./types";

type Language = "en" | "az";

type I18nContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const STORAGE_KEY = "agrotrust.language";

const allMessages: Record<Language, Messages> = {
  en,
  az,
};

// Supports nested keys like: "auth.signUp.title"
function getNestedMessage(messages: unknown, key: string): string | undefined {
  const parts = (key || "").split(".").filter(Boolean);
  let cur: any = messages;

  for (const part of parts) {
    if (!cur || typeof cur !== "object" || !(part in cur)) return undefined;
    cur = cur[part];
  }

  return typeof cur === "string" ? cur : undefined;
}

function detectInitialLanguage(): Language {
  // 1) localStorage wins
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "az" || stored === "en") return stored;
  } catch {
    // ignore
  }

  // 2) browser language fallback
  try {
    const browser = (navigator.language || "").toLowerCase();
    if (browser.startsWith("az")) return "az";
  } catch {
    // ignore
  }

  return "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    setLanguageState(detectInitialLanguage());
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  };

  const value = useMemo<I18nContextValue>(() => {
    const t = (key: string) => {
      const dict = allMessages[language] ?? en;

      const found = getNestedMessage(dict, key);
      if (found) return found;

      const fallback = getNestedMessage(en, key);
      if (fallback) return fallback;

      return key; // show the key if missing translations
    };

    return { language, setLanguage, t };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}