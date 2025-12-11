import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { en } from "./en";
import { az } from "./az";

type Language = "en" | "az";
type Messages = typeof en;

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

function getNestedMessage(messages: any, key: string): string | undefined {
  return key.split(".").reduce((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return acc[part];
    }
    return undefined;
  }, messages);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as
        | Language
        | null;
      if (stored === "az" || stored === "en") {
        setLanguageState(stored);
        return;
      }

      const browser = navigator.language.toLowerCase();
      if (browser.startsWith("az")) {
        setLanguageState("az");
      }
    } catch {
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
    }
  };

  const value = useMemo<I18nContextValue>(() => {
    const t = (key: string) => {
      const dict = allMessages[language] ?? en;
      const found = getNestedMessage(dict, key);
      if (typeof found === "string") return found;

      const fallback = getNestedMessage(en, key);
      if (typeof fallback === "string") return fallback;

      return key;
    };

    return { language, setLanguage, t };
  }, [language]);

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
