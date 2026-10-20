'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, MessageSquare, AlertCircle, CreditCard, ThumbsDown, ArrowUpRight, Send, CheckCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { getEcho } from '../lib/echo';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: unknown;
  action_url?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export default function NotificationCenter() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const receivedNotificationIds = useRef(new Set<number>());

  const markAsRead = async (notificationId: number) => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/notifications/${notificationId}/read`, { 
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/notifications/mark-all-read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/notifications/${notificationId}`, { 
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_message':
        return <MessageSquare className="w-5 h-5 text-info" />;
      case 'new_assignment':
        return <ArrowUpRight className="w-5 h-5 text-brand" />;
      case 'failed_message':
        return <AlertCircle className="w-5 h-5 text-error" />;
      case 'overage_alert':
      case 'payment_failed':
        return <CreditCard className="w-5 h-5 text-warning" />;
      case 'csat_negative':
        return <ThumbsDown className="w-5 h-5 text-error" />;
      case 'escalation':
        return <AlertCircle className="w-5 h-5 text-warning" />;
      case 'campaign_sent':
        return <Send className="w-5 h-5 text-success" />;
      case 'sequence_completed':
        return <CheckCircle className="w-5 h-5 text-success" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
        if (!token) return

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        if (!response.ok) throw new Error(`Notification request failed (${response.status}).`);
        const data = await response.json();
        const fetchedNotifications: Notification[] = data.notifications?.data || data.data || [];
        fetchedNotifications.forEach((notification) => receivedNotificationIds.current.add(notification.id));
        setNotifications(fetchedNotifications);
        setUnreadCount(data.unread_count || 0);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    void Promise.resolve().then(loadNotifications);

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    if (!user?.id || !pusherKey) return;

    const channelName = `user.${user.id}`;
    const echo = getEcho();
    echo.private(channelName).listen('.new-notification', (notification: Notification) => {
      if (receivedNotificationIds.current.has(notification.id)) return;
      receivedNotificationIds.current.add(notification.id);
      setNotifications((previous) => {
        return [{ ...notification, is_read: false }, ...previous];
      });
      setUnreadCount((previous) => previous + 1);
    });

    return () => {
      echo.leave(channelName);
    };
  }, [user?.id]);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-error text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-info hover:text-info"
                >
                  Mark all read
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No notifications</p>
              </div>
            ) : (
              Array.isArray(notifications) && notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${
                    !notification.is_read ? 'bg-info dark:bg-info/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-white">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-info hover:text-info"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-gray-400 hover:text-error"
                        title="Delete"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {notification.action_url && (
                    <a
                      href={notification.action_url}
                      className="mt-2 text-sm text-info hover:text-info inline-block"
                    >
                      View →
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
