'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useLang } from '../../../lib/LangContext'
import toast from 'react-hot-toast'

interface Product {
  id: number
  business_id: number
  external_id: string | null
  source_platform: string
  name: string
  description: string | null
  sku: string | null
  price: number | null
  currency: string
  inventory: number | null
  status: string
  product_url: string | null
  images: string[] | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, unknown>
  synced_at: string | null
}

interface ProductStats {
  total: number
  active: number
  low_stock: number
  last_sync: string | null
}

export default function ProductsContent() {
  const { isRTL } = useLang()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [filterPlatform, setFilterPlatform] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState<ProductStats | null>(null)

  const parentRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140,
    overscan: 5,
  })

  useEffect(() => {
    fetchProducts()
    fetchStats()
  }, [])

  const fetchProducts = async () => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const params = new URLSearchParams()
      if (filterPlatform) params.append('source_platform', filterPlatform)
      if (filterStatus) params.append('status', filterStatus)
      if (searchQuery) params.append('search', searchQuery)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/products?${params}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        setProducts(data.data || data)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/products/stats`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleSync = async (platform?: string) => {
    setSyncing(true)
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const url = platform
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/products/sync/${platform}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/products/sync`

      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const data = await res.json()

      if (res.ok) {
        toast.success('Products synced successfully')
        fetchProducts()
        fetchStats()
      } else {
        toast.error(data.error || 'Failed to sync products')
      }
    } catch (error) {
      toast.error('Failed to sync products')
    } finally {
      setSyncing(false)
    }
  }

  const handleSearch = async () => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/products/search`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      })
      const data = await res.json()

      if (res.ok) {
        setProducts(data.products || [])
      } else {
        toast.error(data.error || 'Search failed')
      }
    } catch (error) {
      toast.error('Search failed')
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
      <div>
        <h1 className="font-black mb-2" style={{ fontSize: 'clamp(1.8rem,3vw,2.4rem)', color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
          Product Catalog
        </h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          Manage your e-commerce products from connected platforms
        </p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="p-4 rounded-xl" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Total Products</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.total}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Active</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{stats.active}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Low Stock</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--error)' }}>{stats.low_stock}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Last Sync</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {stats.last_sync ? new Date(stats.last_sync).toLocaleDateString() : 'Never'}
            </p>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex-1 min-w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        <select
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value)}
          className="px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          <option value="">All Platforms</option>
          <option value="shopify">Shopify</option>
          <option value="woocommerce">WooCommerce</option>
          <option value="salla">Salla</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          onClick={() => fetchProducts()}
          className="px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          Apply Filters
        </button>
        <button
          onClick={handleSearch}
          className="px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
          style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-focus)', color: 'var(--accent)' }}
        >
          Search
        </button>
        <button
          onClick={() => handleSync()}
          disabled={syncing}
          className="px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2"
          style={{ background: syncing ? 'var(--accent-focus)' : 'var(--accent)', color: 'var(--text-primary)' }}
        >
          {syncing && (
            <div className="animate-spin w-4 h-4 rounded-full border-2 border-current border-t-transparent"></div>
          )}
          Sync All
        </button>
      </div>

      {/* Products List */}
      <div
        className="premium-card p-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
      >
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg mb-4" style={{ color: 'var(--text-tertiary)' }}>No products found</p>
            <button
              onClick={() => handleSync()}
              disabled={syncing}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200"
              style={{ background: syncing ? 'var(--accent-focus)' : 'var(--accent)', color: 'var(--text-primary)' }}
            >
              {syncing ? 'Syncing...' : 'Sync Products'}
            </button>
          </div>
        ) : (
          <div ref={parentRef} className="overflow-y-auto scrollbar-thin pr-2" style={{ maxHeight: '65vh' }}>
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const product = products[virtualRow.index]
                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                      paddingBottom: '16px'
                    }}
                  >
                    <div
                      className="p-4 rounded-xl h-full"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                    >
                      <div className="flex items-start gap-4 h-full">
                        {product.images && product.images.length > 0 && (
                          <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0" style={{ background: 'var(--surface-elevated)' }}>
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{product.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${product.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                              {product.status}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded shrink-0 font-bold tracking-wide uppercase" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-focus)' }}>
                              {product.source_platform}
                            </span>
                          </div>
                          {product.description && (
                            <p className="text-sm mb-2 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                              {product.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs mt-auto pt-2" style={{ color: 'var(--text-tertiary)' }}>
                            {product.sku && <span>SKU: <span className="font-mono text-[var(--text-secondary)]">{product.sku}</span></span>}
                            {product.price && <span>Price: <span className="font-semibold text-[var(--text-primary)]">{product.price} {product.currency}</span></span>}
                            {product.inventory !== null && <span>Stock: <span className="font-semibold text-[var(--text-primary)]">{product.inventory}</span></span>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          {product.product_url && (
                            <a
                              href={product.product_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] uppercase tracking-wider font-black px-3 py-1.5 rounded-lg transition-colors text-center"
                              style={{ background: 'var(--surface-elevated)', color: 'var(--accent)', border: '1px solid var(--border)' }}
                            >
                              View
                            </a>
                          )}
                          <button
                            onClick={() => handleSync(product.source_platform)}
                            className="text-[10px] uppercase tracking-wider font-black px-3 py-1.5 rounded-lg transition-colors"
                            style={{ background: 'var(--accent)', color: 'var(--text-primary)' }}
                          >
                            Sync
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}