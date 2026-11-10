'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, BookOpen, Check, CircleHelp, X, Sparkles, Compass } from 'lucide-react'
import { useLang } from '../lib/LangContext'
import { getBusinessHeaders } from '../lib/businessContext'
import { motion, AnimatePresence } from 'framer-motion'

type TourStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped'
type TourStep = { id: string; href: string; target: string; title: string; body: string; clickToAdvance?: boolean; publish?: boolean }
type TargetRect = { top: number; left: number; width: number; height: number }

const API = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.nazbiz.io'}/api`
const token = () => typeof document === 'undefined' ? '' : decodeURIComponent(document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '')
const viewportWidth = () => typeof window === 'undefined' ? 384 : window.innerWidth
const viewportHeight = () => typeof window === 'undefined' ? 700 : window.innerHeight

function getSteps(ar: boolean, enabledFeatures: string[]): TourStep[] {
  const steps: TourStep[] = [
    {
      id: 'dashboard',
      href: '/dashboard',
      target: '[data-tour="dashboard-overview"]',
      title: ar ? 'لوحة التحكم والمؤشرات الرئيسية' : 'Your Command Center Overview',
      body: ar ? 'تعرّف على مؤشرات نشاطك، كفاءة الذكاء الاصطناعي، القنوات المتصلة، وآخر المحادثات الواردة.' : 'See your live business activity, AI reply performance, connected channels, and recent inquiries in one view.',
    },
    {
      id: 'channels',
      href: '/dashboard/channels',
      target: '[data-tour="channels-connect"]',
      title: ar ? 'إدارة القنوات والمتاجر' : 'Manage Channels & Stores',
      body: ar ? 'اربط WhatsApp، Instagram، Facebook، سلة وشوبيفاي. أسند القنوات إلى المساعد الذكي لتفعيل الردود الفورية.' : 'Connect WhatsApp, Instagram, Facebook, Salla, and Shopify. Assign accounts to your active agent to automate replies.',
    },
    {
      id: 'agents',
      href: '/dashboard/bots',
      target: '[data-tour="bots-create"]',
      title: ar ? 'مساعد الذكاء الاصطناعي والبوتات' : 'Configure Your AI Assistant',
      body: ar ? 'أنشئ المساعد، اختر نبرة الرد والتعليمات الخاصة، وحدد القنوات والمتاجر المسموح له بإدارتها.' : 'Create and customize an AI agent, set instructions and reply tone, and assign permitted channels and stores.',
    },
    {
      id: 'knowledge',
      href: '/dashboard/ai-knowledge',
      target: '[data-tour="knowledge-sources"]',
      title: ar ? 'قاعدة المعرفة ومصادر المعلومات' : 'Train With Your Knowledge Base',
      body: ar ? 'أضف ملفات الـ PDF، والكتالوجات، والأسئلة الشائعة ليجيب المساعد بدقة بناءً على معلومات نشاطك الحقيقية.' : 'Add product catalogs, PDFs, and FAQs so your assistant reflects your exact inventory and business rules.',
    },
    {
      id: 'inbox',
      href: '/inbox',
      target: '[data-tour="inbox-list"]',
      title: ar ? 'صندوق الوارد الموحد' : 'Unified Multi-Channel Inbox',
      body: ar ? 'تصل جميع رسائل قنواتك إلى هذا المكان الموحد. يمكنك مراجعة المحادثات، والتدخل يدوياً في أي لحظة.' : 'All incoming messages across all channels arrive here. Review AI chats or step in manually anytime.',
    },
    {
      id: 'workflow-create',
      href: '/dashboard/workflows',
      target: '[data-tour="workflows-create"]',
      title: ar ? 'محرك مسارات العمل والأتمتة' : 'Autonomous Workflows Builder',
      body: ar ? 'اضغط إنشاء مسار عمل لفتح المنشئ الحقيقي. سنشرح المحفزات والشروط والإجراءات التلقائية.' : 'Click Create Workflow to open the builder. We will guide you through triggers, conditions, and automated actions.',
      clickToAdvance: true,
    },
    {
      id: 'workflow-trigger',
      href: '/dashboard/workflows',
      target: '[data-tour="workflow-trigger"]',
      title: ar ? 'اختر الحدث المحفز' : 'Choose a Trigger Event',
      body: ar ? 'المحفز هو الحدث الذي يبدأ المسار (مثل أول رسالة من عميل جديد، طلب غير مكتمل، أو وسم محدد).' : 'A trigger initiates the workflow (such as a first customer DM, an abandoned cart, or a new tag).',
    },
    {
      id: 'workflow-conditions',
      href: '/dashboard/workflows',
      target: '[data-tour="workflow-conditions"]',
      title: ar ? 'الشروط المنطقية المتقدمة' : 'Add Logic Conditions',
      body: ar ? 'تحدد الشروط متى يستمر المسار، مثل حصر الإجراء بعد ساعات العمل الرسمية أو لطلبات معينة.' : 'Conditions filter when the workflow executes, such as after-hours or specific purchase amounts.',
    },
    {
      id: 'workflow-actions',
      href: '/dashboard/workflows',
      target: '[data-tour="workflow-actions"]',
      title: ar ? 'حدد الإجراء التلقائي' : 'Define Automated Action',
      body: ar ? 'حدد ما ينفذه النظام (إرسال رسالة واتساب، إضافة وسم، أو تحويل العميل لموظف بشري).' : 'Choose what happens (e.g. send an automated message, assign to an agent, or trigger a webhook).',
    },
    {
      id: 'workflow-publish',
      href: '/dashboard/workflows',
      target: '[data-tour="workflow-publish"]',
      title: ar ? 'مراجعة ونشر المسار' : 'Review & Publish',
      body: ar ? 'راجع الإعدادات ثم اضغط نشر لتفعيل المسار. يمكنك تعديله أو إيقافه مؤقتاً في أي وقت.' : 'Review your setup and publish it live. You can pause or modify workflows whenever needed.',
      publish: true,
    },
    {
      id: 'sequences',
      href: '/dashboard/sequences',
      target: '[data-tour="sequences-create"]',
      title: ar ? 'سلاسل المتابعة التلقائية' : 'Automated Sequences',
      body: ar ? 'أرسل رسائل متابعة مجدولة ومدروسة للعملاء بعد أحداث معينة كعدم إكمال الشراء أو بعد التسليم.' : 'Schedule drip follow-ups after triggers like an unanswered question or a completed order.',
    },
    {
      id: 'campaigns',
      href: '/dashboard/campaigns',
      target: '[data-tour="campaigns-create"]',
      title: ar ? 'الحملات والبث الموجه' : 'Targeted Broadcast Campaigns',
      body: ar ? 'أنشئ حملات تسويقية وتنبيهات لجمهور محدد عبر واتساب مع مراعاة سياسات الموافقة والجدولة.' : 'Send compliant broadcast messages to targeted customer segments across your channels.',
    },
    {
      id: 'team',
      href: '/dashboard/team',
      target: '[data-tour="team-invite"]',
      title: ar ? 'إدارة فريق العمل' : 'Team Collaboration & Roles',
      body: ar ? 'ادعُ أعضاء فريقك وحدد صلاحياتهم لمتابعة المحادثات والإشراف على وكلاء الذكاء الاصطناعي.' : 'Invite team members and assign granular permissions to oversee conversations and bots.',
    },
    {
      id: 'credits',
      href: '/dashboard/billing',
      target: '[data-tour="billing-credits"]',
      title: ar ? 'رصيد الذكاء والاشتراكات' : 'AI Credits & Subscriptions',
      body: ar ? 'تابع استهلاك رصيد الذكاء الاصطناعي للردود والمهام، وقم بترقية باقتك عند الحاجة.' : 'Monitor your AI credit balance, view usage metrics, and upgrade your subscription easily.',
    },
  ]

  return enabledFeatures.includes('advanced_automation')
    ? steps
    : steps.filter((step) => !step.id.startsWith('workflow-'))
}

export default function GuidedTours({
  businessId,
  setupCompleted,
}: {
  businessId: number | null
  setupCompleted: boolean
}) {
  const { isRTL } = useLang()
  const router = useRouter()
  const pathname = usePathname()
  const [status, setStatus] = useState<TourStatus>('not_started')
  const [currentStep, setCurrentStep] = useState(0)
  const [loadedBusiness, setLoadedBusiness] = useState<number | null>(null)
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>([])
  const steps = useMemo(() => getSteps(isRTL, enabledFeatures), [enabledFeatures, isRTL])
  const [rect, setRect] = useState<TargetRect | null>(null)
  const [error, setError] = useState('')

  const api = useCallback(
    async (method: 'GET' | 'PUT', state?: { status: TourStatus; current_step: number }) => {
      const authToken = token()
      if (!authToken || !businessId) throw new Error('Select a workspace to use the product guide.')
      const response = await fetch(`${API}/onboarding/product-tour`, {
        method,
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: 'application/json',
          ...(state ? { 'Content-Type': 'application/json' } : {}),
          ...getBusinessHeaders(),
        },
        ...(state ? { body: JSON.stringify(state) } : {}),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || `Product guide request failed (${response.status}).`)
      return body as { status: TourStatus; current_step: number; enabled_features?: string[] }
    },
    [businessId]
  )

  useEffect(() => {
    if (!businessId) return
    let cancelled = false
    setLoadedBusiness(null)
    setRect(null)
    api('GET')
      .then((state) => {
        if (cancelled) return
        setStatus(state.status)
        setEnabledFeatures(state.enabled_features || [])
        setCurrentStep(Math.min(state.current_step, steps.length - 1))
        setLoadedBusiness(businessId)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setError(cause instanceof Error ? cause.message : 'Could not load guide progress.')
        setLoadedBusiness(businessId)
      })
    return () => {
      cancelled = true
    }
  }, [api, businessId, steps.length])

  const save = useCallback(
    (nextStatus: TourStatus, step: number) => {
      setStatus(nextStatus)
      setCurrentStep(step)
      setError('')
      void api('PUT', { status: nextStatus, current_step: step }).catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : 'Could not save guide progress.')
      )
    },
    [api]
  )

  const begin = useCallback(() => {
    setRect(null)
    save('in_progress', 0)
    router.push(steps[0].href)
  }, [router, save, steps])

  const skip = useCallback(() => {
    setRect(null)
    save('skipped', currentStep)
  }, [currentStep, save])

  const goTo = useCallback(
    (index: number) => {
      setRect(null)
      if (index >= steps.length) {
        save('completed', steps.length - 1)
        return
      }
      if (index < 0) return
      save('in_progress', index)
      if (pathname !== steps[index].href) router.push(steps[index].href)
    },
    [pathname, router, save, steps]
  )

  useEffect(() => {
    if (status !== 'in_progress' || loadedBusiness !== businessId) return
    const step = steps[currentStep]
    if (step && pathname !== step.href) router.replace(step.href)
  }, [businessId, currentStep, loadedBusiness, pathname, router, status, steps])

  useEffect(() => {
    if (status !== 'in_progress' || loadedBusiness !== businessId) return
    const step = steps[currentStep]
    if (!step || pathname !== step.href) {
      setRect(null)
      return
    }

    let interval: number | undefined
    let observer: MutationObserver | undefined
    let update: (() => void) | undefined
    let target: Element | null = null

    const locate = () => {
      const node =
        Array.from(document.querySelectorAll(step.target)).find(
          (candidate) => candidate.getClientRects().length > 0
        ) || null
      if (!node) return false
      target = node
      node.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
      update = () => {
        if (!target?.isConnected) return
        const bounds = target.getBoundingClientRect()
        setRect({ top: bounds.top, left: bounds.left, width: bounds.width, height: bounds.height })
      }
      update()
      window.addEventListener('resize', update)
      window.addEventListener('scroll', update, true)
      observer = new MutationObserver(update)
      observer.observe(document.body, { attributes: true, childList: true, subtree: true })
      return true
    }

    if (!locate()) {
      interval = window.setInterval(() => {
        if (locate() && interval) window.clearInterval(interval)
      }, 250)
    }

    return () => {
      if (interval) window.clearInterval(interval)
      observer?.disconnect()
      if (update) {
        window.removeEventListener('resize', update)
        window.removeEventListener('scroll', update, true)
      }
    }
  }, [businessId, currentStep, loadedBusiness, pathname, status, steps])

  useEffect(() => {
    if (status !== 'in_progress') return
    const onClick = (event: MouseEvent) => {
      if (
        steps[currentStep]?.clickToAdvance &&
        event.target instanceof Element &&
        event.target.closest('[data-tour-action="workflow-create"]')
      ) {
        window.setTimeout(() => goTo(currentStep + 1), 0)
      }
    }
    const workflowCreated = () => {
      if (steps[currentStep]?.publish) goTo(currentStep + 1)
    }
    document.addEventListener('click', onClick, true)
    window.addEventListener('naz:tour-workflow-created', workflowCreated)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('naz:tour-workflow-created', workflowCreated)
    }
  }, [currentStep, goTo, status, steps])

  useEffect(() => {
    if (status !== 'in_progress') return
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') skip()
      if (event.key === 'ArrowRight') goTo(currentStep + (isRTL ? -1 : 1))
      if (event.key === 'ArrowLeft') goTo(currentStep + (isRTL ? 1 : -1))
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [currentStep, goTo, isRTL, skip, status])

  if (!businessId || loadedBusiness !== businessId) return null

  const active = status === 'in_progress'
  const step = steps[currentStep]
  const width = Math.min(400, viewportWidth() - 32)
  const left = rect
    ? Math.max(16, Math.min(rect.left, viewportWidth() - width - 16))
    : Math.max(16, (viewportWidth() - width) / 2)
  const top = rect
    ? rect.top + rect.height + 16 + 280 < viewportHeight()
      ? rect.top + rect.height + 16
      : Math.max(16, rect.top - 290)
    : Math.max(24, (viewportHeight() - 320) / 2)

  return (
    <>
      {/* Floating Launcher Pill in Bottom Corner */}
      {!active && (
        <div className="fixed bottom-5 z-[70] flex flex-col gap-2 ltr:right-5 rtl:left-5">
          {!setupCompleted && (
            <button
              type="button"
              onClick={() => router.push('/onboarding')}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-brand/30 bg-surface-elevated px-4 py-2.5 text-xs font-bold text-text-primary shadow-xl backdrop-blur-md transition-all hover:border-brand hover:bg-brand/10 hover:shadow-2xl focus-visible:outline-2 focus-visible:outline-brand"
            >
              <span>{isRTL ? 'إكمال إعداد مساحة العمل' : 'Continue workspace setup'}</span>
              <ArrowRight size={14} className={isRTL ? 'rotate-180' : ''} />
            </button>
          )}

          <button
            type="button"
            onClick={begin}
            aria-label={isRTL ? 'ابدأ دليل استخدام NazBiz' : 'Start the NazBiz product guide'}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-brand/30 bg-surface-elevated px-4 py-2.5 text-xs font-bold text-text-primary shadow-xl backdrop-blur-md transition-all hover:border-brand hover:bg-brand/10 hover:shadow-2xl focus-visible:outline-2 focus-visible:outline-brand"
          >
            <Compass size={16} className="text-brand animate-pulse" />
            <span>{isRTL ? 'دليل المنتج التفاعلي' : 'Interactive Product Tour'}</span>
          </button>
        </div>
      )}

      {/* Welcome to Tour Modal (When not started) */}
      <AnimatePresence>
        {status === 'not_started' && (
          <div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="tour-welcome-title"
              dir={isRTL ? 'rtl' : 'ltr'}
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-brand/30 bg-surface-elevated/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
            >
              <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-brand via-brand-violet to-brand-cyan" />

              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand shadow-sm">
                    <Sparkles size={24} />
                  </span>
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-brand">
                      {isRTL ? 'نذير بزنس • جولة تعريفية' : 'NazBiz • Guided Tour'}
                    </span>
                    <span className="mt-0.5 block text-xs text-text-tertiary">
                      {isRTL ? 'تعرّف على مساحة عملك التفاعلية' : 'Interactive Walkthrough of Your Workspace'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={skip}
                  aria-label={isRTL ? 'إغلاق' : 'Close'}
                  className="rounded-xl p-2 text-text-tertiary transition-colors hover:bg-surface-secondary hover:text-text-primary"
                >
                  <X size={18} />
                </button>
              </div>

              <h2 id="tour-welcome-title" className="mt-6 text-2xl font-black text-text-primary">
                {isRTL ? 'مرحباً بك في مساحة عمل نذير بزنس 👋' : 'Welcome to Your Business Workspace 👋'}
              </h2>
              <p className="mt-2.5 text-xs leading-relaxed text-text-secondary sm:text-sm">
                {isRTL
                  ? 'سنأخذك في جولة سريعة ومباشرة على لوحة التحكم، القنوات، صندوق الوارد الموحد، ومحرك الأتمتة. أنت من يتحكم دائماً بما يتم نشره وتفعيله.'
                  : 'We will take you through your dashboard, channels, unified inbox, and automated workflows. You stay in control of what gets configured and published.'}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={begin}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-xs font-bold text-white shadow-lg transition-all hover:bg-brand-hover hover:brightness-110"
                >
                  <span>{isRTL ? 'ابدأ الجولة التفاعلية' : 'Start Guided Tour'}</span>
                  <ArrowRight size={15} className={isRTL ? 'rotate-180' : ''} />
                </button>
                <button
                  type="button"
                  onClick={skip}
                  className="rounded-xl border border-border bg-surface-secondary/50 px-4 py-3 text-xs font-bold text-text-secondary transition-colors hover:text-text-primary hover:bg-surface-secondary"
                >
                  {isRTL ? 'سأستكشف بنفسي' : 'I will explore myself'}
                </button>
              </div>

              {error && <p role="alert" className="mt-4 text-xs font-medium text-error">{error}</p>}
            </motion.section>
          </div>
        )}
      </AnimatePresence>

      {/* Active Guided Tour Spotlight Overlay */}
      {active && step && (
        <div className="pointer-events-none fixed inset-0 z-[80]" aria-live="polite">
          {/* Focused Highlight Target with glowing ring */}
          {rect ? (
            <div
              aria-hidden="true"
              className="fixed rounded-2xl border-2 border-brand transition-all duration-300"
              style={{
                top: rect.top - 6,
                left: rect.left - 6,
                width: rect.width + 12,
                height: rect.height + 12,
                boxShadow: '0 0 0 9999px rgba(5, 10, 25, 0.75), 0 0 24px rgba(23, 105, 255, 0.45)',
                pointerEvents: 'none',
              }}
            />
          ) : (
            <div aria-hidden="true" className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs" />
          )}

          {/* Floating Contextual Tooltip Card */}
          <section
            role="dialog"
            aria-modal="false"
            aria-labelledby="tour-step-title"
            dir={isRTL ? 'rtl' : 'ltr'}
            className="pointer-events-auto fixed z-[81] w-[min(25rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-brand/30 bg-surface-elevated/95 p-5 shadow-2xl backdrop-blur-xl"
            style={{ top, left }}
          >
            {/* Top accent bar */}
            <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-brand via-brand-violet to-brand-cyan" />

            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-5 items-center justify-center rounded-full bg-brand/15 px-2 text-[10px] font-black uppercase tracking-wider text-brand">
                  {isRTL ? `خطوة ${currentStep + 1} من ${steps.length}` : `Step ${currentStep + 1} of ${steps.length}`}
                </span>
                <span className="text-[10px] text-text-tertiary">
                  {isRTL ? 'دليل المنتج' : 'Product Guide'}
                </span>
              </div>
              <button
                type="button"
                onClick={skip}
                aria-label={isRTL ? 'إغلاق الجولة' : 'Close tour'}
                className="rounded-lg p-1 text-text-tertiary transition-colors hover:bg-surface-secondary hover:text-text-primary"
              >
                <X size={15} />
              </button>
            </div>

            {/* Step progress bar */}
            <div
              className="mb-3.5 h-1.5 overflow-hidden rounded-full bg-surface-secondary"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={steps.length}
              aria-valuenow={currentStep + 1}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand to-brand-cyan transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>

            <h3 id="tour-step-title" className="text-base font-black text-text-primary">
              {step.title}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-text-secondary">{step.body}</p>

            {step.clickToAdvance && (
              <p className="mt-3 rounded-xl border border-brand/20 bg-brand/5 px-3 py-2 text-xs font-semibold text-brand">
                {isRTL ? '💡 اضغط على الزر المحدد لفتح منشئ مسارات العمل الحقيقي.' : '💡 Click the highlighted button to launch the workflow builder.'}
              </p>
            )}

            {!rect && (
              <button
                type="button"
                onClick={() => router.push(step.href)}
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
              >
                <span>{isRTL ? 'الانتقال إلى هذه الصفحة ←' : 'Navigate to relevant page →'}</span>
              </button>
            )}

            {/* Bottom Controls */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs">
              <button
                type="button"
                disabled={currentStep === 0}
                onClick={() => goTo(currentStep - 1)}
                className="inline-flex items-center gap-1 rounded-xl px-3 py-2 font-semibold text-text-secondary transition-colors hover:bg-surface-secondary disabled:opacity-40"
              >
                <ArrowLeft size={14} className={isRTL ? 'rotate-180' : ''} />
                <span>{isRTL ? 'السابق' : 'Previous'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={skip}
                  className="rounded-xl px-2.5 py-2 text-text-tertiary transition-colors hover:text-text-primary"
                >
                  {isRTL ? 'إنهاء الجولة' : 'Skip Tour'}
                </button>

                <button
                  type="button"
                  onClick={() => goTo(currentStep + 1)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 font-bold text-white shadow-md transition-all hover:bg-brand-hover hover:brightness-110"
                >
                  <span>
                    {currentStep === steps.length - 1
                      ? isRTL
                        ? 'إتمام الجولة'
                        : 'Finish Tour'
                      : isRTL
                      ? 'التالي'
                      : 'Next'}
                  </span>
                  {currentStep === steps.length - 1 ? (
                    <Check size={14} />
                  ) : (
                    <ArrowRight size={14} className={isRTL ? 'rotate-180' : ''} />
                  )}
                </button>
              </div>
            </div>

            {/* Keyboard shortcut hint */}
            <div className="mt-2.5 text-center text-[10px] text-text-tertiary">
              {isRTL ? 'استخدم مفاتيح الأسهم (← / →) للتنقل • زر Esc للخروج' : 'Use arrow keys (← / →) to navigate • Esc to close'}
            </div>

            {error && <p role="alert" className="mt-2 text-[11px] text-error">{error}</p>}
          </section>
        </div>
      )}
    </>
  )
}
