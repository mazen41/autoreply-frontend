'use client'
/* eslint-disable react-hooks/immutability, react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any */

import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Download, Filter, Shield, Trash2, UserCog, Users } from 'lucide-react'
import { AdminShell, Badge, Button, PageHeader, Panel, SkeletonRows, inputClass } from '../../../components/admin/AdminUI'
import { useLang } from '../../../lib/LangContext'

type User = {
  id: number
  name: string
  email: string
  is_admin: boolean
  created_at: string
  subscription?: { status?: string; package?: { name?: string } } | null
  channels_count?: number
  messages_count?: number
}

export default function AdminUsersPage() {
  const { isRTL } = useLang()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAdmin, setFilterAdmin] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => { const timer = setTimeout(fetchUsers, 220); return () => clearTimeout(timer) }, [page, search, filterAdmin])

  const token = () => document.cookie.replace(/(?:(?:^|.*;\s*)naz_token\s*=\s*([^;]*).*$)|^.*$/, '$1')

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: String(page), per_page: '20' })
      if (search) params.append('search', search)
      if (filterAdmin !== '') params.append('is_admin', filterAdmin)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users?${params}`, { headers: { Authorization: `Bearer ${token()}` } })
      if (!response.ok) throw new Error(isRTL ? '???? ????? ??????????' : 'Failed to fetch users')
      const data = await response.json()
      setUsers(data.data || [])
      setTotal(data.total || 0)
      setTotalPages(Math.max(1, Math.ceil((data.total || 0) / (data.per_page || 20))))
      setError('')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAdmin = async (user: User) => {
    const ok = window.confirm(user.is_admin ? (isRTL ? `????? ?????? ??????? ?? ${user.name}?` : `Revoke admin access from ${user.name}?`) : (isRTL ? `????? ${user.name} ??? ??????` : `Promote ${user.name} to admin?`))
    if (!ok) return
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${user.id}/toggle-admin`, { method: 'POST', headers: { Authorization: `Bearer ${token()}` } })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.message || 'Failed to update user')
      }
      toast.success(isRTL ? '?? ????? ?????????' : 'Permissions updated')
      fetchUsers()
    } catch (error: any) {
      toast.error(error.message)
      setError(error.message)
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(isRTL ? `??? ???????? ${user.name} ???????` : `Permanently delete ${user.name}?`)) return
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${user.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.message || 'Failed to delete user')
      }
      toast.success(isRTL ? '?? ??? ????????' : 'User deleted')
      fetchUsers()
    } catch (error: any) {
      toast.error(error.message)
      setError(error.message)
    }
  }

  const formatDate = (value: string) => new Intl.DateTimeFormat(isRTL ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
  const summary = useMemo(() => ({ admins: users.filter((u) => u.is_admin).length, active: users.filter((u) => u.subscription?.status === 'active').length }), [users])

  return (
    <AdminShell>
      <PageHeader
        eyebrow={isRTL ? '????? ??????' : 'Access Management'}
        title={isRTL ? '?????????? ??????????' : 'Users and Permissions'}
        description={isRTL ? '????? ??????????? ????? ?????????? ?????? ?????????? ????????? ?????? ????????? ??????? ?????.' : 'Filter users, manage admins, inspect subscriptions and channels, and perform sensitive actions with clear confirmations.'}
        actions={<><Button variant="ghost"><Download size={16} />{isRTL ? '?????' : 'Export'}</Button><Button variant="ghost" onClick={fetchUsers}><Users size={16} />{total.toLocaleString(isRTL ? 'ar-SA' : 'en-US')}</Button></>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Panel><div className="text-sm font-bold text-slate-500 dark:text-slate-400">{isRTL ? '?????? ???????' : 'Total results'}</div><div className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{total.toLocaleString(isRTL ? 'ar-SA' : 'en-US')}</div></Panel>
        <Panel><div className="text-sm font-bold text-slate-500 dark:text-slate-400">{isRTL ? '??????? ?? ??????' : 'Admins on page'}</div><div className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{summary.admins}</div></Panel>
        <Panel><div className="text-sm font-bold text-slate-500 dark:text-slate-400">{isRTL ? '???????? ????' : 'Active subscriptions'}</div><div className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{summary.active}</div></Panel>
      </div>

      {error && <Panel className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</Panel>}

      <Panel>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row">
            <input className={inputClass} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder={isRTL ? '???? ?????? ?? ??????' : 'Search by name or email'} />
            <select className={`${inputClass} sm:max-w-56`} value={filterAdmin} onChange={(e) => { setFilterAdmin(e.target.value); setPage(1) }}>
              <option value="">{isRTL ? '?? ???????' : 'All roles'}</option>
              <option value="false">{isRTL ? '????????' : 'Users'}</option>
              <option value="true">{isRTL ? '???????' : 'Admins'}</option>
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><Filter size={16} />{isRTL ? '??? ??? ??????' : 'Sorted newest first'}</div>
        </div>
      </Panel>

      <Panel className="overflow-hidden p-0">
        {loading ? <div className="p-5"><SkeletonRows rows={7} /></div> : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-white/5 dark:text-slate-400"><tr><th className="px-5 py-4 text-left rtl:text-right">{isRTL ? '????????' : 'User'}</th><th className="px-5 py-4 text-left rtl:text-right">{isRTL ? '?????' : 'Role'}</th><th className="px-5 py-4 text-left rtl:text-right">{isRTL ? '????????' : 'Subscription'}</th><th className="px-5 py-4 text-left rtl:text-right">{isRTL ? '??????' : 'Activity'}</th><th className="px-5 py-4 text-left rtl:text-right">{isRTL ? '????' : 'Joined'}</th><th className="px-5 py-4 text-right rtl:text-left">{isRTL ? '?????????' : 'Actions'}</th></tr></thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                  {users.map((user) => <tr key={user.id} className="transition hover:bg-slate-50 dark:hover:bg-white/5"><td className="px-5 py-4"><UserIdentity user={user} /></td><td className="px-5 py-4"><Badge tone={user.is_admin ? 'emerald' : 'slate'}>{user.is_admin ? (isRTL ? '?????' : 'Admin') : (isRTL ? '??????' : 'User')}</Badge></td><td className="px-5 py-4"><div className="font-bold text-slate-800 dark:text-slate-100">{user.subscription?.package?.name || (isRTL ? '???? ????' : 'No plan')}</div><div className="text-xs text-slate-500">{user.subscription?.status || 'inactive'}</div></td><td className="px-5 py-4 text-slate-600 dark:text-slate-300">{user.channels_count || 0} {isRTL ? '?????' : 'channels'} · {user.messages_count || 0} {isRTL ? '?????' : 'messages'}</td><td className="px-5 py-4 text-slate-500">{formatDate(user.created_at)}</td><td className="px-5 py-4"><div className="flex justify-end gap-2 rtl:justify-start"><Button variant="ghost" onClick={() => handleToggleAdmin(user)}><UserCog size={15} />{user.is_admin ? (isRTL ? '?????' : 'Revoke') : (isRTL ? '?????' : 'Promote')}</Button><Button variant="danger" onClick={() => handleDeleteUser(user)}><Trash2 size={15} />{isRTL ? '???' : 'Delete'}</Button></div></td></tr>)}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 p-4 lg:hidden">{users.map((user) => <div key={user.id} className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5"><div className="flex items-start justify-between gap-3"><UserIdentity user={user} /><Badge tone={user.is_admin ? 'emerald' : 'slate'}>{user.is_admin ? 'Admin' : 'User'}</Badge></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-500"><span>{formatDate(user.created_at)}</span><span>{user.channels_count || 0} channels</span></div><div className="mt-4 flex gap-2"><Button variant="ghost" className="flex-1" onClick={() => handleToggleAdmin(user)}><Shield size={15} />{user.is_admin ? 'Revoke' : 'Promote'}</Button><Button variant="danger" className="flex-1" onClick={() => handleDeleteUser(user)}><Trash2 size={15} />Delete</Button></div></div>)}</div>
            {users.length === 0 && <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">{isRTL ? '?? ???? ????? ??????.' : 'No matching users found.'}</div>}
          </>
        )}
      </Panel>

      {totalPages > 1 && <div className="flex items-center justify-center gap-2"><Button variant="ghost" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>{isRTL ? '??????' : 'Previous'}</Button><span className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm dark:bg-white/8 dark:text-slate-200">{page} / {totalPages}</span><Button variant="ghost" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>{isRTL ? '??????' : 'Next'}</Button></div>}
    </AdminShell>
  )
}

function UserIdentity({ user }: { user: User }) {
  const initials = (user.name || user.email || '?').slice(0, 1).toUpperCase()
  return <div className="flex min-w-0 items-center gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-sm font-black text-slate-950">{initials}</div><div className="min-w-0"><div className="truncate font-black text-slate-950 dark:text-white">{user.name}</div><div className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</div></div></div>
}



