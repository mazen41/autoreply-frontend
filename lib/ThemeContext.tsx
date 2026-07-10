'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Cookies } from 'react-cookie'

const cookies = new Cookies()

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const saved = cookies.get('naz-theme') as Theme
    if (saved) {
      setTheme(saved)
      document.documentElement.classList.toggle('dark', saved === 'dark')
    } else {
      document.documentElement.classList.add('dark')
      cookies.set('naz-theme', 'dark', { path: '/', maxAge: 31536000 })
    }
  }, [])

  const toggleTheme = () => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark'
      document.documentElement.classList.toggle('dark', next === 'dark')
      cookies.set('naz-theme', next, { path: '/', maxAge: 31536000 })
      return next
    })
  }

  const setThemeAndPersist = (next: Theme) => {
    document.documentElement.classList.toggle('dark', next === 'dark')
    cookies.set('naz-theme', next, { path: '/', maxAge: 31536000 })
    setTheme(next)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setThemeAndPersist }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
