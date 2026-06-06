'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import ar from '../messages/ar.json'
import en from '../messages/en.json'

type Lang = 'ar' | 'en'

interface LangContextType {
  lang: Lang
  t: typeof ar
  toggleLang: () => void
  isRTL: boolean
}

const LangContext = createContext<LangContextType>({
  lang: 'ar',
  t: ar,
  toggleLang: () => {},
  isRTL: true,
})

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('ar')

  useEffect(() => {
    const saved = localStorage.getItem('naz-lang') as Lang
    if (saved) setLang(saved)
  }, [])

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
    localStorage.setItem('naz-lang', lang)
  }, [lang])

  const toggleLang = () => setLang(l => l === 'ar' ? 'en' : 'ar')

  return (
    <LangContext.Provider value={{
      lang,
      t: lang === 'ar' ? ar : en as typeof ar,
      toggleLang,
      isRTL: lang === 'ar',
    }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
