'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { useLang } from '../../lib/LangContext'
import toast from 'react-hot-toast'
import SocialLoginButtons from '../ui/SocialLoginButtons'
import Checkbox from '../ui/Checkbox'
import BrandWordmark from '../brand/BrandWordmark'
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  Loader2,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Zap,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'

type RegisterField = 'name' | 'email' | 'password' | 'confirm'
type SignupPackage = {
  id: number
  name: string
  name_ar: string
  price_monthly: number
  price_yearly: number
  features?: string[]
  features_ar?: string[]
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const shakeTransition = { duration: 0.35, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }

export default function RegisterForm() {
  const { isRTL, t } = useLang()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const packageId = searchParams.get('package')
  const billingCycle = searchParams.get('billing')
  const initialChoice = searchParams.get('signup_choice')

  const [packages, setPackages] = useState<SignupPackage[]>([])
  const [planChoice, setPlanChoice] = useState<'trial' | 'paid' | null>(
    initialChoice === 'paid' || (packageId && packageId !== 'trial')
      ? 'paid'
      : 'trial'
  )
  const [selectedPackageId, setSelectedPackageId] = useState(packageId || '')
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>(
    billingCycle === 'yearly' ? 'yearly' : 'monthly'
  )

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [touched, setTouched] = useState<Record<RegisterField | 'terms', boolean>>({
    name: false,
    email: false,
    password: false,
    confirm: false,
    terms: false,
  })
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [successPulse, setSuccessPulse] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Fetch available packages from API
  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    fetch(`${api}/api/packages`, { headers: { Accept: 'application/json' } })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load plans')
        const payload = await response.json()
        const available = (Array.isArray(payload) ? payload : payload?.data || []).filter(
          (item: SignupPackage) => Number(item.price_monthly) > 0 || Number(item.price_yearly) > 0
        )
        setPackages(available)
        if (packageId && available.some((item: SignupPackage) => String(item.id) === packageId)) {
          setPlanChoice('paid')
          setSelectedPackageId(packageId)
        } else if (
          available.length > 0 &&
          (!selectedPackageId || !available.some((item: SignupPackage) => String(item.id) === selectedPackageId))
        ) {
          setSelectedPackageId(String(available[0].id))
        }
      })
      .catch(() => setPackages([]))
  }, [packageId, selectedPackageId])

  // Validation rules
  const requiredMessage = isRTL ? 'هذا الحقل مطلوب' : 'This field is required'
  const invalidEmailMessage = isRTL ? 'أدخل بريداً إلكترونياً صالحاً' : 'Enter a valid email address'
  const termsMessage = isRTL
    ? 'يجب الموافقة على الشروط وسياسة الخصوصية للمتابعة'
    : 'You must agree to the Terms and Privacy Policy'

  const strengthChecks = [
    form.password.length >= 8,
    /[A-Z]/.test(form.password),
    /[a-z]/.test(form.password),
    /\d/.test(form.password),
    /[^A-Za-z0-9]/.test(form.password),
  ]
  const strengthScore = strengthChecks.filter(Boolean).length
  const strengthLevel = Math.min(4, Math.ceil((strengthScore / 5) * 4))
  const strengthColor =
    strengthLevel <= 1 ? '#EF4444' : strengthLevel <= 3 ? '#F59E0B' : '#10B981'
  const strengthText =
    strengthLevel <= 1
      ? isRTL
        ? 'ضعيفة'
        : 'Weak'
      : strengthLevel <= 3
      ? isRTL
        ? 'متوسطة'
        : 'Good'
      : isRTL
      ? 'قوية جداً'
      : 'Strong'

  const passwordsMatch = form.confirm.length > 0 && form.password === form.confirm
  const confirmMismatch = form.confirm.length > 0 && form.password !== form.confirm

  const validateField = (field: RegisterField, value = form[field]) => {
    if (!value.trim()) return requiredMessage
    if (field === 'email' && !emailPattern.test(value)) return invalidEmailMessage
    if (field === 'password' && form.password.length < 8) return t.auth?.invalidPassword || 'Password must be at least 8 characters'
    if (field === 'confirm' && form.password !== form.confirm) return t.auth?.passwordsMismatch || 'Passwords do not match'
    return ''
  }

  const fieldErrors = {
    name: touched.name ? validateField('name') : '',
    email: touched.email ? validateField('email') : '',
    password: touched.password ? validateField('password') : '',
    confirm: touched.confirm ? validateField('confirm') : '',
  }
  const termsError = touched.terms && !termsAccepted ? termsMessage : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setTouched({ name: true, email: true, password: true, confirm: true, terms: true })

    const nextErrors = [
      validateField('name'),
      validateField('email'),
      validateField('password'),
      validateField('confirm'),
      termsAccepted ? '' : termsMessage,
    ].filter(Boolean)

    if (nextErrors.length) {
      setError(nextErrors[0])
      return
    }
    if (form.password !== form.confirm) {
      setError(t.auth?.passwordsMismatch || 'Passwords do not match')
      return
    }
    if (form.password.length < 8) {
      setError(t.auth?.invalidPassword || 'Password must be at least 8 characters')
      return
    }
    if (!planChoice) {
      setError(isRTL ? 'يرجى اختيار خطة البدء.' : 'Please choose your signup plan.')
      return
    }
    if (planChoice === 'paid' && !selectedPackageId) {
      setError(isRTL ? 'يرجى اختيار باقة للاشتراك المدفوع.' : 'Please select a plan.')
      return
    }

    setLoading(true)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            password_confirmation: form.confirm,
            signup_choice: planChoice,
            ...(planChoice === 'paid'
              ? { package_id: Number(selectedPackageId), billing_cycle: selectedBillingCycle }
              : {}),
          }),
          signal: controller.signal,
        }
      )
      clearTimeout(timeout)
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || t.auth?.registerError || 'Registration failed')

      toast.success(t.auth?.registerSuccess || 'Account created successfully')
      setSuccessPulse(true)
      await new Promise((resolve) => setTimeout(resolve, 350))

      const params = new URLSearchParams()
      params.set('email', form.email)
      if (redirectTo) params.set('redirect', redirectTo)
      params.set('signup_choice', planChoice)
      if (planChoice === 'paid' && selectedPackageId) params.set('package', selectedPackageId)
      if (planChoice === 'paid') params.set('billing', selectedBillingCycle)

      window.location.href = `/verify-email?${params.toString()}`
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (t.auth?.registerError || 'Registration failed')
      setError(
        msg.includes('abort') || msg.includes('fetch')
          ? isRTL
            ? 'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.'
            : 'Cannot connect to server. Please verify your connection.'
          : msg
      )
      toast.error(msg)
    } finally {
      setLoading(false)
      setSuccessPulse(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative w-full overflow-hidden rounded-3xl border border-border/80 bg-surface-elevated/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-9"
    >
      {/* Top gradient accent line */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-brand-cyan to-brand-violet" />

      {/* Mobile brand header */}
      <div className="mb-6 flex justify-center lg:hidden">
        <Link href="/" aria-label="Naz AutoReply">
          <BrandWordmark width="76px" priority />
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6 text-start">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
          <Sparkles size={12} />
          <span className="uppercase tracking-wider">{t.auth?.register || 'Sign Up'}</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl">
          {isRTL ? 'أنشئ حسابك وابدأ الأتمتة' : 'Create your business account'}
        </h1>
        <p className="mt-1.5 text-xs text-text-secondary sm:text-sm">
          {isRTL
            ? 'ابدأ تجربتك المجانية الكاملة لمدة 14 يوماً بدون بطاقة ائتمان، أو اختر خطتك المدفوعة مباشرة.'
            : 'Get started with a 14-day unrestricted trial or select your production plan.'}
        </p>
      </div>

      {/* Plan Selection Mode Segmented Control */}
      <div className="mb-6 space-y-3">
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border/80 bg-surface-secondary/70 p-1.5">
          <button
            type="button"
            onClick={() => setPlanChoice('trial')}
            className={`relative flex flex-col items-center justify-center rounded-xl py-2 px-3 text-center transition-all duration-200 ${
              planChoice === 'trial'
                ? 'bg-surface-elevated text-text-primary shadow-md border border-brand/40 ring-1 ring-brand/20'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated/50'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <Zap size={13} className="text-emerald-500 shrink-0" />
              <span>14-Day Full Business Trial</span>
            </div>
            <span className="mt-0.5 text-[10px] text-emerald-500 font-semibold">
              {isRTL ? 'مجاني بالكامل • بدون بطاقة' : 'Free • No Card Required'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPlanChoice('paid')}
            className={`relative flex flex-col items-center justify-center rounded-xl py-2 px-3 text-center transition-all duration-200 ${
              planChoice === 'paid'
                ? 'bg-surface-elevated text-text-primary shadow-md border border-brand/40 ring-1 ring-brand/20'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated/50'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <CreditCard size={13} className="text-brand shrink-0" />
              <span>{isRTL ? 'باقة مدفوعة مباشرة' : 'Direct Paid Plan'}</span>
            </div>
            <span className="mt-0.5 text-[10px] text-brand font-semibold">
              {isRTL ? 'إعداد فوري مع الدفع' : 'Instant Activation'}
            </span>
          </button>
        </div>

        {/* Paid Plan Details Selector (if paid mode is active) */}
        <AnimatePresence>
          {planChoice === 'paid' && packages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden rounded-2xl border border-brand/20 bg-brand/5 p-3.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-text-primary">
                  {isRTL ? 'اختر الباقة المناسبة:' : 'Select Plan:'}
                </span>
                {/* Billing cycle toggle */}
                <div className="inline-flex rounded-lg border border-border bg-surface-elevated p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSelectedBillingCycle('monthly')}
                    className={`rounded-md px-2 py-0.5 font-medium transition-colors ${
                      selectedBillingCycle === 'monthly' ? 'bg-brand text-white' : 'text-text-secondary'
                    }`}
                  >
                    {isRTL ? 'شهري' : 'Monthly'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedBillingCycle('yearly')}
                    className={`rounded-md px-2 py-0.5 font-medium transition-colors ${
                      selectedBillingCycle === 'yearly' ? 'bg-brand text-white' : 'text-text-secondary'
                    }`}
                  >
                    {isRTL ? 'سنوي (خصم 20%)' : 'Yearly (-20%)'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {packages.map((pkg) => {
                  const price =
                    selectedBillingCycle === 'yearly'
                      ? Math.round(Number(pkg.price_yearly) / 12)
                      : Number(pkg.price_monthly)
                  const isSelected = String(pkg.id) === selectedPackageId

                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPackageId(String(pkg.id))}
                      className={`relative flex flex-col rounded-xl p-2.5 text-start transition-all border ${
                        isSelected
                          ? 'border-brand bg-surface-elevated shadow-sm ring-1 ring-brand'
                          : 'border-border/60 bg-surface-elevated/50 hover:border-brand/40'
                      }`}
                    >
                      <span className="text-xs font-bold text-text-primary">
                        {isRTL ? pkg.name_ar || pkg.name : pkg.name}
                      </span>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-sm font-black text-brand">${price}</span>
                        <span className="text-[10px] text-text-tertiary">/mo</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Social Login Buttons */}
      <SocialLoginButtons
        redirectTo={redirectTo || undefined}
        packageId={selectedPackageId}
        billingCycle={selectedBillingCycle}
        signupChoice={planChoice || undefined}
        showDivider={true}
      />

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            key="register-error"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1, x: [0, -6, 6, -4, 4, 0] }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={shakeTransition}
            className="mb-5 flex items-center gap-2.5 rounded-xl border border-error/30 bg-error/10 p-3 text-xs font-medium text-error"
          >
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4 text-start">
        {/* Full Name Field */}
        <div>
          <label htmlFor="name" className="mb-1.5 block text-xs font-bold text-text-primary">
            {t.auth?.name || 'Name'}
          </label>
          <div
            className={`group relative flex items-center rounded-xl border bg-surface/80 px-3.5 py-2.5 shadow-sm transition-all duration-200 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 ${
              fieldErrors.name ? 'border-error/80 bg-error/5' : 'border-border hover:border-border-hover'
            }`}
          >
            <User size={16} className="shrink-0 text-text-tertiary group-focus-within:text-brand" />
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onFocus={() => setTouched((prev) => ({ ...prev, name: true }))}
              onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
              placeholder={isRTL ? 'مثال: محمد الشمري' : 'e.g. Alexander Vance'}
              aria-label={t.auth?.name || 'Name'}
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? 'name-error' : undefined}
              className="w-full bg-transparent px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
            />
          </div>
          {fieldErrors.name && (
            <p id="name-error" className="mt-1 text-[11px] font-medium text-error">
              {fieldErrors.name}
            </p>
          )}
        </div>

        {/* Business Email Field */}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-bold text-text-primary">
            {t.auth?.email || 'Email'}
          </label>
          <div
            className={`group relative flex items-center rounded-xl border bg-surface/80 px-3.5 py-2.5 shadow-sm transition-all duration-200 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 ${
              fieldErrors.email ? 'border-error/80 bg-error/5' : 'border-border hover:border-border-hover'
            }`}
          >
            <Mail size={16} className="shrink-0 text-text-tertiary group-focus-within:text-brand" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onFocus={() => setTouched((prev) => ({ ...prev, email: true }))}
              onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
              placeholder="name@business.com"
              aria-label={t.auth?.email || 'Email'}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              className="w-full bg-transparent px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
            />
          </div>
          {fieldErrors.email && (
            <p id="email-error" className="mt-1 text-[11px] font-medium text-error">
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Password & Confirm Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Password */}
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-bold text-text-primary">
              {t.auth?.password || 'Password'}
            </label>
            <div
              className={`group relative flex items-center rounded-xl border bg-surface/80 px-3.5 py-2.5 shadow-sm transition-all duration-200 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 ${
                fieldErrors.password ? 'border-error/80 bg-error/5' : 'border-border hover:border-border-hover'
              }`}
            >
              <Lock size={16} className="shrink-0 text-text-tertiary group-focus-within:text-brand" />
              <input
                id="password"
                name="password"
                type={showPass ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onFocus={() => setTouched((prev) => ({ ...prev, password: true }))}
                onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                placeholder="••••••••"
                aria-label={t.auth?.password || 'Password'}
                aria-invalid={!!fieldErrors.password}
                className="w-full bg-transparent px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
                className="text-text-tertiary hover:text-text-primary focus:outline-none"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-xs font-bold text-text-primary">
              {t.auth?.confirmPassword || 'Confirm Password'}
            </label>
            <div
              className={`group relative flex items-center rounded-xl border bg-surface/80 px-3.5 py-2.5 shadow-sm transition-all duration-200 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 ${
                fieldErrors.confirm || confirmMismatch ? 'border-error/80 bg-error/5' : 'border-border hover:border-border-hover'
              }`}
            >
              <Lock size={16} className="shrink-0 text-text-tertiary group-focus-within:text-brand" />
              <input
                id="confirm"
                name="confirm"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                onFocus={() => setTouched((prev) => ({ ...prev, confirm: true }))}
                onBlur={() => setTouched((prev) => ({ ...prev, confirm: true }))}
                placeholder="••••••••"
                aria-label={t.auth?.confirmPassword || 'Confirm Password'}
                aria-invalid={!!fieldErrors.confirm || confirmMismatch}
                className="w-full bg-transparent px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                className="text-text-tertiary hover:text-text-primary focus:outline-none"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Password Strength Meter & Match Status */}
        {form.password && (
          <div className="space-y-1.5 rounded-xl border border-border/60 bg-surface/60 p-2.5 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-text-secondary">Password strength:</span>
              <span className="font-bold" style={{ color: strengthColor }}>
                {strengthText}
              </span>
            </div>
            {/* 4-bar progress indicator */}
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: step <= strengthLevel ? strengthColor : 'var(--border)',
                  }}
                />
              ))}
            </div>

            {/* Passwords Match status */}
            {form.confirm && (
              <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                {passwordsMatch ? (
                  <span className="inline-flex items-center gap-1 text-emerald-500 font-medium">
                    <CheckCircle2 size={12} />
                    <span>{isRTL ? 'كلمات المرور متطابقة' : 'Passwords match'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-error font-medium">
                    <AlertCircle size={12} />
                    <span>{t.auth?.passwordsMismatch || 'Passwords do not match'}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Terms and Privacy Checkbox */}
        <div className="pt-1">
          <label className="flex cursor-pointer items-start gap-2.5 select-none">
            <Checkbox
              checked={termsAccepted}
              onChange={(checked) => {
                setTermsAccepted(checked)
                setTouched((prev) => ({ ...prev, terms: true }))
              }}
              aria-label="I agree to the terms and privacy policy"
            />
            <span className="text-xs leading-relaxed text-text-secondary">
              {isRTL ? (
                <>
                  أوافق على{' '}
                  <Link href="/terms" className="text-brand hover:underline font-semibold">
                    شروط الخدمة
                  </Link>{' '}
                  و{' '}
                  <Link href="/privacy" className="text-brand hover:underline font-semibold">
                    سياسة الخصوصية
                  </Link>
                </>
              ) : (
                <>
                  I agree to the{' '}
                  <Link href="/terms" className="text-brand hover:underline font-semibold">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-brand hover:underline font-semibold">
                    Privacy Policy
                  </Link>
                </>
              )}
            </span>
          </label>
          {termsError && <p className="mt-1 text-[11px] font-medium text-error">{termsError}</p>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || successPulse}
          className="relative mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand via-brand to-brand-violet py-3 px-5 text-sm font-bold text-white shadow-lg shadow-brand/25 transition-all duration-200 hover:brightness-110 hover:shadow-brand/40 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>{isRTL ? 'جارٍ إنشاء الحساب...' : 'Creating account...'}</span>
            </>
          ) : (
            <>
              <span>
                {planChoice === 'trial'
                  ? isRTL
                    ? 'بدء التجربة المجانية لمدة 14 يوماً'
                    : 'Start 14-Day Free Trial'
                  : isRTL
                  ? 'المتابعة للدفع وتفعيل الحساب'
                  : 'Continue to Payment & Setup'}
              </span>
              {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            </>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="mt-6 text-center text-xs text-text-secondary">
        <span>{t.auth?.hasAccount || (isRTL ? 'لديك حساب بالفعل؟' : 'Already have an account?')} </span>
        <Link
          href={`/login${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
          className="font-bold text-brand transition-colors hover:text-brand-hover hover:underline"
        >
          {t.auth?.signIn || (isRTL ? 'تسجيل الدخول' : 'Sign In')}
        </Link>
      </div>
    </motion.div>
  )
}
