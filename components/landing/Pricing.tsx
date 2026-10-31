'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useLang } from '../../lib/LangContext'
import { variants, springs } from '../../lib/motion'
import { useHydratedReducedMotion } from '../../lib/useHydratedReducedMotion'

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

async function requestPackages(): Promise<Package[]> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/packages`)
  if (!response.ok) throw new Error(`Packages request failed (${response.status})`)
  const data = await response.json()
  return Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])
}

export default function Pricing() {
  const { t, isRTL } = useLang()
  const [annual, setAnnual] = useState(false)
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const reduceMotion = useHydratedReducedMotion()

  useEffect(() => {
    let active = true
    requestPackages()
      .then((items) => { if (active) setPackages(items) })
      .catch(() => { if (active) setError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const retryPackages = () => {
    setError(false)
    setLoading(true)
    requestPackages()
      .then(setPackages)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  const getPrice = (pkg: Package) => annual ? pkg.price_yearly : pkg.price_monthly

  if (loading) {
    return (
      <section id="pricing" className="py-24 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-live="polite">
          <h2 className="text-balance text-3xl font-black sm:text-4xl" style={{ color: 'var(--text-primary)' }}>{t.pricing.title}</h2>
          <div className="mt-8 h-40 animate-pulse rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }} />
        </div>
      </section>
    )
  }

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={reduceMotion ? false : 'hidden'}
          whileInView={reduceMotion ? undefined : 'visible'}
          viewport={{ once: true, margin: '-60px' }}
          variants={variants.fadeUp}
          transition={springs.standard}
          className="mb-8 flex flex-col items-center gap-5 text-center lg:flex-row lg:items-end lg:justify-between lg:text-start"
        >
          <h2
            className={`max-w-xl text-balance text-3xl font-black tracking-tight sm:text-4xl ${isRTL ? 'font-arabic' : ''}`}
            style={{ color: 'var(--text-primary)' }}
          >
            {t.pricing.title}
          </h2>
          <p className="max-w-md text-sm leading-6 sm:text-base" style={{ color: 'var(--text-secondary)' }}>
            {isRTL ? 'قارن الخطط والأسعار الحالية، ثم اختر ما يناسب استخدامك.' : 'Compare the current plans and prices, then choose the one that fits your needs.'}
          </p>
        </motion.div>

        <div className={`mb-10 flex items-center gap-3 ${isRTL ? 'justify-start' : 'justify-start'}`}>
          <span className="text-sm font-medium" style={{ color: annual ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>{t.pricing.monthly}</span>
          <button type="button" role="switch" aria-checked={annual} aria-label={isRTL ? 'تبديل الفوترة الشهرية والسنوية' : 'Switch monthly and annual billing'} onClick={() => setAnnual(!annual)} className="relative h-7 w-12 rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" style={{ background: annual ? 'var(--accent)' : 'var(--surface-elevated)', borderColor: 'var(--border-strong)', outlineColor: 'var(--accent)' }}>
            <span className="absolute top-1 h-4 w-4 rounded-full bg-white transition-all" style={{ insetInlineStart: annual ? '1.65rem' : '0.25rem' }} />
          </button>
          <span className="text-sm font-medium" style={{ color: annual ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{t.pricing.annual}</span>
        </div>

        {error || packages.length === 0 ? (
          <div className="border-y py-8 text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }} role="status">
            {error
              ? (isRTL ? 'تعذر تحميل الخطط الآن. أعد المحاولة أو تواصل مع الدعم.' : 'Plans could not be loaded right now. Please try again or contact support.')
              : (isRTL ? 'لا توجد خطط متاحة حالياً.' : 'There are no plans available right now.')}
            {error && <button type="button" onClick={retryPackages} className="ms-3 underline underline-offset-4" style={{ color: 'var(--accent)' }}>{isRTL ? 'إعادة المحاولة' : 'Try again'}</button>}
          </div>
        ) : (
        <motion.div
          variants={reduceMotion ? undefined : variants.staggerContainer}
          initial={reduceMotion ? false : 'hidden'}
          whileInView={reduceMotion ? undefined : 'visible'}
          viewport={{ once: true, margin: '-40px' }}
          className="grid grid-cols-1 gap-x-8 gap-y-0 md:grid-cols-2 xl:grid-cols-3"
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
        )}
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

  return (
    <motion.div
      variants={variants.fadeUp}
      whileHover={{ y: -3 }}
      className="relative flex flex-col border-y py-7 first:border-t-0 md:px-2 xl:px-5"
      style={{
        borderColor: 'var(--border)',
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
        popular={pkg.is_popular}
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
  t: { pricing: { monthly: string; startFree: string; mostPopular: string } }
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
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-primary-color">{name}</h3>
            <p className="mt-1 text-sm leading-6 text-tertiary-color">{description}</p>
          </div>
          {popular && <span className="shrink-0 text-xs font-semibold" style={{ color: 'var(--accent)' }}>{t.pricing.mostPopular}</span>}
        </div>
        <div className="mb-6 flex items-baseline gap-2">
          <span className="text-3xl font-black text-primary-color" style={{ letterSpacing: '-0.03em' }}>
            {price === 0 ? 'Free' : `${price} SAR`}
          </span>
          {price > 0 && (
            <span className="text-sm text-tertiary-color">/{annual ? (isRTL ? 'سنة' : 'year') : (isRTL ? 'شهر' : 'month')}</span>
          )}
        </div>
      </div>

      <ul className="mb-7 flex-1 space-y-3">
        {features.map((f, j) => (
          <li key={j} className="flex items-center gap-2 text-sm text-secondary-color">
            <span style={{ color: 'var(--accent)', fontSize: 14 }}>✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handlePlanClick}
        className="mt-auto inline-flex min-h-12 w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ background: popular ? 'var(--brand)' : 'var(--surface-elevated)', color: popular ? 'var(--brand-text)' : 'var(--text-primary)', outlineColor: 'var(--accent)' }}
      >
        {token ? (isRTL ? 'اشترك الآن' : 'Subscribe Now') : t.pricing.startFree}
      </button>
    </>
  )
}
