'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useLang } from '../../lib/LangContext'
import { variants, springs } from '../../lib/motion'

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
}

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

export default function Pricing() {
  const { t, isRTL } = useLang()
  const [annual, setAnnual] = useState(false)
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/packages`)
      const data = await response.json()
      setPackages(Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []))
    } catch (error) {
      console.error('Failed to fetch packages:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPrice = (pkg: Package) => annual ? pkg.price_yearly : pkg.price_monthly

  if (loading) {
    return (
      <section id="pricing" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="spinner-lg" style={{ color: 'var(--accent)' }}></div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={variants.fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          transition={springs.standard}
          className="text-center mb-4"
        >
          <h2
            className={`text-3xl sm:text-4xl font-black ${isRTL ? 'font-arabic' : ''}`}
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}
          >
            {t.pricing.title}
          </h2>
        </motion.div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className="text-sm font-medium text-tertiary-color">
            {t.pricing.monthly}
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className="relative w-12 h-6 rounded-full transition-all duration-300 bg-surface-elevated border-border hover:bg-accent hover:text-accent"
          >
            <span
              className="absolute top-1 w-4 h-4 rounded-full bg-white"
            >
              {annual && <span className="absolute top-0.5 w-4 h-4 rounded-full bg-black" /> }
            </span>
          </button>
          <span className="text-sm font-medium text-primary-color">
            {t.pricing.annual}
            {annual && (
              <span className="ms-2 text-xs font-semibold text-accent-color">
                ({t.pricing.annualSave})
              </span>
            )}
          </span>
        </div>

        <motion.div
          variants={variants.staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 items-start"
        >
          {packages.map((pkg) => (
            <PricingCard
              key={pkg.id}
              pkg={pkg}
              price={getPrice(pkg)}
              annual={annual}
              isRTL={isRTL}
              t={t}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function PricingCard({
  pkg, price, annual, isRTL, t,
}: {
  pkg: Package
  price: number
  annual: boolean
  isRTL: boolean
  t: { pricing: { monthly: string; mostPopular: string; startFree: string } }
}) {
  const name = isRTL ? pkg.name_ar : pkg.name
  const description = isRTL ? pkg.description_ar : pkg.description
  const rawFeatures = isRTL ? pkg.features_ar : pkg.features
  const features = Array.isArray(rawFeatures)
    ? rawFeatures
    : (typeof rawFeatures === 'string' ? (() => { try { const parsed = JSON.parse(rawFeatures); return Array.isArray(parsed) ? parsed : [] } catch { return [] } })() : [])

  if (pkg.is_popular) {
    return (
      <motion.div
        variants={variants.fadeUp}
        whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.12)' }}
        className="relative rounded-2xl p-[2px] flex flex-col border border-brand/40 bg-brand/5"
        style={{
          background: 'conic-gradient(from var(--angle, 0deg), var(--accent), var(--accent-end), var(--accent))',
          animation: 'rotateBorder 3s linear infinite',
          transform: 'scale(1.03)',
        }}
      >
        {/* Badge */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span
            className="text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap bg-accent accent-shadow-lg text-on-accent"
          >
            {t.pricing.mostPopular}
          </span>
        </div>

        <div
          className="Card rounded-2xl flex flex-col h-full p-6 mouse-hover-hover"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 16px var(--shadow-sm)',
          }}
        >
          <CardInner
            name={name}
            description={description}
            price={price}
            annual={annual}
            isRTL={isRTL}
            t={t}
            features={features}
            popular={true}
            pkg={pkg}
          />
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={variants.fadeUp}
      whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.12)' }}
      className="Card rounded-2xl p-6 flex flex-col mouse-hover-hover"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: '0 4px 16px var(--shadow-sm)',
      }}
    >
      <CardInner
        name={name}
        description={description}
        price={price}
        annual={annual}
        isRTL={isRTL}
        t={t}
        features={features}
        popular={false}
        pkg={pkg}
      />
    </motion.div>
  )
}

function CardInner({
  name, description, price, annual, isRTL, t, features, popular = false, pkg,
}: {
  name: string
  description: string
  price: number
  annual: boolean
  isRTL: boolean
  t: { pricing: { monthly: string; startFree: string } }
  features: string[]
  popular?: boolean
  pkg: Package
}) {
  const router = useRouter()
  const token = getToken()

  const handlePlanClick = async () => {
    if (price === 0) {
      if (token) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/create-free`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              package_id: pkg.id,
              billing_cycle: 'monthly',
            }),
          })
          if (response.ok) {
            router.push('/dashboard')
          } else {
            router.push('/dashboard')
          }
        } catch {
          router.push('/dashboard')
        }
      } else {
        router.push(`/register?package=${pkg.id}&billing=monthly`)
      }
    } else {
      if (token) {
        router.push(`/checkout?package=${pkg.id}&billing=${annual ? 'yearly' : 'monthly'}`)
      } else {
        router.push(`/register?package=${pkg.id}&billing=${annual ? 'yearly' : 'monthly'}`)
      }
    }
  }

  return (
    <>
      <div className="mb-6">
        <h3 className="font-bold text-xl mb-1 text-primary-color">{name}</h3>
        <p className="text-xs mb-4 text-tertiary-color">{description}</p>
        <div className="flex items-end gap-1">
          <span className="text-4xl font-black text-primary-color" style={{ letterSpacing: '-0.03em' }}>
            {price === 0 ? 'Free' : `${price} SAR`}
          </span>
          {price > 0 && (
            <span className="text-sm mb-2 text-tertiary-color">/{t.pricing.monthly}</span>
          )}
        </div>
      </div>

      <ul className="space-y-3 flex-1 mb-6">
        {features.map((f, j) => (
          <li key={j} className="flex items-center gap-2 text-sm text-secondary-color">
            <span style={{ color: 'var(--accent)', fontSize: 14 }}>✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handlePlanClick}
        className={`block w-full text-center py-3 rounded-xl text-sm font-bold cursor-pointer transition-all duration-200 ${
          popular ? 'btn-lime' : 'btn-ghost'
        }`}
      >
        {token ? (isRTL ? 'اشترك الآن' : 'Subscribe Now') : t.pricing.startFree}
      </button>
    </>
  )
}
