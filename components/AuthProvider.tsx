'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  id: number
  name: string
  email: string
  is_admin: boolean
  onboarding_completed: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  logout: () => void
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
  refreshUser: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async () => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/user`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const logout = () => {
    document.cookie = 'naz_token=; path=/; max-age=0'
    setUser(null)
    window.location.href = '/login'
  }

  const refreshUser = () => {
    fetchUser()
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)