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
    initialChoice === 'trial' || searchParams.get('trial') === '1'
      ? 'trial'
      : initialChoice === 'paid' || (packageId && packageId !== 'trial')
        ? 'paid'
        : null
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
        } else if (available.length > 0 && (!selectedPackageId || !available.some((item: SignupPackage) => String(item.id) === selectedPackageId))) {
          setSelectedPackageId(String(available[0].id))
        }
      })
      .catch(() => setPackages([]))
  }, [packageId, selectedPackageId])

  // Validation rules
  const requiredMessage = isRTL ? 'هذا الحقل مطلوب' : 'This field is required'
  const invalidEmailMessage = isRTL ? 'أدخل بريداً إلكترونياً صالحاً' : 'Enter a valid email address'
  const termsMessage = isRTL ? 'يجب الموافقة على الشروط وسياسة الخصوصية' : 'You must agree to the Terms and Privacy Policy'

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
    strengthLevel <= 1 ? 'var(--error)' : strengthLevel <= 3 ? 'var(--warning)' : 'var(--success)'
  const strengthText =
    strengthLevel <= 1
      ? (isRTL ? 'ضعيفة' : 'Weak')
      : strengthLevel <= 3
      ? (isRTL ? 'متوسطة' : 'Good')
      : (isRTL ? 'قوية جداً' : 'Strong')

  const passwordsMatch = form.confirm.length > 0 && form.password === form.confirm
  const confirmMismatch = form.confirm.length > 0 && form.password !== form.confirm

  const validateField = (field: RegisterField, value = form[field]) => {
    if (!value.trim()) return requiredMessage
    if (field === 'email' && !emailPattern.test(value)) return invalidEmailMessage
    if (field === 'password' && form.password.length < 8) return t.auth.invalidPassword
    if (field === 'confirm' && form.password !== form.confirm) return t.auth.passwordsMismatch
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
      setError(t.auth.passwordsMismatch)
      return
    }
    if (form.password.length < 8) {
      setError(t.auth.invalidPassword)
      return
    }
    if (!planChoice) {
      setError(isRTL ? 'يرجى اختيار تجربة باقة الأعمال أو باقة مدفوعة قبل إنشاء الحساب.' : 'Choose the 14-day Business trial or a paid plan before creating your account.')
      return
    }
    if (planChoice === 'paid' && !selectedPackageId) {
      setError(isRTL ? 'يرجى اختيار باقة للاشتراك المدفوع.' : 'Please select a plan.')
      return
    }

    setLoading(true)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)

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
      if (!res.ok) throw new Error(data.message || t.auth.registerError)

      toast.success(t.auth.registerSuccess)
      setSuccessPulse(true)
      await new Promise((resolve) => setTimeout(resolve, 400))

      const params = new URLSearchParams()
      params.set('email', form.email)
      if (redirectTo) params.set('redirect', redirectTo)
      params.set('signup_choice', planChoice)
      if (planChoice === 'paid' && selectedPackageId) params.set('package', selectedPackageId)
      if (planChoice === 'paid') params.set('billing', selectedBillingCycle)

      window.location.href = `/verify-email?${params.toString()}`
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.auth.registerError
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

  const fields = [
    {
      key: 'name' as const,
      label: t.auth.name,
      type: 'text',
      ph: isRTL ? 'مثال: محمد الشمري' : 'e.g. Alexander Vance',
      autoComplete: 'name',
      icon: User,
    },
    {
      key: 'email' as const,
      label: t.auth.email,
      type: 'email',
      ph: 'name@business.com',
      autoComplete: 'email',
      icon: Mail,
    },
    {
      key: 'password' as const,
      label: t.auth.password,
      type: showPass ? 'text' : 'password',
      ph: '••••••••',
      autoComplete: 'new-password',
      icon: Lock,
    },
    {
      key: 'confirm' as const,
      label: t.auth.confirmPassword,
      type: showConfirm ? 'text' : 'password',
      ph: '••••••••',
      autoComplete: 'new-password',
      icon: Lock,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full overflow-hidden rounded-3xl border border-border bg-surface-elevated/95 p-6 shadow-2xl backdrop-blur-xl sm:p-9"
    >
      {/* Mobile brand header */}
      <div className="mb-6 flex justify-center lg:hidden">
        <Link href="/" aria-label="Nazeer Business">
          <BrandWordmark width="70px" priority />
        </Link>
      </div>

      {/* Header with status badge */}
      <div className="mb-6 text-start">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
          <Sparkles size={13} />
          <span className="uppercase tracking-wider">{t.auth.register}</span>
        </div>
        <h2 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl">
          {isRTL ? 'أنشئ حسابك وابدأ الأتمتة' : 'Create your business account'}
        </h2>
        <p className="mt-1.5 text-xs text-text-secondary sm:text-sm">
          {isRTL
            ? 'اختر تجربة باقة الأعمال الكاملة لمدة 14 يوماً أو باقة مدفوعة للمتابعة.'
            : 'Choose the 14-day full Business trial or a paid plan to continue.'}
        </p>
      </div>

      {/* Plan Selection Switcher */}
      <div className="mb-6 space-y-3">
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-surface-secondary/70 p-1.5">
          <button
            type="button"
            onClick={() => setPlanChoice('trial')}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
              planChoice === 'trial'
                ? 'bg-surface-elevated text-brand shadow-sm border border-brand/30'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Zap size={14} />
            <span>{isRTL ? 'تجربة الأعمال الكاملة (14 يوم)' : '14-Day Full Business Trial'}</span>
          </button>
          <button
            type="button"
            onClick={() => setPlanChoice('paid')}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
              planChoice === 'paid'
                ? 'bg-surface-elevated text-brand shadow-sm border border-brand/30'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <CreditCard size={14} />
            <span>{isRTL ? 'اشتراك باقة مدفوعة' : 'Select Paid Plan'}</span>
          </button>
        </div>

        {/* Paid Plan Options Drawer */}
        <AnimatePresence>
          {planChoice === 'paid' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden rounded-2xl border border-brand/20 bg-brand/5 p-3.5"
            >
              {/* Billing Cycle Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary">
                  {isRTL ? 'دورة الفوترة' : 'Billing Frequency'}
                </span>
                <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-elevated p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedBillingCycle('monthly')}
                    className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${
                      selectedBillingCycle === 'monthly'
                        ? 'bg-brand text-brand-text'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {isRTL ? 'شهري' : 'Monthly'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedBillingCycle('yearly')}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition-colors ${
                      selectedBillingCycle === 'yearly'
                        ? 'bg-brand text-brand-text'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <span>{isRTL ? 'سنوي' : 'Yearly'}</span>
                    <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[9px] text-emerald-400">
                      -20%
                    </span>
                  </button>
                </div>
              </div>

              {/* Package cards */}
              {packages.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {packages.map((pkg) => {
                    const isSelected = selectedPackageId === String(pkg.id)
                    const price =
                      selectedBillingCycle === 'yearly' ? pkg.price_yearly : pkg.price_monthly
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedPackageId(String(pkg.id))}
                        className={`rounded-xl border p-2.5 text-start transition-all ${
                          isSelected
                            ? 'border-brand bg-surface-elevated shadow-sm ring-1 ring-brand'
                            : 'border-border bg-surface-elevated/70 hover:border-brand/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-text-primary">
                            {isRTL ? pkg.name_ar : pkg.name}
                          </span>
                          {isSelected && <Check size={14} className="text-brand" />}
                        </div>
                        <div className="mt-1 text-sm font-black text-brand">
                          {Number(price).toLocaleString()} SAR
                          <span className="text-[10px] font-normal text-text-tertiary">
                            /{selectedBillingCycle === 'yearly' ? (isRTL ? 'سنة' : 'yr') : (isRTL ? 'شهر' : 'mo')}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-text-secondary">
                  {isRTL ? 'جاري تحميل الباقات المتاحة...' : 'Loading available plans...'}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Social Login Buttons */}
      <SocialLoginButtons
        redirectTo={redirectTo || undefined}
        packageId={planChoice === 'paid' ? selectedPackageId : undefined}
        billingCycle={planChoice === 'paid' ? selectedBillingCycle : undefined}
        signupChoice={planChoice || undefined}
        disabled={!planChoice || (planChoice === 'paid' && !selectedPackageId)}
      />

      {/* Divider */}
      <div className="relative my-6 flex items-center justify-center">
        <div className="w-full border-t border-border" />
        <span className="absolute bg-surface-elevated px-3 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
          {t.auth.orDivider || (isRTL ? 'أو عبر البريد' : 'or with email')}
        </span>
      </div>

      {/* Error Banner */}
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
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(({ key, label, type, ph, autoComplete, icon: FieldIcon }, i) => {
          const message = fieldErrors[key]
          const isPasswordField = key === 'password' || key === 'confirm'
          const showToggle = key === 'password' ? showPass : showConfirm
          const toggleFn = key === 'password' ? () => setShowPass(!showPass) : () => setShowConfirm(!showConfirm)

          return (
            <div key={key} className="space-y-1.5">
              <label htmlFor={`reg-${key}`} className="block text-xs font-bold text-text-secondary">
                {label}
              </label>
              <div className="relative">
                <span
                  className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-text-tertiary ${
                    isRTL ? 'right-3.5' : 'left-3.5'
                  }`}
                >
                  <FieldIcon size={16} />
                </span>

                <input
                  id={`reg-${key}`}
                  type={type}
                  required
                  autoComplete={autoComplete}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  onBlur={() => setTouched({ ...touched, [key]: true })}
                  placeholder={ph}
                  aria-invalid={!!message}
                  aria-describedby={message ? `reg-${key}-error` : undefined}
                  className={`w-full rounded-xl py-3 text-sm font-medium outline-none transition-all ${
                    isRTL ? 'pr-10' : 'pl-10'
                  } ${isPasswordField ? (isRTL ? 'pl-11' : 'pr-11') : isRTL ? 'pl-4' : 'pr-4'} ${
                    message
                      ? 'border border-error bg-error/5 focus:border-error focus:ring-2 focus:ring-error/20'
                      : 'border border-border bg-surface-secondary/50 focus:border-brand focus:bg-surface-elevated focus:ring-2 focus:ring-brand/20'
                  }`}
                />

                {isPasswordField && (
                  <button
                    type="button"
                    onClick={toggleFn}
                    className={`absolute top-1/2 -translate-y-1/2 rounded-md p-1.5 text-text-tertiary transition-colors hover:text-text-primary ${
                      isRTL ? 'left-2.5' : 'right-2.5'
                    }`}
                    aria-label={showToggle ? 'Hide password' : 'Show password'}
                  >
                    {showToggle ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>

              {/* Password Strength Meter (under password field) */}
              {key === 'password' && form.password.length > 0 && (
                <div className="mt-2 space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-text-tertiary">
                      {isRTL ? 'قوة كلمة المرور:' : 'Password strength:'}
                    </span>
                    <span className="font-bold" style={{ color: strengthColor }}>
                      {strengthText}
                    </span>
                  </div>
                  <div className="flex h-1.5 gap-1.5 overflow-hidden rounded-full bg-border">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className="h-full flex-1 rounded-full transition-all duration-300"
                        style={{
                          background: level <= strengthLevel ? strengthColor : 'transparent',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Password match check (under confirm field) */}
              {key === 'confirm' && form.confirm.length > 0 && (
                <div className="pt-0.5">
                  <span
                    className={`flex items-center gap-1.5 text-xs font-semibold ${
                      passwordsMatch ? 'text-success' : 'text-error'
                    }`}
                  >
                    {passwordsMatch ? (
                      <>
                        <CheckCircle2 size={13} />
                        <span>{isRTL ? 'كلمات المرور متطابقة' : 'Passwords match'}</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={13} />
                        <span>{isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match'}</span>
                      </>
                    )}
                  </span>
                </div>
              )}

              {/* Error Message */}
              <AnimatePresence>
                {message && (
                  <motion.p
                    id={`reg-${key}-error`}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-xs font-semibold text-error"
                  >
                    {message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )
        })}

        {/* Terms and Privacy Checkbox */}
        <div className="pt-2">
          <label htmlFor="reg-terms" className="flex items-start gap-2.5 cursor-pointer text-xs leading-relaxed text-text-secondary">
            <Checkbox
              id="reg-terms"
              required
              checked={termsAccepted}
              onChange={setTermsAccepted}
              onBlur={() => setTouched({ ...touched, terms: true })}
              ariaInvalid={!!termsError}
              ariaDescribedBy={termsError ? 'reg-terms-error' : undefined}
              label={
                <span>
                  {isRTL ? 'أوافق على ' : 'I agree to the '}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="font-bold text-brand hover:underline"
                  >
                    {isRTL ? 'شروط الخدمة' : 'Terms of Service'}
                  </Link>
                  {isRTL ? ' و' : ' and '}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="font-bold text-brand hover:underline"
                  >
                    {isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}
                  </Link>
                </span>
              }
            />
          </label>
          <AnimatePresence>
            {termsError && (
              <motion.p
                id="reg-terms-error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-1 text-xs font-semibold text-error"
              >
                {termsError}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={loading || successPulse}
          whileHover={!loading && !successPulse ? { scale: 1.015, y: -1 } : {}}
          whileTap={!loading && !successPulse ? { scale: 0.985 } : {}}
          className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-sm font-black text-white shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-70"
          style={{
            background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)',
            boxShadow: '0 8px 24px -4px rgba(23, 105, 255, 0.4)',
          }}
        >
          {/* Shimmer sweep effect */}
          <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 opacity-0 transition-all duration-700 group-hover:left-[120%] group-hover:opacity-30 bg-gradient-to-r from-transparent via-white to-transparent" />

          {successPulse ? (
            <>
              <Check size={18} className="animate-bounce" />
              <span>{isRTL ? 'تم إنشاء الحساب بنجاح!' : 'Account Created!'}</span>
            </>
          ) : loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>{isRTL ? 'جارٍ تهيئة حسابك...' : 'Initializing account...'}</span>
            </>
          ) : (
            <>
              <span>{t.auth.signUp}</span>
              <span className="font-normal opacity-80">
                ({planChoice === 'trial' ? (isRTL ? '14 يوماً بمزايا الأعمال' : '14 days of Business features') : (isRTL ? 'متابعة الدفع' : 'Proceed')})
              </span>
            </>
          )}
        </motion.button>
      </form>

      {/* Trust Badges */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 border-t border-border/80 pt-4 text-[11px] text-text-tertiary">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-brand" />
          <span>{isRTL ? 'تشفير آمن 256-bit' : '256-bit Encryption'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap size={14} className="text-warning" />
          <span>{isRTL ? 'إعداد فوري خلال 3 دقائق' : 'Ready in 3 Minutes'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CreditCard size={14} className="text-success" />
          <span>{isRTL ? 'بدون بطاقة ائتمان' : 'No Card Required'}</span>
        </div>
      </div>

      {/* Footer Link to Login */}
      <p className="mt-6 text-center text-xs text-text-secondary">
        {t.auth.hasAccount}{' '}
        <Link
          href="/login"
          className="font-bold text-brand transition-colors hover:text-brand-hover hover:underline"
        >
          {t.auth.signIn}
        </Link>
      </p>
    </motion.div>
  )
}
