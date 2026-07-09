'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Cookies } from 'react-cookie'
import { translations, Language } from './i18n'

const cookies = new Cookies()

interface LangContextType {
  lang: Language
  t: typeof translations.ar
  toggleLang: () => void
  isRTL: boolean
}

const LangContext = createContext<LangContextType>({
  lang: 'ar',
  t: translations.ar,
  toggleLang: () => {},
  isRTL: true,
})

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('ar')

  useEffect(() => {
    const saved = cookies.get('naz-lang') as Language
    if (saved) {
      setLang(saved)
    } else {
      cookies.set('naz-lang', 'ar', { path: '/', maxAge: 31536000 })
    }
  }, [])

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
    cookies.set('naz-lang', lang, { path: '/', maxAge: 31536000 })
  }, [lang])

  const toggleLang = () => setLang(l => l === 'ar' ? 'en' : 'ar')

  return (
    <LangContext.Provider value={{
      lang,
      t: translations[lang],
      toggleLang,
      isRTL: lang === 'ar',
    }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
