'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useLang } from '../../lib/LangContext'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { t, isRTL } = useLang()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // Special-case the admin login page - no auth guard, no sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    try {
      const token = document.cookie.replace(/(?:(?:^|.*;\s*)naz_token\s*=\s*([^;]*).*$)|^.*$/, "$1")
      if (!token) {
        router.push('/admin/login')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()
      
      if (!data.is_admin) {
        router.push('/admin/login')
        return
      }

      setIsAdmin(true)
    } catch (error) {
      console.error('Failed to check admin status:', error)
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    document.cookie = 'naz_token=; path=/; max-age=0'
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050508' }}>
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FFB2]"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  const navItems = [
    { path: '/admin', label: isRTL ? 'لوحة التحكم' : 'Dashboard' },
    { path: '/admin/users', label: isRTL ? 'المستخدمين' : 'Users' },
    { path: '/admin/packages', label: isRTL ? 'الباقات' : 'Packages' },
    { path: '/admin/payments', label: isRTL ? 'المدفوعات' : 'Payments' },
    { path: '/admin/settings', label: isRTL ? 'الإعدادات' : 'Settings' },
  ]

  return (
    <div className="min-h-screen flex" style={{ background: '#050508' }}>
      {/* Sidebar */}
      <aside className="w-64 p-6 flex flex-col" style={{ background: '#0F0F1A', borderRight: isRTL ? 'none' : '1px solid rgba(255,255,255,0.1)', borderLeft: isRTL ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
        <div className="mb-8">
          <h1 className="text-2xl font-black" style={{ color: '#00FFB2' }}>
            {isRTL ? 'ناز' : 'Naz'}
          </h1>
          <p className="text-sm" style={{ color: 'rgba(240,240,255,0.6)' }}>
            {isRTL ? 'لوحة الإدارة' : 'Admin Panel'}
          </p>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                pathname === item.path ? 'font-bold' : ''
              }`}
              style={{
                background: pathname === item.path ? 'rgba(0,255,178,0.1)' : 'transparent',
                color: pathname === item.path ? '#00FFB2' : 'rgba(240,240,255,0.6)',
              }}
              onMouseEnter={(e) => {
                if (pathname !== item.path) {
                  e.currentTarget.style.color = '#00FFB2'
                }
              }}
              onMouseLeave={(e) => {
                if (pathname !== item.path) {
                  e.currentTarget.style.color = 'rgba(240,240,255,0.6)'
                }
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full text-left px-4 py-3 rounded-xl transition-all"
            style={{
              color: 'rgba(240,240,255,0.6)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#00FFB2'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(240,240,255,0.6)'
            }}
          >
            {isRTL ? 'العودة للتطبيق' : 'Back to App'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 rounded-xl transition-all mt-2"
            style={{
              color: 'rgba(255,107,107,0.8)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FF6B6B'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255,107,107,0.8)'
            }}
          >
            {t.common.logout}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
