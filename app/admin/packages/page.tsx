'use client'

import React, { useState, useEffect } from 'react'
import { useLang } from '../../../lib/LangContext'

interface Package {
  id: number
  name: string
  name_ar: string
  description: string
  description_ar: string
  price_monthly: number
  price_yearly: number
  ai_replies_limit: number
  channels_limit: number
  tools_limit: number
  blog_posts_limit: number
  features: string[]
  features_ar: string[]
  is_popular: boolean
  is_active: boolean
  sort_order: number
  subscriptions_count?: number
}

export default function AdminPackagesPage() {
  const { t, isRTL } = useLang()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPackage, setEditingPackage] = useState<Package | null>(null)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    description: '',
    description_ar: '',
    price_monthly: 0,
    price_yearly: 0,
    ai_replies_limit: -1,
    channels_limit: -1,
    tools_limit: -1,
    blog_posts_limit: -1,
    features: [] as string[],
    features_ar: [] as string[],
    is_popular: false,
    is_active: true,
    sort_order: 0,
  })

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/packages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch packages')
      }

      const data = await response.json()
      setPackages(data)
    } catch (error: any) {
      console.error('Failed to fetch packages:', error)
      setError(error.message || 'Failed to load packages')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingPackage(null)
    setFormData({
      name: '',
      name_ar: '',
      description: '',
      description_ar: '',
      price_monthly: 0,
      price_yearly: 0,
      ai_replies_limit: -1,
      channels_limit: -1,
      tools_limit: -1,
      blog_posts_limit: -1,
      features: [],
      features_ar: [],
      is_popular: false,
      is_active: true,
      sort_order: 0,
    })
    setShowModal(true)
  }

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg)
    setFormData({
      name: pkg.name,
      name_ar: pkg.name_ar,
      description: pkg.description,
      description_ar: pkg.description_ar,
      price_monthly: pkg.price_monthly,
      price_yearly: pkg.price_yearly,
      ai_replies_limit: pkg.ai_replies_limit,
      channels_limit: pkg.channels_limit,
      tools_limit: pkg.tools_limit,
      blog_posts_limit: pkg.blog_posts_limit,
      features: pkg.features || [],
      features_ar: pkg.features_ar || [],
      is_popular: pkg.is_popular,
      is_active: pkg.is_active,
      sort_order: pkg.sort_order,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذه الباقة؟' : 'Are you sure you want to delete this package?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/packages/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete package')
      }

      fetchPackages()
    } catch (error: any) {
      console.error('Failed to delete package:', error)
      setError(error.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const token = localStorage.getItem('token')
      const url = editingPackage
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/packages/${editingPackage.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/packages`

      const response = await fetch(url, {
        method: editingPackage ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to save package')
      }

      setShowModal(false)
      fetchPackages()
    } catch (error: any) {
      console.error('Failed to save package:', error)
      setError(error.message)
    }
  }

  const handleFeatureChange = (index: number, value: string, isAr: boolean = false) => {
    const features = isAr ? [...formData.features_ar] : [...formData.features]
    features[index] = value
    if (isAr) {
      setFormData({ ...formData, features_ar: features })
    } else {
      setFormData({ ...formData, features })
    }
  }

  const addFeature = (isAr: boolean = false) => {
    if (isAr) {
      setFormData({ ...formData, features_ar: [...formData.features_ar, ''] })
    } else {
      setFormData({ ...formData, features: [...formData.features, ''] })
    }
  }

  const removeFeature = (index: number, isAr: boolean = false) => {
    const features = isAr ? [...formData.features_ar] : [...formData.features]
    features.splice(index, 1)
    if (isAr) {
      setFormData({ ...formData, features_ar: features })
    } else {
      setFormData({ ...formData, features })
    }
  }

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `${price} SAR`
  }

  const getLimitDisplay = (limit: number) => {
    return limit === -1 ? (isRTL ? 'غير محدود' : 'Unlimited') : limit.toString()
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
            {isRTL ? 'الباقات' : 'Packages'}
          </h1>
          <p style={{ color: 'rgba(240,240,255,0.6)' }}>
            {isRTL ? 'إدارة الباقات والأسعار' : 'Manage packages and pricing'}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-6 py-3 rounded-xl font-bold transition-all"
          style={{
            background: 'linear-gradient(135deg, #00FFB2, #BF00FF)',
            color: '#050508',
          }}
        >
          {isRTL ? '+ إضافة باقة' : '+ Add Package'}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,0,0,0.1)', color: '#FF6B6B' }}>
          {error}
        </div>
      )}

      {/* Packages Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="rounded-2xl p-6 relative"
            style={{
              background: '#0F0F1A',
              border: pkg.is_popular ? '2px solid #00FFB2' : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {pkg.is_popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: '#00FFB2', color: '#050508' }}>
                  {isRTL ? 'الأكثر طلباً' : 'Popular'}
                </span>
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-xl font-bold mb-1" style={{ color: '#F0F0FF' }}>{pkg.name}</h3>
              <p className="text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>{pkg.name_ar}</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black" style={{ color: '#00FFB2' }}>
                  {formatPrice(pkg.price_monthly)}
                </span>
                <span className="text-sm" style={{ color: 'rgba(240,240,255,0.6)' }}>
                  /{isRTL ? 'شهر' : 'month'}
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-4 text-sm" style={{ color: 'rgba(240,240,255,0.6)' }}>
              <div className="flex justify-between">
                <span>{isRTL ? 'ردود AI' : 'AI Replies'}:</span>
                <span style={{ color: '#F0F0FF' }}>{getLimitDisplay(pkg.ai_replies_limit)}</span>
              </div>
              <div className="flex justify-between">
                <span>{isRTL ? 'قنوات' : 'Channels'}:</span>
                <span style={{ color: '#F0F0FF' }}>{getLimitDisplay(pkg.channels_limit)}</span>
              </div>
              <div className="flex justify-between">
                <span>{isRTL ? 'أدوات' : 'Tools'}:</span>
                <span style={{ color: '#F0F0FF' }}>{getLimitDisplay(pkg.tools_limit)}</span>
              </div>
              <div className="flex justify-between">
                <span>{isRTL ? 'مقالات' : 'Blog Posts'}:</span>
                <span style={{ color: '#F0F0FF' }}>{getLimitDisplay(pkg.blog_posts_limit)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span
                className="px-2 py-1 rounded text-xs"
                style={{
                  background: pkg.is_active ? 'rgba(0,255,178,0.1)' : 'rgba(255,107,107,0.1)',
                  color: pkg.is_active ? '#00FFB2' : '#FF6B6B',
                }}
              >
                {pkg.is_active ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'معطل' : 'Inactive')}
              </span>
              {pkg.subscriptions_count !== undefined && (
                <span className="text-sm" style={{ color: 'rgba(240,240,255,0.6)' }}>
                  {pkg.subscriptions_count} {isRTL ? 'مشترك' : 'subscribers'}
                </span>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleEdit(pkg)}
                className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
                style={{
                  background: 'rgba(0,255,178,0.1)',
                  color: '#00FFB2',
                }}
              >
                {isRTL ? 'تعديل' : 'Edit'}
              </button>
              <button
                onClick={() => handleDelete(pkg.id)}
                className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
                style={{
                  background: 'rgba(255,107,107,0.1)',
                  color: '#FF6B6B',
                }}
              >
                {isRTL ? 'حذف' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-auto" style={{ background: '#0F0F1A' }}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#F0F0FF' }}>
              {editingPackage ? (isRTL ? 'تعديل الباقة' : 'Edit Package') : (isRTL ? 'إضافة باقة جديدة' : 'Add New Package')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                    {isRTL ? 'الاسم (إنجليزي)' : 'Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-transparent"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0FF' }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                    {isRTL ? 'الاسم (عربي)' : 'Name (Arabic)'}
                  </label>
                  <input
                    type="text"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-transparent"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0FF' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                    {isRTL ? 'الوصف (إنجليزي)' : 'Description (English)'}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-transparent"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0FF' }}
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                    {isRTL ? 'الوصف (عربي)' : 'Description (Arabic)'}
                  </label>
                  <textarea
                    value={formData.description_ar}
                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-transparent"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0FF' }}
                    rows={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                    {isRTL ? 'السعر الشهري' : 'Monthly Price'}
                  </label>
                  <input
                    type="number"
                    value={formData.price_monthly}
                    onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-transparent"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0FF' }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                    {isRTL ? 'السعر السنوي' : 'Yearly Price'}
                  </label>
                  <input
                    type="number"
                    value={formData.price_yearly}
                    onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-transparent"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0FF' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                    {isRTL ? 'حد الردود' : 'AI Replies'}
                  </label>
                  <input
                    type="number"
                    value={formData.ai_replies_limit}
                    onChange={(e) => setFormData({ ...formData, ai_replies_limit: parseInt(e.target.value) || -1 })}
                    className="w-full px-4 py-3 rounded-xl bg-transparent"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0FF' }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                    {isRTL ? 'حد القنوات' : 'Channels'}
                  </label>
                  <input
                    type="number"
                    value={formData.channels_limit}
                    onChange={(e) => setFormData({ ...formData, channels_limit: parseInt(e.target.value) || -1 })}
                    className="w-full px-4 py-3 rounded-xl bg-transparent"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0FF' }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                    {isRTL ? 'حد الأدوات' : 'Tools'}
                  </label>
                  <input
                    type="number"
                    value={formData.tools_limit}
                    onChange={(e) => setFormData({ ...formData, tools_limit: parseInt(e.target.value) || -1 })}
                    className="w-full px-4 py-3 rounded-xl bg-transparent"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0FF' }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                    {isRTL ? 'حد المقالات' : 'Blog Posts'}
                  </label>
                  <input
                    type="number"
                    value={formData.blog_posts_limit}
                    onChange={(e) => setFormData({ ...formData, blog_posts_limit: parseInt(e.target.value) || -1 })}
                    className="w-full px-4 py-3 rounded-xl bg-transparent"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0FF' }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_popular}
                    onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span style={{ color: 'rgba(240,240,255,0.6)' }}>{isRTL ? 'الأكثر طلباً' : 'Popular'}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span style={{ color: 'rgba(240,240,255,0.6)' }}>{isRTL ? 'نشط' : 'Active'}</span>
                </label>
                <div>
                  <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                    {isRTL ? 'الترتيب' : 'Sort Order'}
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-20 px-4 py-3 rounded-xl bg-transparent"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0FF' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                  {isRTL ? 'المميزات (إنجليزي)' : 'Features (English)'}
                </label>
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl bg-transparent"
                      style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0FF' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="px-3 py-3 rounded-xl"
                      style={{ background: 'rgba(255,107,107,0.1)', color: '#FF6B6B' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addFeature()}
                  className="text-sm" style={{ color: '#00FFB2' }}
                >
                  + {isRTL ? 'إضافة ميزة' : 'Add Feature'}
                </button>
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: 'rgba(240,240,255,0.6)' }}>
                  {isRTL ? 'المميزات (عربي)' : 'Features (Arabic)'}
                </label>
                {formData.features_ar.map((feature, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value, true)}
                      className="flex-1 px-4 py-3 rounded-xl bg-transparent"
                      style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0FF' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeFeature(index, true)}
                      className="px-3 py-3 rounded-xl"
                      style={{ background: 'rgba(255,107,107,0.1)', color: '#FF6B6B' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addFeature(true)}
                  className="text-sm" style={{ color: '#00FFB2' }}
                >
                  + {isRTL ? 'إضافة ميزة' : 'Add Feature'}
                </button>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-bold transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #00FFB2, #BF00FF)',
                    color: '#050508',
                  }}
                >
                  {isRTL ? 'حفظ' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    color: '#F0F0FF',
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
