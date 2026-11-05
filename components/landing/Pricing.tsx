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
            {isRTL ? 'كل الخطط تشمل قنواتك ومتاجرك وأدوات الأتمتة بلا حدود. اختر رصيد AI الشهري المناسب لفريقك.' : 'Every plan includes unlimited channels, stores, and automation. Choose the monthly AI credit allowance that fits your team.'}
          </p>
        </motion.div>

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
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          {packages.map((pkg) => (
            <PricingCard
              key={pkg.id}
              pkg={pkg}
              price={pkg.price_monthly}
              isRTL={isRTL}
              t={t}
            />
          ))}
        </motion.div>
        )}

        <CreditPacks isRTL={isRTL} />
      </div>
    </section>
  )
}

function PricingCard({
  pkg, price, isRTL, t,
}: {
  pkg: Package
  price: number
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
      className="relative flex min-h-full flex-col rounded-3xl border p-6 transition-transform hover:-translate-y-1 sm:p-7"
      style={{
        borderColor: pkg.is_popular ? 'var(--accent)' : 'var(--border)',
        background: 'var(--surface)',
        boxShadow: pkg.is_popular ? '0 20px 70px color-mix(in srgb, var(--accent) 14%, transparent)' : 'var(--shadow-card)',
      }}
    >
      <CardInner
        name={name}
        description={description}
        price={price}
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
  name, description, price, isRTL, t, features, popular = false, pkg,
}: {
  name: string
  description: string
  price: number
  isRTL: boolean
  t: { pricing: { monthly: string; startFree: string; mostPopular: string } }
  features: string[]
  popular?: boolean
  pkg: Package
}) {
  const router = useRouter()
  const token = getToken()
  const [actionError, setActionError] = useState('')

  const handlePlanClick = async () => {
    setActionError('')
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
          if (!response.ok) {
            const result = await response.json().catch(() => ({}))
            throw new Error(result.message || (isRTL ? 'تعذر تفعيل الباقة المجانية.' : 'Could not activate the free plan.'))
          }
          router.push('/dashboard')
        } catch (error) {
          setActionError(error instanceof Error ? error.message : (isRTL ? 'تعذر الاتصال بالخادم. حاول مرة أخرى.' : 'Could not connect to the server. Please try again.'))
        }
      } else {
        router.push(`/register?package=${pkg.id}&billing=monthly`)
      }
    } else {
      if (token) {
        router.push(`/checkout?package=${pkg.id}&billing=monthly`)
      } else {
        router.push(`/register?package=${pkg.id}&billing=monthly`)
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
            {price === 0 ? (isRTL ? 'مجاناً' : 'Free') : `${price} SAR`}
          </span>
          {price > 0 && (
            <span className="text-sm text-tertiary-color">/{isRTL ? 'شهرياً' : 'month'}</span>
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
      {actionError && <p role="alert" className="mt-3 text-xs leading-5" style={{ color: 'var(--error)' }}>{actionError}</p>}
    </>
  )
}

function CreditPacks({ isRTL }: { isRTL: boolean }) {
  const packs = [
    { credits: '5,000', price: '25' },
    { credits: '15,000', price: '65' },
    { credits: '30,000', price: '119' },
    { credits: '75,000', price: '249' },
  ]

  return (
    <section className="mt-10 rounded-3xl border p-5 sm:mt-14 sm:p-8" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }} aria-labelledby="ai-credit-packs">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 id="ai-credit-packs" className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{isRTL ? 'رصيد AI إضافي' : 'Extra AI credits'}</h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{isRTL ? 'اختر رصيداً إضافياً عند الحاجة، دون تغيير باقتك.' : 'Add more capacity when needed without changing your plan.'}</p>
        </div>
        <a href="mailto:support@nazbiz.io?subject=AI%20credit%20top-up" className="text-sm font-semibold underline underline-offset-4" style={{ color: 'var(--accent)' }}>{isRTL ? 'اطلب رصيداً إضافياً' : 'Request a top-up'}</a>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {packs.map((pack) => (
          <div key={pack.credits} className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface-elevated)' }}>
            <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{pack.credits}</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>{isRTL ? 'رصيد AI' : 'AI credits'}</p>
            <p className="mt-3 text-sm font-bold" style={{ color: 'var(--accent)' }}>{pack.price} SAR</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5" style={{ color: 'var(--text-tertiary)' }}>{isRTL ? 'تتم معالجة شراء الرصيد الإضافي حالياً عبر فريق الدعم.' : 'Top-up purchases are currently arranged through the support team.'}</p>
    </section>
  )
}
