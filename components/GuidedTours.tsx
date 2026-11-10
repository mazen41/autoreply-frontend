'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, BookOpen, Check, CircleHelp, X } from 'lucide-react'
import { useLang } from '../lib/LangContext'
import { getBusinessHeaders } from '../lib/businessContext'

type TourStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped'
type TourStep = { id: string; href: string; target: string; title: string; body: string; clickToAdvance?: boolean; publish?: boolean }
type TargetRect = { top: number; left: number; width: number; height: number }

const API = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.nazbiz.io'}/api`
const token = () => typeof document === 'undefined' ? '' : decodeURIComponent(document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '')
const viewportWidth = () => typeof window === 'undefined' ? 384 : window.innerWidth
const viewportHeight = () => typeof window === 'undefined' ? 700 : window.innerHeight

function getSteps(ar: boolean, enabledFeatures: string[]): TourStep[] {
  const steps: TourStep[] = [
    { id: 'dashboard', href: '/dashboard', target: '[data-tour="dashboard-overview"]', title: ar ? 'لوحة التحكم' : 'Your command center', body: ar ? 'تعرّف على مؤشرات نشاطك وأداء الذكاء الاصطناعي والقنوات وآخر المحادثات.' : 'See your activity, AI performance, connected channels, and recent conversations in one overview.' },
    { id: 'channels', href: '/dashboard/channels', target: '[data-tour="channels-connect"]', title: ar ? 'اربط قنواتك' : 'Connect your channels', body: ar ? 'اربط Instagram وFacebook وWhatsApp وGmail وTelegram. أسند الحسابات إلى وكيل نشط لتفعيل الردود.' : 'Connect Instagram, Facebook, WhatsApp, Gmail, and Telegram. Assign connected accounts to an active agent to enable replies.' },
    { id: 'agents', href: '/dashboard/bots', target: '[data-tour="bots-create"]', title: ar ? 'جهّز مساعد الذكاء الاصطناعي' : 'Configure your AI assistant', body: ar ? 'أنشئ وكيلاً، واختر نبرة الرد والتعليمات، ثم عيّن القنوات والمتاجر المسموح بها.' : 'Create an agent, choose its reply style and instructions, then assign its permitted channels and stores.' },
    { id: 'knowledge', href: '/dashboard/ai-knowledge', target: '[data-tour="knowledge-sources"]', title: ar ? 'علّم المساعد عن نشاطك' : 'Teach the assistant about your business', body: ar ? 'أضف مستندات المنتجات والخدمات والأسئلة الشائعة والتعليمات للحصول على إجابات أدق.' : 'Add product and service documents, FAQs, and instructions so replies reflect your business.' },
    { id: 'inbox', href: '/inbox', target: '[data-tour="inbox-list"]', title: ar ? 'صندوق الوارد الموحد' : 'Unified inbox', body: ar ? 'تصل محادثات القنوات هنا. افتح محادثة للرد أو مراجعة السياق أو تسليمها للفريق.' : 'Customer chats from connected channels arrive here. Reply, review context, or hand a conversation to your team.' },
    { id: 'workflow-create', href: '/dashboard/workflows', target: '[data-tour="workflows-create"]', title: ar ? 'ابدأ أول أتمتة' : 'Start your first automation', body: ar ? 'اضغط إنشاء مسار عمل لفتح المنشئ الحقيقي. سنشرح المحفز والشروط والإجراءات قبل النشر.' : 'Click Create Workflow to open the real builder. We’ll explain triggers, conditions, and actions before you publish.', clickToAdvance: true },
    { id: 'workflow-trigger', href: '/dashboard/workflows', target: '[data-tour="workflow-trigger"]', title: ar ? 'اختر المحفز' : 'Choose a trigger', body: ar ? 'المحفز هو الحدث الذي يبدأ المسار، مثل أول رسالة أو رسالة واردة أو إضافة وسم.' : 'A trigger starts the workflow, such as a first message, an inbound message, or a customer tag.' },
    { id: 'workflow-conditions', href: '/dashboard/workflows', target: '[data-tour="workflow-conditions"]', title: ar ? 'أضف شروطًا عند الحاجة' : 'Add conditions when needed', body: ar ? 'الشروط تحدد المحادثات التي تكمل المسار. اتركها فارغة فقط عندما يكون ذلك مقصودًا.' : 'Conditions narrow which conversations continue. Leave them empty only when that behavior is intended.' },
    { id: 'workflow-actions', href: '/dashboard/workflows', target: '[data-tour="workflow-actions"]', title: ar ? 'حدد الإجراء' : 'Choose an action', body: ar ? 'حدد ما سينفذه النظام، مثل إضافة وسم أو إسناد محادثة أو إرسال رسالة.' : 'Choose what the system does, such as adding a tag, assigning a conversation, or sending a message.' },
    { id: 'workflow-publish', href: '/dashboard/workflows', target: '[data-tour="workflow-publish"]', title: ar ? 'انشر عندما تكون جاهزًا' : 'Publish when you’re ready', body: ar ? 'راجع إعداداتك ثم انشر بنفسك. سيكمل الدليل بعد نجاح إنشاء المسار.' : 'Review your configuration and publish it yourself. The guide continues after the workflow is created successfully.', publish: true },
    { id: 'sequences', href: '/dashboard/sequences', target: '[data-tour="sequences-create"]', title: ar ? 'تابع العملاء بالتسلسلات' : 'Follow up with sequences', body: ar ? 'أرسل متابعات مؤجلة بعد أحداث مثل رسالة بلا رد أو طلب جديد.' : 'Schedule follow-ups after events like an unanswered message or a new order.' },
    { id: 'campaigns', href: '/dashboard/campaigns', target: '[data-tour="campaigns-create"]', title: ar ? 'أرسل الحملات' : 'Send campaigns', body: ar ? 'أنشئ رسائل لجمهور محدد. راجع القناة والمستلمين والموافقة قبل الجدولة.' : 'Create messages for a selected audience. Review the channel, recipients, and consent before scheduling.' },
    { id: 'team', href: '/dashboard/team', target: '[data-tour="team-invite"]', title: ar ? 'أضف فريقك' : 'Bring in your team', body: ar ? 'ادعُ أعضاء الفريق وحدد أدوارهم لتوزيع مسؤولية المحادثات.' : 'Invite teammates and assign roles so they can own the right conversations.' },
    { id: 'credits', href: '/dashboard/billing', target: '[data-tour="billing-credits"]', title: ar ? 'افهم رصيد الذكاء الاصطناعي' : 'Understand AI credits', body: ar ? 'يُستهلك الرصيد عند إتمام مهام الذكاء الاصطناعي. تابع الرصيد الشهري والمشتَرى والاستخدام هنا.' : 'Credits are consumed when AI work completes. Monitor monthly and purchased balances and usage here.' },
  ]
  return enabledFeatures.includes('advanced_automation')
    ? steps
    : steps.filter((step) => !step.id.startsWith('workflow-'))
}

export default function GuidedTours({ businessId }: { businessId: number | null }) {
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

  const api = useCallback(async (method: 'GET' | 'PUT', state?: { status: TourStatus; current_step: number }) => {
    const authToken = token()
    if (!authToken || !businessId) throw new Error('Select a workspace to use the product guide.')
    const response = await fetch(`${API}/onboarding/product-tour`, {
      method,
      headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json', ...(state ? { 'Content-Type': 'application/json' } : {}), ...getBusinessHeaders() },
      ...(state ? { body: JSON.stringify(state) } : {}),
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body.message || `Product guide request failed (${response.status}).`)
    return body as { status: TourStatus; current_step: number; enabled_features?: string[] }
  }, [businessId])

  useEffect(() => {
    if (!businessId) return
    let cancelled = false
    setLoadedBusiness(null)
    setRect(null)
    api('GET').then((state) => {
      if (cancelled) return
      setStatus(state.status)
      setEnabledFeatures(state.enabled_features || [])
      setCurrentStep(Math.min(state.current_step, steps.length - 1))
      setLoadedBusiness(businessId)
    }).catch((cause: unknown) => {
      if (cancelled) return
      setError(cause instanceof Error ? cause.message : 'Could not load guide progress.')
      setLoadedBusiness(businessId)
    })
    return () => { cancelled = true }
  }, [api, businessId, steps.length])

  const save = useCallback((nextStatus: TourStatus, step: number) => {
    setStatus(nextStatus)
    setCurrentStep(step)
    setError('')
    void api('PUT', { status: nextStatus, current_step: step }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Could not save guide progress.'))
  }, [api])

  const begin = useCallback(() => {
    setRect(null)
    save('in_progress', 0)
    router.push(steps[0].href)
  }, [router, save, steps])

  const skip = useCallback(() => {
    setRect(null)
    save('skipped', currentStep)
  }, [currentStep, save])

  const goTo = useCallback((index: number) => {
    setRect(null)
    if (index >= steps.length) {
      save('completed', steps.length - 1)
      return
    }
    if (index < 0) return
    save('in_progress', index)
    if (pathname !== steps[index].href) router.push(steps[index].href)
  }, [pathname, router, save, steps])

  useEffect(() => {
    if (status !== 'in_progress' || loadedBusiness !== businessId) return
    const step = steps[currentStep]
    if (step && pathname !== step.href) router.replace(step.href)
  }, [businessId, currentStep, loadedBusiness, pathname, router, status, steps])

  useEffect(() => {
    if (status !== 'in_progress' || loadedBusiness !== businessId) return
    const step = steps[currentStep]
    if (!step || pathname !== step.href) { setRect(null); return }

    let interval: number | undefined
    let observer: MutationObserver | undefined
    let update: (() => void) | undefined
    let target: Element | null = null
    const locate = () => {
      const node = Array.from(document.querySelectorAll(step.target)).find((candidate) => candidate.getClientRects().length > 0) || null
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
    if (!locate()) interval = window.setInterval(() => { if (locate() && interval) window.clearInterval(interval) }, 250)
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
      if (steps[currentStep]?.clickToAdvance && event.target instanceof Element && event.target.closest('[data-tour-action="workflow-create"]')) {
        window.setTimeout(() => goTo(currentStep + 1), 0)
      }
    }
    const workflowCreated = () => { if (steps[currentStep]?.publish) goTo(currentStep + 1) }
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
  const width = Math.min(384, viewportWidth() - 32)
  const left = rect ? Math.max(16, Math.min(rect.left, viewportWidth() - width - 16)) : Math.max(16, (viewportWidth() - width) / 2)
  const top = rect
    ? (rect.top + rect.height + 16 + 270 < viewportHeight() ? rect.top + rect.height + 16 : Math.max(16, rect.top - 286))
    : Math.max(24, (viewportHeight() - 300) / 2)

  return <>
    {!active && <button type="button" onClick={begin} aria-label={isRTL ? 'ابدأ دليل استخدام NazBiz' : 'Start the NazBiz product guide'} className="fixed bottom-5 z-[70] inline-flex items-center gap-2 rounded-full border border-brand/25 bg-surface-card px-4 py-2.5 text-xs font-semibold text-text-primary shadow-xl transition hover:border-brand/50 hover:bg-brand/5 focus-visible:outline-2 focus-visible:outline-brand ltr:right-5 rtl:left-5"><CircleHelp size={16} className="text-brand" />{isRTL ? 'دليل المنتج' : 'Product guide'}</button>}
    {status === 'not_started' && <div className="fixed inset-0 z-[80] grid place-items-center bg-black/55 p-4 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-labelledby="tour-welcome-title" dir={isRTL ? 'rtl' : 'ltr'} className="w-full max-w-xl rounded-3xl border border-border bg-surface-card p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand"><BookOpen size={23} /></span><span><span className="block text-xs font-semibold uppercase tracking-wider text-brand">NazBiz</span><span className="mt-1 block text-xs text-text-tertiary">{isRTL ? 'دليل تفاعلي لمساحة عملك' : 'Interactive workspace tour'}</span></span></div><button type="button" onClick={skip} aria-label={isRTL ? 'سأستكشف بنفسي' : 'Explore on my own'} className="rounded-lg p-2 text-text-tertiary hover:bg-surface-elevated"><X size={18} /></button></div>
        <h2 id="tour-welcome-title" className="mt-6 text-2xl font-bold text-text-primary">{isRTL ? 'مرحبًا بك في NazBiz' : 'Welcome to NazBiz'}</h2>
        <p className="mt-3 text-sm leading-6 text-text-secondary">{isRTL ? 'سنشرح لوحة التحكم والقنوات ومساعد الذكاء الاصطناعي، ثم نرشدك لإنشاء أول أتمتة. لن ننشر إعدادًا نيابة عنك.' : 'We’ll walk through your dashboard, channels, AI assistant, and first automation. You stay in control of what gets configured and published.'}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={begin} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-brand-text shadow-lg transition hover:brightness-110">{isRTL ? 'ابدأ الجولة' : 'Start guided tour'} <ArrowRight size={16} /></button><button type="button" onClick={skip} className="rounded-xl border border-border bg-surface-elevated/40 px-4 py-3 text-sm font-semibold text-text-secondary hover:text-text-primary">{isRTL ? 'سأستكشف بنفسي' : 'I’ll explore myself'}</button></div>
        {error && <p role="alert" className="mt-4 text-xs text-error">{error}</p>}
      </section>
    </div>}
    {active && step && <div className="pointer-events-none fixed inset-0 z-[80]" aria-live="polite">
      {rect ? <div aria-hidden="true" className="fixed rounded-xl border-2 border-brand ring-4 ring-brand/20 transition-all duration-200" style={{ top: rect.top - 5, left: rect.left - 5, width: rect.width + 10, height: rect.height + 10, boxShadow: '0 0 0 9999px rgba(3, 7, 18, 0.72)', pointerEvents: 'none' }} /> : <div aria-hidden="true" className="fixed inset-0 bg-slate-950/65" />}
      <section role="dialog" aria-modal="false" aria-labelledby="tour-step-title" dir={isRTL ? 'rtl' : 'ltr'} className="pointer-events-auto fixed z-[81] w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface-card p-5 shadow-2xl" style={{ top, left }}>
        <div className="mb-4 flex items-center justify-between gap-3"><p className="text-[11px] font-semibold text-brand">{isRTL ? `الخطوة ${currentStep + 1} من ${steps.length}` : `Step ${currentStep + 1} of ${steps.length}`}</p><button type="button" onClick={skip} aria-label={isRTL ? 'إغلاق الجولة' : 'Close tour'} className="rounded-lg p-1.5 text-text-tertiary hover:bg-surface-elevated"><X size={16} /></button></div>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-surface-elevated" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={currentStep + 1}><div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} /></div>
        <h2 id="tour-step-title" className="text-base font-bold text-text-primary">{step.title}</h2><p className="mt-2 text-sm leading-6 text-text-secondary">{step.body}</p>
        {step.clickToAdvance && <p className="mt-3 rounded-lg border border-brand/20 bg-brand/5 px-3 py-2 text-xs font-medium text-brand">{isRTL ? 'اضغط على الزر المحدد لفتح المنشئ الحقيقي.' : 'Click the highlighted button to open the real workflow builder.'}</p>}
        {step.publish && <p className="mt-3 rounded-lg border border-warning/25 bg-warning/5 px-3 py-2 text-xs font-medium text-warning">{isRTL ? 'لن ينشر الدليل المسار تلقائيًا.' : 'The guide will not publish a workflow for you.'}</p>}
        {!rect && <button type="button" onClick={() => router.push(step.href)} className="mt-3 text-xs font-semibold text-brand underline">{isRTL ? 'افتح الصفحة المطلوبة' : 'Open the relevant page'}</button>}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4"><button type="button" disabled={currentStep === 0} onClick={() => goTo(currentStep - 1)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-elevated disabled:opacity-40"><ArrowLeft size={14} />{isRTL ? 'السابق' : 'Previous'}</button><button type="button" onClick={skip} className="rounded-lg px-2 py-2 text-xs text-text-tertiary hover:text-text-primary">{isRTL ? 'تخطي الجولة' : 'Skip tour'}</button>{(step.clickToAdvance || step.publish) ? <button type="button" onClick={() => goTo(currentStep + 1)} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-elevated">{isRTL ? 'تخطي هذه الخطوة' : 'Skip this step'}</button> : <button type="button" onClick={() => goTo(currentStep + 1)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-brand-text hover:brightness-110">{currentStep === steps.length - 1 ? (isRTL ? 'إنهاء الجولة' : 'Finish tour') : (isRTL ? 'التالي' : 'Next')} {currentStep === steps.length - 1 ? <Check size={14} /> : <ArrowRight size={14} />}</button>}</div>
        {error && <p role="alert" className="mt-3 text-[11px] text-error">{error}</p>}
      </section>
    </div>}
  </>
}
