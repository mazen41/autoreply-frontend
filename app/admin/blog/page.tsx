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
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00FFB2]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black mb-2" style={{ color: '#F0F0FF' }}>
            {isRTL ? 'المدونة' : 'Blog'}
          </h1>
          <p style={{ color: 'rgba(240,240,255,0.6)' }}>
            {isRTL ? 'إدارة المقالات والمحتوى' : 'Manage posts and content'}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 rounded-xl font-bold transition-all"
          style={{
            background: 'linear-gradient(135deg, #00FFB2, #BF00FF)',
            color: '#050508',
          }}
        >
          {isRTL ? '+ مقال جديد' : '+ New Post'}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,0,0,0.1)', color: '#FF6B6B' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl" style={{ background: 'rgba(0,255,178,0.1)', color: '#00FFB2' }}>
          {success}
        </div>
      )}

      {/* Posts Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#0F0F1A' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th className="text-left p-4" style={{ color: 'rgba(240,240,255,0.6)' }}>
                {isRTL ? 'العنوان' : 'Title'}
              </th>
              <th className="text-left p-4" style={{ color: 'rgba(240,240,255,0.6)' }}>
                {isRTL ? 'التصنيف' : 'Category'}
              </th>
              <th className="text-left p-4" style={{ color: 'rgba(240,240,255,0.6)' }}>
                {isRTL ? 'الحالة' : 'Status'}
              </th>
              <th className="text-left p-4" style={{ color: 'rgba(240,240,255,0.6)' }}>
                {isRTL ? 'التاريخ' : 'Date'}
              </th>
              <th className="text-right p-4" style={{ color: 'rgba(240,240,255,0.6)' }}>
                {isRTL ? 'الإجراءات' : 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center" style={{ color: 'rgba(240,240,255,0.4)' }}>
                  {isRTL ? 'لا توجد مقالات' : 'No posts yet'}
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td className="p-4">
                    <div>
                      <div className="font-bold" style={{ color: '#F0F0FF' }}>{post.title}</div>
                      <div className="text-xs mt-1" style={{ color: 'rgba(240,240,255,0.4)' }}>
                        {post.slug}
                      </div>
                    </div>
                  </td>
                  <td className="p-4" style={{ color: 'rgba(240,240,255,0.6)' }}>
                    {post.category || '-'}
                  </td>
                  <td className="p-4">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        background: post.status === 'published' ? 'rgba(0,255,178,0.1)' : 'rgba(255,255,255,0.05)',
                        color: post.status === 'published' ? '#00FFB2' : 'rgba(240,240,255,0.6)',
                      }}
                    >
                      {post.status === 'published' ? (isRTL ? 'منشور' : 'Published') : (isRTL ? 'مسودة' : 'Draft')}
                    </span>
                  </td>
                  <td className="p-4" style={{ color: 'rgba(240,240,255,0.6)' }}>
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
                              background: 'rgba(0,255,178,0.1)',
                              color: '#00FFB2',
                              border: '1px solid rgba(0,255,178,0.3)',
                            }}
                          >
                            {isRTL ? 'نشر' : 'Publish'}
                          </button>
                          <button
                            onClick={() => handleReject(post.id)}
                            className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                            style={{
                              background: 'rgba(255,107,107,0.1)',
                              color: '#FF6B6B',
                              border: '1px solid rgba(255,107,107,0.3)',
                            }}
                          >
                            {isRTL ? 'حذف' : 'Delete'}
                          </button>
                        </>
                      )}
                      {post.status === 'published' && (
                        <span className="text-xs" style={{ color: 'rgba(240,240,255,0.4)' }}>
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
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="rounded-2xl p-6 w-full max-w-2xl" style={{ background: '#0F0F1A', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: '#F0F0FF' }}>
                {isRTL ? 'مقال جديد' : 'New Post'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-2xl"
                style={{ color: 'rgba(240,240,255,0.6)' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                  {isRTL ? 'العنوان' : 'Title'}
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-transparent"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0FF' }}
                />
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                  {isRTL ? 'المحتوى' : 'Content'}
                </label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  required
                  rows={10}
                  className="w-full px-4 py-3 rounded-xl bg-transparent"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0FF', resize: 'vertical' }}
                />
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                  {isRTL ? 'مقتطف (اختياري)' : 'Excerpt (optional)'}
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-transparent"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0FF', resize: 'vertical' }}
                />
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                  {isRTL ? 'التصنيف (اختياري)' : 'Category (optional)'}
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-transparent"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0FF' }}
                />
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                  {isRTL ? 'الوسوم (اختياري - مفصولة بفواصل)' : 'Tags (optional - comma separated)'}
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-transparent"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0FF' }}
                />
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                  {isRTL ? 'رابط الصورة المميزة (اختياري)' : 'Featured Image URL (optional)'}
                </label>
                <input
                  type="text"
                  value={formData.featured_image_url}
                  onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-transparent"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0FF' }}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-bold transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #00FFB2, #BF00FF)',
                    color: '#050508',
                  }}
                >
                  {isRTL ? 'إنشاء كمسودة' : 'Create as Draft'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 rounded-xl font-bold transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(240,240,255,0.6)',
                    border: '1px solid rgba(255,255,255,0.1)',
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
