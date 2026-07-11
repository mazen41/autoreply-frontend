'use client'

import React, { useState, useEffect } from 'react'
import { useLang } from '../../../lib/LangContext'

interface User {
  id: number
  name: string
  email: string
  is_admin: boolean
  created_at: string
  subscription?: any
}

export default function AdminUsersPage() {
  const { t, isRTL } = useLang()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAdmin, setFilterAdmin] = useState<boolean | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [page, search, filterAdmin])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20',
      })

      if (search) params.append('search', search)
      if (filterAdmin !== null) params.append('is_admin', filterAdmin.toString())

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data.data)
      setTotalPages(Math.ceil(data.total / data.per_page))
    } catch (error: any) {
      console.error('Failed to fetch users:', error)
      setError(error.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAdmin = async (userId: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/toggle-admin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to toggle admin status')
      }

      fetchUsers()
    } catch (error: any) {
      console.error('Failed to toggle admin:', error)
      setError(error.message)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذا المستخدم؟' : 'Are you sure you want to delete this user?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      fetchUsers()
    } catch (error: any) {
      console.error('Failed to delete user:', error)
      setError(error.message)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00FFB2]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black mb-2" style={{ color: '#F0F0FF' }}>
            {isRTL ? 'المستخدمون' : 'Users'}
          </h1>
          <p style={{ color: 'rgba(240,240,255,0.6)' }}>
            {isRTL ? 'إدارة المستخدمين وصلاحياتهم' : 'Manage users and permissions'}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,0,0,0.1)', color: '#FF6B6B' }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder={isRTL ? 'بحث...' : 'Search...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl bg-transparent"
          style={{
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#F0F0FF',
          }}
        />
        <select
          value={filterAdmin === null ? '' : filterAdmin.toString()}
          onChange={(e) => setFilterAdmin(e.target.value === '' ? null : e.target.value === 'true')}
          className="px-4 py-3 rounded-xl bg-transparent"
          style={{
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#F0F0FF',
          }}
        >
          <option value="">{isRTL ? 'الكل' : 'All'}</option>
          <option value="false">{isRTL ? 'مستخدمون' : 'Users'}</option>
          <option value="true">{isRTL ? 'مسؤولون' : 'Admins'}</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#0F0F1A' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th className="text-left p-4" style={{ color: 'rgba(240,240,255,0.6)' }}>
                {isRTL ? 'المستخدم' : 'User'}
              </th>
              <th className="text-left p-4" style={{ color: 'rgba(240,240,255,0.6)' }}>
                {isRTL ? 'البريد الإلكتروني' : 'Email'}
              </th>
              <th className="text-left p-4" style={{ color: 'rgba(240,240,255,0.6)' }}>
                {isRTL ? 'الدور' : 'Role'}
              </th>
              <th className="text-left p-4" style={{ color: 'rgba(240,240,255,0.6)' }}>
                {isRTL ? 'تاريخ الانضمام' : 'Joined'}
              </th>
              <th className="text-right p-4" style={{ color: 'rgba(240,240,255,0.6)' }}>
                {isRTL ? 'الإجراءات' : 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ background: 'rgba(0,255,178,0.1)', color: '#00FFB2' }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold" style={{ color: '#F0F0FF' }}>{user.name}</span>
                  </div>
                </td>
                <td className="p-4" style={{ color: 'rgba(240,240,255,0.6)' }}>
                  {user.email}
                </td>
                <td className="p-4">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: user.is_admin ? 'rgba(0,255,178,0.1)' : 'rgba(255,255,255,0.05)',
                      color: user.is_admin ? '#00FFB2' : 'rgba(240,240,255,0.6)',
                    }}
                  >
                    {user.is_admin ? (isRTL ? 'مسؤول' : 'Admin') : (isRTL ? 'مستخدم' : 'User')}
                  </span>
                </td>
                <td className="p-4" style={{ color: 'rgba(240,240,255,0.6)' }}>
                  {formatDate(user.created_at)}
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleToggleAdmin(user.id)}
                      className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: 'rgba(0,255,178,0.1)',
                        color: '#00FFB2',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0,255,178,0.2)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(0,255,178,0.1)'
                      }}
                    >
                      {user.is_admin ? (isRTL ? 'إزالة صلاحية' : 'Revoke') : (isRTL ? 'ترقية' : 'Promote')}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: 'rgba(255,107,107,0.1)',
                        color: '#FF6B6B',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,107,107,0.2)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,107,107,0.1)'
                      }}
                    >
                      {isRTL ? 'حذف' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="p-8 text-center" style={{ color: 'rgba(240,240,255,0.6)' }}>
            {isRTL ? 'لا يوجد مستخدمون' : 'No users found'}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl font-bold transition-all disabled:opacity-50"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#F0F0FF',
            }}
          >
            {isRTL ? '→' : '←'}
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                page === p ? 'ring-2 ring-[#00FFB2]' : ''
              }`}
              style={{
                background: page === p ? 'rgba(0,255,178,0.1)' : 'rgba(255,255,255,0.05)',
                color: page === p ? '#00FFB2' : '#F0F0FF',
              }}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl font-bold transition-all disabled:opacity-50"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#F0F0FF',
            }}
          >
            {isRTL ? '←' : '→'}
          </button>
        </div>
      )}
    </div>
  )
}
