'use client'

import React, { useState, useEffect } from 'react'
import { useLang } from '../../../lib/LangContext'

interface Post {
  id: number
  title: string
  slug: string
  excerpt: string | null
  category: string | null
  tags: string[] | null
  status: 'draft' | 'published'
  featured_image_url: string | null
  published_at: string | null
  created_at: string
}

export default function AdminBlogPage() {
  const { t, isRTL } = useLang()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    excerpt: '',
    category: '',
    tags: '',
    featured_image_url: '',
  })

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const token = document.cookie.replace(/(?:(?:^|.*;\s*)naz_token\s*=\s*([^;]*).*$)|^.*$/, "$1")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/posts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch posts')
      }

      const data = await response.json()
      setPosts(data.data || [])
    } catch (error: any) {
      console.error('Failed to fetch posts:', error)
      setError(error.message || 'Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const token = document.cookie.replace(/(?:(?:^|.*;\s*)naz_token\s*=\s*([^;]*).*$)|^.*$/, "$1")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          body: formData.body,
          excerpt: formData.excerpt || null,
          category: formData.category || null,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : null,
          featured_image_url: formData.featured_image_url || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create post')
      }

      setSuccess(isRTL ? 'تم إنشاء المقال بنجاح' : 'Post created successfully')
      setShowModal(false)
      setFormData({ title: '', body: '', excerpt: '', category: '', tags: '', featured_image_url: '' })
      fetchPosts()
    } catch (error: any) {
      console.error('Failed to create post:', error)
      setError(error.message || 'Failed to create post')
    }
  }

  const handlePublish = async (postId: number) => {
    try {
      const token = document.cookie.replace(/(?:(?:^|.*;\s*)naz_token\s*=\s*([^;]*).*$)|^.*$/, "$1")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}/publish`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to publish post')
      }

      setSuccess(isRTL ? 'تم نشر المقال بنجاح' : 'Post published successfully')
      fetchPosts()
    } catch (error: any) {
      console.error('Failed to publish post:', error)
      setError(error.message)
    }
  }

  const handleReject = async (postId: number) => {
    if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذه المسودة؟' : 'Are you sure you want to delete this draft?')) {
      return
    }

    try {
      const token = document.cookie.replace(/(?:(?:^|.*;\s*)naz_token\s*=\s*([^;]*).*$)|^.*$/, "$1")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete post')
      }

      setSuccess(isRTL ? 'تم حذف المسودة' : 'Draft deleted successfully')
      fetchPosts()
    } catch (error: any) {
      console.error('Failed to delete post:', error)
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
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>
            {isRTL ? 'المدونة' : 'Blog'}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {isRTL ? 'إدارة المقالات والمحتوى' : 'Manage posts and content'}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 rounded-xl font-bold transition-all"
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent))',
            color: 'var(--surface)',
          }}
        >
          {isRTL ? '+ مقال جديد' : '+ New Post'}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl" style={{ background: 'var(--accent-subtle)', color: 'var(--error)' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
          {success}
        </div>
      )}

      {/* Posts Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="text-left p-4" style={{ color: 'var(--text-secondary)' }}>
                {isRTL ? 'العنوان' : 'Title'}
              </th>
              <th className="text-left p-4" style={{ color: 'var(--text-secondary)' }}>
                {isRTL ? 'التصنيف' : 'Category'}
              </th>
              <th className="text-left p-4" style={{ color: 'var(--text-secondary)' }}>
                {isRTL ? 'الحالة' : 'Status'}
              </th>
              <th className="text-left p-4" style={{ color: 'var(--text-secondary)' }}>
                {isRTL ? 'التاريخ' : 'Date'}
              </th>
              <th className="text-right p-4" style={{ color: 'var(--text-secondary)' }}>
                {isRTL ? 'الإجراءات' : 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
                  {isRTL ? 'لا توجد مقالات' : 'No posts yet'}
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="p-4">
                    <div>
                      <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{post.title}</div>
                      <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        {post.slug}
                      </div>
                    </div>
                  </td>
                  <td className="p-4" style={{ color: 'var(--text-secondary)' }}>
                    {post.category || '-'}
                  </td>
                  <td className="p-4">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        background: post.status === 'published' ? 'var(--accent-subtle)' : 'var(--border)',
                        color: post.status === 'published' ? 'var(--accent)' : 'var(--text-secondary)',
                      }}
                    >
                      {post.status === 'published' ? (isRTL ? 'منشور' : 'Published') : (isRTL ? 'مسودة' : 'Draft')}
                    </span>
                  </td>
                  <td className="p-4" style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(post.published_at || post.created_at)}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {post.status === 'draft' && (
                        <>
                          <button
                            onClick={() => handlePublish(post.id)}
                            className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                            style={{
                              background: 'var(--accent-subtle)',
                              color: 'var(--accent)',
                              border: '1px solid var(--accent-focus)',
                            }}
                          >
                            {isRTL ? 'نشر' : 'Publish'}
                          </button>
                          <button
                            onClick={() => handleReject(post.id)}
                            className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                            style={{
                              background: 'var(--accent-subtle)',
                              color: 'var(--error)',
                              border: '1px solid var(--accent-focus)',
                            }}
                          >
                            {isRTL ? 'حذف' : 'Delete'}
                          </button>
                        </>
                      )}
                      {post.status === 'published' && (
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {isRTL ? 'منشور' : 'Published'}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Post Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'color-mix(in srgb, var(--text-primary) 80%, transparent)' }}>
          <div className="rounded-2xl p-6 w-full max-w-2xl" style={{ background: 'var(--surface)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {isRTL ? 'مقال جديد' : 'New Post'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-2xl"
                style={{ color: 'var(--text-secondary)' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {isRTL ? 'العنوان' : 'Title'}
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-transparent"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {isRTL ? 'المحتوى' : 'Content'}
                </label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  required
                  rows={10}
                  className="w-full px-4 py-3 rounded-xl bg-transparent"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-primary)', resize: 'vertical' }}
                />
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {isRTL ? 'مقتطف (اختياري)' : 'Excerpt (optional)'}
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-transparent"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-primary)', resize: 'vertical' }}
                />
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {isRTL ? 'التصنيف (اختياري)' : 'Category (optional)'}
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-transparent"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {isRTL ? 'الوسوم (اختياري - مفصولة بفواصل)' : 'Tags (optional - comma separated)'}
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-transparent"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {isRTL ? 'رابط الصورة المميزة (اختياري)' : 'Featured Image URL (optional)'}
                </label>
                <input
                  type="text"
                  value={formData.featured_image_url}
                  onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-transparent"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-bold transition-all"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent), var(--accent))',
                    color: 'var(--surface)',
                  }}
                >
                  {isRTL ? 'إنشاء كمسودة' : 'Create as Draft'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 rounded-xl font-bold transition-all"
                  style={{
                    background: 'var(--border)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
