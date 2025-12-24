"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { Language, translations } from "./translations"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: typeof translations.en
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("vi")

  // Load language from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("language") as Language | null
    if (stored && (stored === "en" || stored === "vi")) {
      setLanguageState(stored)
    }
  }, [])

  // Save language to localStorage when it changes
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("language", lang)
  }

  const value = {
    language,
    setLanguage,
    t: translations[language],
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

// Convenience hook for just translations
export function useTranslation() {
  const { t } = useLanguage()
  return t
}

