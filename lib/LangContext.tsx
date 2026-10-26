'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Cookies } from 'react-cookie'
import { translations, Language } from './i18n'

const cookies = new Cookies()

interface LangContextType {
  lang: Language
  t: typeof translations.ar
  toggleLang: () => void
  setLang: (l: Language) => void
  isRTL: boolean
}

const LangContext = createContext<LangContextType>({
  lang: 'ar',
  t: translations.ar,
  toggleLang: () => {},
  setLang: () => {},
  isRTL: true,
})

export function LangProvider({ children, initialLang = 'ar' }: { children: React.ReactNode; initialLang?: Language }) {
  const [lang, setLang] = useState<Language>(initialLang)

  useEffect(() => {
    const saved = cookies.get('naz-lang') as Language
    if (saved === 'ar' || saved === 'en') {
      setLang(saved)
    } else {
      cookies.set('naz-lang', initialLang, { path: '/', maxAge: 31536000 })
    }
  }, [initialLang])

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
      setLang,
      isRTL: lang === 'ar',
    }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
