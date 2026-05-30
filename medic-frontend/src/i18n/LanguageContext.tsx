import { createContext, ReactNode, useContext, useState } from "react";
import { Lang, translations } from "./translations";

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (path: string) => string;
}

const LanguageContext = createContext<LangCtx>({
  lang: "EN",
  setLang: () => {},
  t: (p) => p,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const stored = (localStorage.getItem("medic-lang") as Lang) ?? "EN";
  const [lang, setLangState] = useState<Lang>(stored);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("medic-lang", l);
  };

  const t = (path: string): string => {
    const keys = path.split(".");
    let obj: unknown = translations[lang];
    for (const key of keys) {
      if (typeof obj !== "object" || obj === null) return path;
      obj = (obj as Record<string, unknown>)[key];
    }
    return typeof obj === "string" ? obj : path;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
