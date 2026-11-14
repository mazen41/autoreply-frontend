'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  X,
  Check,
  CheckCheck,
  MessageSquare,
  AlertCircle,
  CreditCard,
  ThumbsDown,
  ArrowUpRight,
  Send,
  CheckCircle,
  Trash2,
  ExternalLink,
  Sparkles,
  Inbox,
  Filter,
} from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { useLang } from '../lib/LangContext'
import { getEcho } from '../lib/echo'

interface Notification {
  id: number
  type: string
  title: string
  message: string
  data?: unknown
  action_url?: string
  is_read: boolean
  read_at?: string
  created_at: string
}

function formatRelativeTime(dateString: string, isRTL: boolean): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffSec < 60) {
      return isRTL ? 'الآن' : 'Just now'
    }
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) {
      return isRTL ? `منذ ${diffMin} دقيقة` : `${diffMin}m ago`
    }
    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) {
      return isRTL ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`
    }
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) {
      return isRTL ? `منذ ${diffDays} يوم` : `${diffDays}d ago`
    }
    return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

export default function NotificationCenter() {
  const { user } = useAuth()
  const { isRTL } = useLang()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all')
  const receivedNotificationIds = useRef(new Set<number>())
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const markAsRead = async (notificationId: number) => {
    try {
      const token = document.cookie
        .split(';')
        .find((c) => c.trim().startsWith('naz_token='))
        ?.split('=')[1]
      if (!token) return

      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/notifications/${notificationId}/read`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }
      )
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = document.cookie
        .split(';')
        .find((c) => c.trim().startsWith('naz_token='))
        ?.split('=')[1]
      if (!token) return

      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/notifications/mark-all-read`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }
      )
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const deleteNotification = async (notificationId: number) => {
    try {
      const token = document.cookie
        .split(';')
        .find((c) => c.trim().startsWith('naz_token='))
        ?.split('=')[1]
      if (!token) return

      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/notifications/${notificationId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }
      )
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const getNotificationVisual = (type: string) => {
    switch (type) {
      case 'new_message':
        return {
          icon: <MessageSquare size={16} className="text-cyan-400" />,
          bg: 'bg-cyan-500/10 border-cyan-500/25',
        }
      case 'new_assignment':
        return {
          icon: <ArrowUpRight size={16} className="text-brand" />,
          bg: 'bg-brand/10 border-brand/25',
        }
      case 'failed_message':
        return {
          icon: <AlertCircle size={16} className="text-rose-400" />,
          bg: 'bg-rose-500/10 border-rose-500/25',
        }
      case 'overage_alert':
      case 'payment_failed':
        return {
          icon: <CreditCard size={16} className="text-amber-400" />,
          bg: 'bg-amber-500/10 border-amber-500/25',
        }
      case 'csat_negative':
        return {
          icon: <ThumbsDown size={16} className="text-orange-400" />,
          bg: 'bg-orange-500/10 border-orange-500/25',
        }
      case 'escalation':
        return {
          icon: <AlertCircle size={16} className="text-amber-400" />,
          bg: 'bg-amber-500/10 border-amber-500/25',
        }
      case 'campaign_sent':
        return {
          icon: <Send size={16} className="text-emerald-400" />,
          bg: 'bg-emerald-500/10 border-emerald-500/25',
        }
      case 'sequence_completed':
        return {
          icon: <CheckCircle size={16} className="text-emerald-400" />,
          bg: 'bg-emerald-500/10 border-emerald-500/25',
        }
      default:
        return {
          icon: <Bell size={16} className="text-text-tertiary" />,
          bg: 'bg-surface border-border',
        }
    }
  }

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const token = document.cookie
          .split(';')
          .find((c) => c.trim().startsWith('naz_token='))
          ?.split('=')[1]
        if (!token) return

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/notifications`,
          {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          }
        )
        if (!response.ok) throw new Error(`Notification request failed (${response.status}).`)
        const data = await response.json()
        const fetchedNotifications: Notification[] = data.notifications?.data || data.data || []
        fetchedNotifications.forEach((notification) =>
          receivedNotificationIds.current.add(notification.id)
        )
        setNotifications(fetchedNotifications)
        setUnreadCount(data.unread_count || 0)
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    void Promise.resolve().then(loadNotifications)

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
    if (!user?.id || !pusherKey) return

    const channelName = `user.${user.id}`
    const echo = getEcho()
    echo.private(channelName).listen('.new-notification', (notification: Notification) => {
      if (receivedNotificationIds.current.has(notification.id)) return
      receivedNotificationIds.current.add(notification.id)
      setNotifications((previous) => {
        return [{ ...notification, is_read: false }, ...previous]
      })
      setUnreadCount((previous) => previous + 1)
    })

    return () => {
      echo.leave(channelName)
    }
  }, [user?.id])

  const displayedNotifications = useMemo(() => {
    if (activeTab === 'unread') {
      return notifications.filter((n) => !n.is_read)
    }
    return notifications
  }, [notifications, activeTab])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Bell Trigger Button ────────────────────────────────────────────── */}
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/30 ${
          isOpen
            ? 'border-brand/50 bg-brand/10 text-brand shadow-sm'
            : 'border-border/70 bg-surface/60 text-text-secondary hover:border-brand/40 hover:bg-surface-elevated hover:text-text-primary'
        }`}
      >
        <Bell
          size={18}
          className={`transition-transform duration-200 ${
            unreadCount > 0 ? 'text-brand animate-[swing_2s_ease-in-out_infinite]' : ''
          }`}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-1 text-[10px] font-extrabold text-white shadow-md shadow-rose-500/30 ring-2 ring-background">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown Panel ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            dir={isRTL ? 'rtl' : 'ltr'}
            className="absolute end-0 mt-2.5 w-[360px] sm:w-[420px] max-w-[calc(100vw-1.5rem)] rounded-3xl border border-border/80 bg-surface-elevated/95 p-0 shadow-2xl backdrop-blur-2xl z-50 overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-3.5 bg-surface/50">
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm font-bold text-text-primary">
                  {isRTL ? 'الإشعارات والتنبيهات' : 'Notifications'}
                </h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-brand/15 border border-brand/30 px-2 py-0.5 text-[10px] font-bold text-brand">
                    {unreadCount} {isRTL ? 'جديد' : 'new'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-brand hover:bg-brand/10 transition-colors"
                    title={isRTL ? 'تحديد الكل كمقروء' : 'Mark all as read'}
                  >
                    <CheckCheck size={14} />
                    <span>{isRTL ? 'قراءة الكل' : 'Mark all read'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-text-tertiary hover:bg-surface-elevated hover:text-text-primary transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center border-b border-border/60 px-5 pt-2 pb-0 gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`pb-2.5 border-b-2 transition-all ${
                  activeTab === 'all'
                    ? 'border-brand text-brand'
                    : 'border-transparent text-text-tertiary hover:text-text-secondary'
                }`}
              >
                {isRTL ? 'الكل' : 'All'} ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('unread')}
                className={`pb-2.5 border-b-2 transition-all ${
                  activeTab === 'unread'
                    ? 'border-brand text-brand'
                    : 'border-transparent text-text-tertiary hover:text-text-secondary'
                }`}
              >
                {isRTL ? 'غير مقروءة' : 'Unread'} ({unreadCount})
              </button>
            </div>

            {/* Notification Stream */}
            <div
              data-lenis-prevent
              className="max-h-[380px] overflow-y-auto divide-y divide-border/40"
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                  <p className="mt-3 text-xs font-medium text-text-tertiary">
                    {isRTL ? 'جارٍ تحميل التنبيهات...' : 'Loading notifications...'}
                  </p>
                </div>
              ) : displayedNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-surface/50 text-text-tertiary mb-3">
                    <Inbox size={22} className="opacity-70" />
                  </div>
                  <p className="text-xs font-bold text-text-primary">
                    {activeTab === 'unread'
                      ? isRTL ? 'لا توجد إشعارات غير مقروءة' : 'No unread notifications'
                      : isRTL ? 'لا توجد إشعارات حالياً' : 'No notifications'}
                  </p>
                  <p className="mt-1 text-[11px] text-text-tertiary">
                    {isRTL ? 'أنت على اطلاع تام بكافة التحديثات والنشاطات.' : "You're all caught up with your business activity."}
                  </p>
                </div>
              ) : (
                displayedNotifications.map((notification) => {
                  const visual = getNotificationVisual(notification.type)
                  return (
                    <div
                      key={notification.id}
                      className={`group relative flex items-start gap-3.5 p-4 transition-all ${
                        !notification.is_read
                          ? 'bg-brand/[0.04] dark:bg-brand/[0.08]'
                          : 'hover:bg-surface-elevated/60'
                      }`}
                    >
                      {/* Unread Accent Pill */}
                      {!notification.is_read && (
                        <span className="absolute top-4 start-1.5 h-2 w-2 rounded-full bg-brand shadow-sm shadow-brand/40" />
                      )}

                      {/* Icon */}
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${visual.bg} shadow-inner mt-0.5`}
                      >
                        {visual.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            className={`text-xs font-bold truncate ${
                              !notification.is_read ? 'text-text-primary' : 'text-text-secondary'
                            }`}
                          >
                            {notification.title}
                          </h4>
                          <span className="text-[10px] text-text-tertiary shrink-0 tabular-nums">
                            {formatRelativeTime(notification.created_at, isRTL)}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-text-secondary leading-relaxed line-clamp-2">
                          {notification.message}
                        </p>

                        {/* Action Link if URL exists */}
                        {notification.action_url && (
                          <a
                            href={notification.action_url}
                            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:underline"
                          >
                            <span>{isRTL ? 'عرض التفاصيل' : 'View details'}</span>
                            <ExternalLink size={11} className={isRTL ? 'rotate-180' : ''} />
                          </a>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.is_read && (
                          <button
                            type="button"
                            onClick={() => markAsRead(notification.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-tertiary hover:bg-brand/10 hover:text-brand transition-colors"
                            title={isRTL ? 'تحديد كمقروء' : 'Mark as read'}
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteNotification(notification.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-text-tertiary hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                          title={isRTL ? 'حذف' : 'Delete'}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
