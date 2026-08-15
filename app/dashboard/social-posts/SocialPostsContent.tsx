'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'
import toast from 'react-hot-toast'

interface ScheduledPost {
  id: number
  business_id: number
  platform: string
  content: string
  media_urls: string[] | null
  scheduled_at: string
  status: string
  published_at: string | null
  error_message: string | null
  created_at: string
}

export default function SocialPostsContent() {
  const { isRTL, t } = useLang()
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('')

  // Form state
  const [form, setForm] = useState({
    platform: 'facebook',
    content: '',
    media_urls: '',
    scheduled_at: '',
  })

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const params = new URLSearchParams()
      if (filterStatus) params.append('status', filterStatus)
      if (filterPlatform) params.append('platform', filterPlatform)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/social-posts?${params}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        setPosts(data.data || data)
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!form.content || !form.scheduled_at) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const payload = {
        ...form,
        media_urls: form.media_urls ? form.media_urls.split(',').map(u => u.trim()) : null,
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/social-posts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (res.ok) {
        toast.success('Post scheduled successfully')
        setShowModal(false)
        setForm({
          platform: 'facebook',
          content: '',
          media_urls: '',
          scheduled_at: '',
        })
        fetchPosts()
      } else {
        toast.error(data.error || 'Failed to schedule post')
      }
    } catch (error) {
      toast.error('Failed to schedule post')
    }
  }

  const handleCancel = async (postId: number) => {
    if (!confirm('Are you sure you want to cancel this post?')) return

    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/social-posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.ok) {
        toast.success('Post cancelled')
        fetchPosts()
      } else {
        toast.error('Failed to cancel post')
      }
    } catch (error) {
      toast.error('Failed to cancel post')
    }
  }

  const handlePublishNow = async (postId: number) => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/social-posts/${postId}/publish-now`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })

      if (res.ok) {
        toast.success('Post published successfully')
        fetchPosts()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to publish post')
      }
    } catch (error) {
      toast.error('Failed to publish post')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 rounded-full border-2 border-white/10 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-black mb-2" style={{ fontSize: 'clamp(1.8rem,3vw,2.4rem)', color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
          Social Automation
        </h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          Schedule and manage your social media posts
        </p>
      </motion.div>

      {/* Filters and Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-center gap-4"
      >
        <select
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value)}
          className="px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          <option value="">All Platforms</option>
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
          <option value="twitter">Twitter</option>
          <option value="linkedin">LinkedIn</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          <option value="">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
          <option value="failed">Failed</option>
        </select>
        <button
          onClick={() => fetchPosts()}
          className="px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          Apply Filters
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
          style={{ background: 'var(--accent)', color: 'var(--text-primary)' }}
        >
          + Schedule Post
        </button>
      </motion.div>

      {/* Posts List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="premium-card p-6"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
      >
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg mb-4" style={{ color: 'var(--text-tertiary)' }}>No scheduled posts</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200"
              style={{ background: 'var(--accent)', color: 'var(--text-primary)' }}
            >
              Schedule Your First Post
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium capitalize" style={{ color: 'var(--accent)' }}>
                        {post.platform}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        post.status === 'published' ? 'bg-green-500/20 text-green-500' :
                        post.status === 'scheduled' ? 'bg-blue-500/20 text-blue-500' :
                        'bg-red-500/20 text-red-500'
                      }`}>
                        {post.status}
                      </span>
                    </div>
                    <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                      {post.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      <span>Scheduled: {new Date(post.scheduled_at).toLocaleString()}</span>
                      {post.published_at && <span>Published: {new Date(post.published_at).toLocaleString()}</span>}
                    </div>
                    {post.error_message && (
                      <p className="text-xs mt-2" style={{ color: 'var(--error)' }}>
                        Error: {post.error_message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {post.status === 'scheduled' && (
                      <>
                        <button
                          onClick={() => handlePublishNow(post.id)}
                          className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                          style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                        >
                          Publish Now
                        </button>
                        <button
                          onClick={() => handleCancel(post.id)}
                          className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                          style={{ background: 'var(--error-subtle)', color: 'var(--error)' }}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Create Post Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md p-6 rounded-2xl" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
              Schedule Post
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Platform *</label>
                <select
                  value={form.platform}
                  onChange={(e) => setForm({ ...form, platform: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="twitter">Twitter</option>
                  <option value="linkedin">LinkedIn</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Content *</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Write your post content..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 resize-none"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Media URLs (comma-separated)</label>
                <input
                  type="text"
                  value={form.media_urls}
                  onChange={(e) => setForm({ ...form, media_urls: e.target.value })}
                  placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Scheduled At *</label>
                <input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200"
                style={{ background: 'var(--accent)', color: 'var(--text-primary)' }}
              >
                Schedule Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}