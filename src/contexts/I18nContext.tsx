/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { getCookie, setCookie } from "cookies-next";

const supportedLanguages = ["en", "de", "es", "it", "fr"];

type I18nContextType = {
  locale: string;
  setLocale: (locale: string) => void;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<any>("en");

  useEffect(() => {
    const storedLocale = getCookie("locale") || "en";
    setLocaleState(storedLocale);
  }, []);

  const setLocale = (newLocale: string) => {
    if (!supportedLanguages.includes(newLocale)) return;
    setLocaleState(newLocale);
    setCookie("locale", newLocale, { path: "/" });
    router.refresh();
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
