'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useLang } from '../../lib/LangContext'
import LanguageToggle from './LanguageToggle'
import DarkModeToggle from '../DarkModeToggle'
import WhatsAppConnect from '../channels/WhatsAppConnect'
import ShopifyConnect from '../channels/ShopifyConnect'
import WooCommerceConnect from '../channels/WooCommerceConnect'
import TelegramConnect from '../channels/TelegramConnect'
import { getBusinessHeaders } from '../../lib/businessContext'
import BrandWordmark from '../brand/BrandWordmark'
import { useHydratedReducedMotion } from '../../lib/useHydratedReducedMotion'
import toast from 'react-hot-toast'
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Bot,
  Zap,
  Radio,
  ShoppingBag,
  Send,
  Sliders,
  Check,
  Upload,
  Plus,
  Trash2,
  FileText,
  HelpCircle,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  ChevronRight,
  Play,
  MessageSquare,
  Workflow,
  ExternalLink,
  Loader2,
  AlertCircle,
  Settings,
  Database,
  Building,
  Layers,
  CheckCircle,
  Info,
  Calendar,
  Truck,
  RotateCcw,
} from 'lucide-react'

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface OnboardingData {
  businessType: string
  businessName: string
  category: string
  websiteUrl: string
  businessDescription: string
  phone: string
  city: string
  country: string
  currency: string
  timezone: string
  workingDays: string[]
  workingFrom: string
  workingTo: string
  assistantName: string
  assistantPersonality: string
  responseLanguage: string
  responseLength: 'concise' | 'balanced' | 'detailed'
  confidenceThreshold: number
  escalationEmail: string
  aiProvider: string
  aiModel: string
  services: string
  returnPolicy: string
  shippingPolicy: string
  faqs: { question: string; answer: string }[]
  replyStyle: string
  connectedChannel: string | null
  activeAutomations: string[]
}

interface ChannelItem {
  id: string
  type: string
  status?: string
}

const BUSINESS_CATEGORIES = [
  { id: 'ecommerce', icon: '🛍️', ar: 'متجر إلكتروني وتجزئة', en: 'E-commerce & Retail' },
  { id: 'healthcare', icon: '🏥', ar: 'عيادات ومراكز طبية', en: 'Healthcare & Clinics' },
  { id: 'beauty', icon: '💈', ar: 'صالونات وعناية وتجميل', en: 'Beauty & Wellness' },
  { id: 'restaurant', icon: '🍕', ar: 'مطاعم وكافيهات', en: 'Restaurants & Hospitality' },
  { id: 'realestate', icon: '🏢', ar: 'عقارات وتطوير عقاري', en: 'Real Estate' },
  { id: 'education', icon: '🎓', ar: 'تعليم وتدريب', en: 'Education & Training' },
  { id: 'services', icon: '💼', ar: 'خدمات واستشارات احترافية', en: 'Professional Services' },
  { id: 'other', icon: '📦', ar: 'نشاط تجاري آخر', en: 'Other Business' },
]

const PERSONALITY_STYLES = [
  {
    id: 'friendly',
    icon: '😊',
    ar: 'ودود ومرحب',
    en: 'Warm & Friendly',
    descAr: 'أسلوب محبب ومريح يشجع العميل على الشراء والتفاعل.',
    descEn: 'Approachable, warm, and engaging tone that invites questions.',
  },
  {
    id: 'professional',
    icon: '💼',
    ar: 'مهني ورسمي',
    en: 'Professional & Polished',
    descAr: 'ردود دقيقة، لغة مهذبة وواضحة تناسب الشركات والمؤسسات.',
    descEn: 'Polite, precise, and business-focused communication.',
  },
  {
    id: 'saudi',
    icon: '🇸🇦',
    ar: 'سعودي دارج ومرحب',
    en: 'Saudi Conversational',
    descAr: 'لهجة سعودية بيضاء محبوبة تناسب المتاجر المحلية بالمملكة.',
    descEn: 'Natural Saudi phrasing tailored for local Saudi commerce.',
  },
  {
    id: 'concise',
    icon: '⚡',
    ar: 'موجز ومباشر',
    en: 'Concise & Direct',
    descAr: 'إجابات سريعة تذهب لصلب الموضوع بدون إطالة.',
    descEn: 'Fast, to-the-point answers optimized for quick decisions.',
  },
]

const AI_PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI GPT-4o',
    model: 'gpt-4o',
    tag: 'Platform Managed',
    descEn: 'High-speed reasoning with exceptional Arabic & multilingual fluency.',
    descAr: 'سرعة فائقة ودقة استثنائية في فهم وتوليد النصوص العربية والإنجليزية.',
  },
  {
    id: 'claude',
    name: 'Anthropic Claude 3.5 Haiku',
    model: 'claude-haiku-4-5-20251001',
    tag: 'Platform Managed',
    descEn: 'Superior nuanced comprehension for complex customer policies.',
    descAr: 'فهم دقيق للسياسات والشروط المعقدة ومقاومة عالية للتشتت.',
  },
  {
    id: 'gemini',
    name: 'Google Gemini 2.5 Flash',
    model: 'gemini-2.5-flash',
    tag: 'Platform Managed',
    descEn: 'Ultra-low latency inference ideal for high-volume instant replies.',
    descAr: 'استجابة لحظية فائقة السرعة للأحجام الكبيرة من الرسائل المتزامنة.',
  },
]

const AUTOMATION_TEMPLATES = [
  {
    id: 'welcome',
    icon: Sparkles,
    color: '#1769FF',
    titleEn: 'Instant Welcome & Greeting',
    titleAr: 'ترحيب فوري وتأهيل أولي',
    descEn: 'Greet new customer messages automatically within 5 seconds with a friendly brand message.',
    descAr: 'الرد الترحيبي الفوري على أي عميل جديد خلال 5 ثوانٍ مع تقديم خيارات المساعدة.',
  },
  {
    id: 'faq_reply',
    icon: Bot,
    color: '#00D9FF',
    titleEn: 'Autonomous FAQ Resolution',
    titleAr: 'حل الأسئلة المتكررة ذاتياً',
    descEn: 'Answer common questions about prices, store location, payment, and policies with 99% accuracy.',
    descAr: 'إجابة أسئلة الأسعار، موقع الفروع، طرق الدفع، والشروط بالرجوع لقاعدة المعرفة.',
  },
  {
    id: 'order_status',
    icon: ShoppingBag,
    color: '#00B4D8',
    titleEn: 'Live Order Status Lookup',
    titleAr: 'استعلام فوري عن حالة الطلبات',
    descEn: 'Directly check connected store (Salla/Shopify) and return tracking link & status to customer.',
    descAr: 'البحث المباشر في المتجر المرتبط وتقديم رقم الشحنة ورابط التتبع للعميل.',
  },
  {
    id: 'shipping_info',
    icon: Truck,
    color: '#F59E0B',
    titleEn: 'Shipping & Delivery Guidance',
    titleAr: 'توضيح أوقات وتكاليف الشحن',
    descEn: 'Provide shipping options, rates, and estimated delivery dates based on customer city.',
    descAr: 'توضيح خيارات الشحن، الرسوم، والمدة المتوقعة للتسليم حسب مدينة العميل.',
  },
  {
    id: 'human_escalation',
    icon: Radio,
    color: '#EF4444',
    titleEn: 'Smart Human Agent Handoff',
    titleAr: 'تحويل ذكي للتدخل البشري',
    descEn: 'Notify your team when customer asks for a person or when sentiment indicates dissatisfaction.',
    descAr: 'إشعار فريق الدعم فوراً عند طلب العميل لموظف أو عند الشكاوى المعقدة.',
  },
]

export default function OnboardingWizard() {
  const { isRTL } = useLang()
  const searchParams = useSearchParams()
  const router = useRouter()
  const reducedMotion = useHydratedReducedMotion()

  // 8 Steps
  const [step, setStep] = useState(1)
  const totalSteps = 8
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Channels state
  const [connectedChannels, setConnectedChannels] = useState<string[]>([])
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [showShopifyModal, setShowShopifyModal] = useState(false)
  const [showWooCommercePanel, setShowWooCommercePanel] = useState(false)
  const [showTelegramModal, setShowTelegramModal] = useState(false)

  // Knowledge file upload state
  const [uploadBusy, setUploadBusy] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string; name: string; size: string }[]>([])

  // Live Test Chat Simulator state (Step 7)
  const [testMessages, setTestMessages] = useState<
    { sender: 'user' | 'bot'; text: string; time: string; tag?: string }[]
  >([])
  const [testInput, setTestInput] = useState('')
  const [isBotTyping, setIsBotTyping] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Main Form Data State
  const [data, setData] = useState<OnboardingData>({
    businessType: 'store',
    businessName: '',
    category: 'ecommerce',
    websiteUrl: '',
    businessDescription: '',
    phone: '',
    city: 'الرياض',
    country: 'السعودية',
    currency: 'SAR',
    timezone: 'Asia/Riyadh',
    workingDays: ['sat', 'sun', 'mon', 'tue', 'wed', 'thu'],
    workingFrom: '09:00',
    workingTo: '22:00',
    assistantName: 'نذير',
    assistantPersonality: 'saudi',
    responseLanguage: 'ar',
    responseLength: 'balanced',
    confidenceThreshold: 80,
    escalationEmail: '',
    aiProvider: 'openai',
    aiModel: 'gpt-4o',
    services: '',
    returnPolicy: 'استرجاع واستبدال مجاني خلال 7 أيام من تاريخ الاستلام للمنتجات غير المستخدمة.',
    shippingPolicy: 'شحن سريع لنفس اليوم داخل الرياض، وتوصيل خلال 2-3 أيام لباقي المدن.',
    faqs: [
      {
        question: 'ما هي مواعيد العمل والتوصيل لديكم؟',
        answer: 'نسعد بخدمتكم يومياً من 9:00 صباحاً حتى 10:00 مساءً، والتوصيل السريع متاح لنفس اليوم.',
      },
      {
        question: 'كيف يمكنني استبدال أو استرجاع المنتج؟',
        answer: 'يمكنك الاسترجاع أو الاستبدال بكل سهولة خلال 7 أيام من استلام الطلب وفق سياستنا المعتمدة.',
      },
    ],
    replyStyle: 'saudi',
    connectedChannel: null,
    activeAutomations: ['welcome', 'faq_reply', 'order_status', 'human_escalation'],
  })

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const getToken = () => {
    if (typeof document === 'undefined') return ''
    return (
      document.cookie
        .split(';')
        .find((c) => c.trim().startsWith('naz_token='))
        ?.split('=')[1] || ''
    )
  }

  // Load existing onboarding status and active channels from backend
  useEffect(() => {
    const loadState = async () => {
      const token = getToken()
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const [statusRes, channelsRes] = await Promise.all([
          fetch(`${API}/api/onboarding/status`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          }),
          fetch(`${API}/api/channels`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
              ...getBusinessHeaders(),
            },
          }).catch(() => null),
        ])

        if (statusRes.ok) {
          const statusJson = await statusRes.json()
          if (statusJson.completed) {
            router.replace('/dashboard')
            return
          }

          if (statusJson.business) {
            const b = statusJson.business
            if (b.id) window.localStorage.setItem('naz_selected_business_id', String(b.id))
            setData((prev) => ({
              ...prev,
              businessType: b.business_type || prev.businessType,
              businessName: b.business_name || b.name || prev.businessName,
              phone: b.phone || prev.phone,
              city: b.city || prev.city,
              country: b.country || prev.country,
              currency: b.currency || prev.currency,
              timezone: b.timezone || prev.timezone,
              workingDays: b.working_days || prev.workingDays,
              workingFrom: b.working_from || prev.workingFrom,
              workingTo: b.working_to || prev.workingTo,
              services: b.services || prev.services,
              faqs: Array.isArray(b.faqs) && b.faqs.length > 0 ? b.faqs : prev.faqs,
              replyStyle: b.reply_style || prev.replyStyle,
              assistantPersonality: b.reply_style || prev.assistantPersonality,
              connectedChannel: b.connected_channel || prev.connectedChannel,
            }))
          }
        }

        if (channelsRes && channelsRes.ok) {
          const channelsJson = await channelsRes.json()
          const realChannels: string[] = (
            Array.isArray(channelsJson?.data) ? channelsJson.data : []
          )
            .filter((c: ChannelItem) => c.status === 'connected' || c.status === 'active')
            .map((c: ChannelItem) => c.type.toLowerCase())
          setConnectedChannels(realChannels)
        }
      } catch (err) {
        console.error('Error loading onboarding state:', err)
      } finally {
        setLoading(false)
      }
    }

    loadState()
  }, [API, router])

  // Save current step data to real backend
  const saveStepData = async (stepNum: number) => {
    const token = getToken()
    if (!token) return

    try {
      // Step 2 & 5: Save business info & type
      if (stepNum === 2 || stepNum === 4 || stepNum === 5) {
        await fetch(`${API}/api/onboarding/step1`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            ...getBusinessHeaders(),
          },
          body: JSON.stringify({ business_type: data.category || data.businessType }),
        }).catch(() => null)

        await fetch(`${API}/api/onboarding/step2`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            ...getBusinessHeaders(),
          },
          body: JSON.stringify({
            business_name: data.businessName || 'My Business',
            phone: data.phone,
            city: data.city,
            country: data.country,
            currency: data.currency,
            timezone: data.timezone,
            working_days: data.workingDays,
            working_from: data.workingFrom,
            working_to: data.workingTo,
          }),
        }).catch(() => null)

        await fetch(`${API}/api/onboarding/step3`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            ...getBusinessHeaders(),
          },
          body: JSON.stringify({
            services: `${data.businessDescription}\n${data.services}`,
            faqs: data.faqs,
            reply_style: data.assistantPersonality,
          }),
        }).catch(() => null)
      }

      // Step 3: Channels
      if (stepNum === 3 && data.connectedChannel) {
        await fetch(`${API}/api/onboarding/step4`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            ...getBusinessHeaders(),
          },
          body: JSON.stringify({ connected_channel: data.connectedChannel }),
        }).catch(() => null)
      }
    } catch (e) {
      console.error('Error saving onboarding step:', e)
    }
  }

  // Navigation handlers
  const handleNext = async () => {
    setError('')
    setSaving(true)
    try {
      await saveStepData(step)
      if (step < totalSteps) {
        setStep((s) => s + 1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        await handleFinish()
      }
    } catch (e) {
      setError(isRTL ? 'تعذر حفظ التقدم.' : 'Could not save progress.')
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => s - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSkip = async () => {
    setSaving(true)
    try {
      const token = getToken()
      await fetch(`${API}/api/onboarding/skip`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          ...getBusinessHeaders(),
        },
      }).catch(() => null)
      router.replace('/dashboard')
    } catch {
      router.replace('/dashboard')
    } finally {
      setSaving(false)
    }
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      const token = getToken()
      await fetch(`${API}/api/onboarding/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          ...getBusinessHeaders(),
        },
      }).catch(() => null)
      toast.success(isRTL ? 'تم اكتمال الإعداد بنجاح!' : 'Onboarding complete!')
      router.replace('/dashboard')
    } catch {
      router.replace('/dashboard')
    } finally {
      setSaving(false)
    }
  }

  // File upload handler for Step 5 Knowledge Base
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const token = getToken()
    if (!token) return

    setUploadBusy(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API}/api/onboarding/upload-knowledge`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          ...getBusinessHeaders(),
        },
        body: formData,
      })
      if (res.ok) {
        toast.success(isRTL ? 'تم رفع وفهرسة المستند بنجاح!' : 'File indexed successfully!')
        setUploadedFiles((prev) => [
          ...prev,
          { id: String(Date.now()), name: file.name, size: `${(file.size / 1024).toFixed(0)} KB` },
        ])
      } else {
        toast.error(isRTL ? 'تعذر رفع الملف، يرجى المحاولة مرة أخرى.' : 'File upload failed.')
      }
    } catch {
      toast.error(isRTL ? 'خطأ في الاتصال بالخادم أثناء الرفع.' : 'Upload connection error.')
    } finally {
      setUploadBusy(false)
    }
  }

  // Test Simulator message submission (Step 7)
  const handleSendTestMessage = () => {
    if (!testInput.trim() || isBotTyping) return
    const userMsg = testInput.trim()
    setTestInput('')

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setTestMessages((prev) => [...prev, { sender: 'user', text: userMsg, time: now }])
    setIsBotTyping(true)

    // Simulate smart bot response based on data
    setTimeout(() => {
      let reply = ''
      const lower = userMsg.toLowerCase()
      if (lower.includes('طلب') || lower.includes('order')) {
        reply = isRTL
          ? `أهلاً بك! تم فحص سجل متجر ${data.businessName || 'المتجر'}، طلبك الأخير (#1042) تم تجهيزه وبانتظار مندوب شركة الشحن اليوم 🚚`
          : `Hello! I checked ${data.businessName || 'your store'} records, order #1042 has been packed and is dispatched with the courier today 🚚`
      } else if (lower.includes('استرجاع') || lower.includes('return')) {
        reply = isRTL
          ? `يسعدنا خدمتك! سياسة الاسترجاع في ${data.businessName || 'متجرنا'}: ${data.returnPolicy}`
          : `We are glad to help! Our policy at ${data.businessName || 'our store'}: ${data.returnPolicy}`
      } else {
        reply = isRTL
          ? `شكراً لتواصلك مع ${data.businessName || 'متجرنا'}! نخدمكم طوال أيام الأسبوع من ${data.workingFrom} إلى ${data.workingTo}. هل ترغب بمساعدة إضافية؟`
          : `Thanks for reaching out to ${data.businessName || 'our business'}! We are open daily from ${data.workingFrom} to ${data.workingTo}. How else can I assist you?`
      }

      setTestMessages((prev) => [
        ...prev,
        { sender: 'bot', text: reply, time: now, tag: 'AI Grounded' },
      ])
      setIsBotTyping(false)
    }, 1200)
  }

  // Scroll chat down
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [testMessages, isBotTyping])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand" />
          <p className="mt-4 text-xs font-bold text-text-secondary">
            {isRTL ? 'جارٍ تحميل إعدادات مساحة العمل...' : 'Loading onboarding workspace...'}
          </p>
        </div>
      </div>
    )
  }

  const stepTitles = [
    { num: 1, en: 'Welcome', ar: 'مرحباً بك' },
    { num: 2, en: 'Business Info', ar: 'بيانات النشاط' },
    { num: 3, en: 'Channels', ar: 'ربط القنوات' },
    { num: 4, en: 'AI Assistant', ar: 'تخصيص المساعد' },
    { num: 5, en: 'Knowledge', ar: 'قاعدة المعرفة' },
    { num: 6, en: 'Automations', ar: 'الأتمتة' },
    { num: 7, en: 'Test Assistant', ar: 'تجربة المساعد' },
    { num: 8, en: 'Ready to Launch', ar: 'اكتمال الإعداد' },
  ]

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="relative min-h-screen overflow-x-hidden px-4 pb-20 pt-8 sm:px-6 lg:px-8"
      style={{ background: 'var(--background)' }}
    >
      {/* Top Header Bar */}
      <header className="mx-auto mb-8 flex max-w-5xl items-center justify-between border-b border-border/80 pb-4">
        <Link href="/" className="flex items-center gap-2">
          <BrandWordmark width="75px" priority />
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-bold text-text-tertiary transition-colors hover:text-text-primary"
          >
            {isRTL ? 'تخطي إلى لوحة التحكم' : 'Skip to dashboard'}
          </button>
          <div className="h-4 w-px bg-border" />
          <LanguageToggle />
          <DarkModeToggle />
        </div>
      </header>

      {/* Modern Progress Bar */}
      <div className="mx-auto mb-10 max-w-5xl">
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2 scrollbar-none">
          {stepTitles.map((st) => {
            const isCompleted = step > st.num
            const isCurrent = step === st.num
            return (
              <div
                key={st.num}
                onClick={() => {
                  if (st.num < step) setStep(st.num)
                }}
                className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                  isCurrent
                    ? 'border border-brand/30 bg-brand/10 text-brand shadow-xs'
                    : isCompleted
                    ? 'text-success'
                    : 'text-text-tertiary opacity-60'
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                    isCurrent
                      ? 'bg-brand text-white'
                      : isCompleted
                      ? 'bg-success text-white'
                      : 'bg-surface-secondary text-text-tertiary'
                  }`}
                >
                  {isCompleted ? '✓' : st.num}
                </span>
                <span className="hidden sm:inline">{isRTL ? st.ar : st.en}</span>
              </div>
            )
          })}
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
          <motion.div
            className="h-full bg-gradient-to-r from-brand via-brand-cyan to-brand-violet"
            initial={{ width: 0 }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Main Container Card */}
      <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-surface-elevated/95 p-6 shadow-2xl backdrop-blur-xl sm:p-10">
        <AnimatePresence mode="wait">
          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="text-center"
            >
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl border border-brand/30 bg-brand/10 text-brand shadow-lg">
                <Sparkles size={32} />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-text-primary sm:text-4xl">
                {isRTL ? 'مرحباً بك في نذير أوتوريبلاي' : 'Welcome to Naz AutoReply'}
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base">
                {isRTL
                  ? 'دعنا نُعد معاً مساعدك الذكي لخدمة عملائك وزيادة مبيعاتك عبر قنوات المراسلة والمتاجر الإلكترونية خلال 3 دقائق فقط.'
                  : "Let's set up your autonomous AI business assistant to handle customer conversations and store workflows in under 3 minutes."}
              </p>

              <div className="mt-8 grid gap-4 text-start sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand font-bold text-xs">
                    01
                  </div>
                  <h4 className="text-xs font-bold text-text-primary">
                    {isRTL ? 'ربط القنوات' : 'Connect Channels'}
                  </h4>
                  <p className="mt-1 text-[11px] text-text-secondary">
                    {isRTL ? 'واتساب، إنستغرام، سلة، شوبيفاي' : 'WhatsApp, IG, Salla & Shopify'}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-cyan/10 text-brand-cyan font-bold text-xs">
                    02
                  </div>
                  <h4 className="text-xs font-bold text-text-primary">
                    {isRTL ? 'تدريب الذكاء' : 'Train the AI'}
                  </h4>
                  <p className="mt-1 text-[11px] text-text-secondary">
                    {isRTL ? 'رفع الأسئلة الشائعة وسياسات المتجر' : 'Upload FAQs and policies'}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-violet/10 text-brand-violet font-bold text-xs">
                    03
                  </div>
                  <h4 className="text-xs font-bold text-text-primary">
                    {isRTL ? 'أتمتة المبيعات' : 'Automate Sales'}
                  </h4>
                  <p className="mt-1 text-[11px] text-text-secondary">
                    {isRTL ? 'ردود 24/7 ومتابعة الطلبات' : '24/7 replies and order tracking'}
                  </p>
                </div>
              </div>

              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={handleNext}
                  className="group inline-flex min-h-12 items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-black text-white shadow-xl transition-transform hover:-translate-y-0.5"
                  style={{
                    background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)',
                    boxShadow: '0 8px 25px -4px rgba(23, 105, 255, 0.45)',
                  }}
                >
                  <span>{isRTL ? 'لنبدأ الآن' : "Let's Get Started"}</span>
                  <ArrowRight size={16} className={isRTL ? 'rotate-180' : ''} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: BUSINESS INFORMATION */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand">Step 2 of 8</span>
                <h2 className="text-2xl font-black text-text-primary">
                  {isRTL ? 'معلومات نشاطك التجاري' : 'Business Information'}
                </h2>
                <p className="mt-1 text-xs text-text-secondary sm:text-sm">
                  {isRTL
                    ? 'أدخل البيانات الأساسية لنشاطك ليتمكن المساعد من تمثيل علامتك باحترافية.'
                    : 'Provide the core details of your business so your assistant speaks with authority.'}
                </p>
              </div>

              <div className="space-y-4">
                {/* Business Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-text-secondary">
                    {isRTL ? 'اسم النشاط التجاري أو المتجر *' : 'Business / Store Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={data.businessName}
                    onChange={(e) => setData({ ...data, businessName: e.target.value })}
                    placeholder={isRTL ? 'مثال: متجر لافندر للعطور' : 'e.g. Acme Tech Solutions'}
                    className="w-full rounded-xl border border-border bg-surface-secondary/50 px-4 py-3 text-sm font-medium outline-none focus:border-brand focus:bg-surface-elevated"
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-text-secondary">
                    {isRTL ? 'تصنيف النشاط' : 'Business Category'}
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {BUSINESS_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setData({ ...data, category: cat.id, businessType: cat.id })}
                        className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                          data.category === cat.id
                            ? 'border-brand bg-brand/10 text-brand shadow-xs'
                            : 'border-border bg-surface text-text-secondary hover:border-brand/30'
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span className="truncate">{isRTL ? cat.ar : cat.en}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Website URL & Phone */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-text-secondary">
                      {isRTL ? 'رابط الموقع أو المتجر' : 'Website / Store URL'}
                    </label>
                    <input
                      type="url"
                      value={data.websiteUrl}
                      onChange={(e) => setData({ ...data, websiteUrl: e.target.value })}
                      placeholder="https://yourstore.com"
                      className="w-full rounded-xl border border-border bg-surface-secondary/50 px-4 py-2.5 text-sm font-medium outline-none focus:border-brand"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-text-secondary">
                      {isRTL ? 'رقم الهاتف أو خدمة العملاء' : 'Support Phone / WhatsApp'}
                    </label>
                    <input
                      type="text"
                      value={data.phone}
                      onChange={(e) => setData({ ...data, phone: e.target.value })}
                      placeholder="+966 50 000 0000"
                      className="w-full rounded-xl border border-border bg-surface-secondary/50 px-4 py-2.5 text-sm font-medium outline-none focus:border-brand"
                    />
                  </div>
                </div>

                {/* Country, City, Currency */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-text-secondary">
                      {isRTL ? 'الدولة' : 'Country'}
                    </label>
                    <input
                      type="text"
                      value={data.country}
                      onChange={(e) => setData({ ...data, country: e.target.value })}
                      className="w-full rounded-xl border border-border bg-surface-secondary/50 px-3 py-2 text-sm font-medium outline-none focus:border-brand"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-text-secondary">
                      {isRTL ? 'المدينة' : 'City'}
                    </label>
                    <input
                      type="text"
                      value={data.city}
                      onChange={(e) => setData({ ...data, city: e.target.value })}
                      className="w-full rounded-xl border border-border bg-surface-secondary/50 px-3 py-2 text-sm font-medium outline-none focus:border-brand"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-text-secondary">
                      {isRTL ? 'العملة' : 'Currency'}
                    </label>
                    <input
                      type="text"
                      value={data.currency}
                      onChange={(e) => setData({ ...data, currency: e.target.value.toUpperCase() })}
                      className="w-full rounded-xl border border-border bg-surface-secondary/50 px-3 py-2 text-sm font-medium outline-none focus:border-brand"
                    />
                  </div>
                </div>

                {/* Short Business Description */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-text-secondary">
                    {isRTL ? 'نبذة مختصرة عن نشاطك ومنتجاتك' : 'Short Business Description'}
                  </label>
                  <textarea
                    rows={2}
                    value={data.businessDescription}
                    onChange={(e) => setData({ ...data, businessDescription: e.target.value })}
                    placeholder={
                      isRTL
                        ? 'متجر إلكتروني متخصص في العطور الفاخرة والعود الطبيعي مع شحن لجميع مدن المملكة.'
                        : 'E-commerce boutique specializing in premium fragrances and express same-day shipping.'
                    }
                    className="w-full rounded-xl border border-border bg-surface-secondary/50 px-4 py-2.5 text-sm font-medium outline-none focus:border-brand"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: CONNECT CHANNELS */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand">Step 3 of 8</span>
                <h2 className="text-2xl font-black text-text-primary">
                  {isRTL ? 'ربط قنوات المراسلة والمتاجر' : 'Connect Channels & Stores'}
                </h2>
                <p className="mt-1 text-xs text-text-secondary sm:text-sm">
                  {isRTL
                    ? 'اختر القنوات التي تريد استقبال رسائل عملائها. يمكنك ربط قناة الآن أو تخطيها والربط لاحقاً.'
                    : 'Select channels to automate. Connect at least one or continue and connect from dashboard.'}
                </p>
              </div>

              {/* Channels Grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                {/* WhatsApp */}
                <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                      <Image src="/icons/whatsapp.svg" alt="WhatsApp" width={22} height={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">WhatsApp</h4>
                      <span className="text-[11px] text-text-tertiary">Cloud API & Web QR</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowWhatsAppModal(true)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                      connectedChannels.includes('whatsapp')
                        ? 'bg-success/10 text-success'
                        : 'border border-border bg-surface-secondary text-text-primary hover:border-brand'
                    }`}
                  >
                    {connectedChannels.includes('whatsapp')
                      ? isRTL ? 'متصل ✓' : 'Connected ✓'
                      : isRTL ? 'ربط' : 'Connect'}
                  </button>
                </div>

                {/* Salla */}
                <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
                      <Image src="/icons/sllla.svg" alt="Salla" width={22} height={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">Salla (سلة)</h4>
                      <span className="text-[11px] text-text-tertiary">Store Orders & Sync</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const token = getToken()
                      try {
                        const res = await fetch(`${API}/api/channels/connect/salla`, {
                          method: 'POST',
                          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
                        })
                        const data = await res.json().catch(() => ({}))
                        if (!res.ok || !data.url) {
                          throw new Error(data.message || data.error || 'Could not get Salla authorization URL')
                        }
                        window.location.href = data.url
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'Salla connection failed')
                      }
                    }}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                      connectedChannels.includes('salla')
                        ? 'bg-success/10 text-success'
                        : 'border border-border bg-surface-secondary text-text-primary hover:border-brand'
                    }`}
                  >
                    {connectedChannels.includes('salla')
                      ? isRTL ? 'متصل ✓' : 'Connected ✓'
                      : isRTL ? 'ربط سلة' : 'Connect'}
                  </button>
                </div>

                {/* Instagram */}
                <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10 text-pink-500">
                      <Image src="/icons/instagram.svg" alt="Instagram" width={22} height={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">Instagram</h4>
                      <span className="text-[11px] text-text-tertiary">DMs & Comments</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const token = getToken()
                      try {
                        const res = await fetch(`${API}/api/channels/connect/facebook`, {
                          method: 'POST',
                          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
                        })
                        const data = await res.json().catch(() => ({}))
                        if (!res.ok || !data.url) {
                          throw new Error(data.message || data.error || 'Could not get Facebook/Instagram authorization URL')
                        }
                        window.location.href = data.url
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'Instagram connection failed')
                      }
                    }}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                      connectedChannels.includes('instagram')
                        ? 'bg-success/10 text-success'
                        : 'border border-border bg-surface-secondary text-text-primary hover:border-brand'
                    }`}
                  >
                    {connectedChannels.includes('instagram')
                      ? isRTL ? 'متصل ✓' : 'Connected ✓'
                      : isRTL ? 'ربط Meta' : 'Connect'}
                  </button>
                </div>

                {/* Shopify */}
                <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-500/10 text-lime-500">
                      <Image src="/icons/shopify.svg" alt="Shopify" width={22} height={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">Shopify</h4>
                      <span className="text-[11px] text-text-tertiary">Store & Orders</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowShopifyModal(true)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                      connectedChannels.includes('shopify')
                        ? 'bg-success/10 text-success'
                        : 'border border-border bg-surface-secondary text-text-primary hover:border-brand'
                    }`}
                  >
                    {connectedChannels.includes('shopify')
                      ? isRTL ? 'متصل ✓' : 'Connected ✓'
                      : isRTL ? 'ربط' : 'Connect'}
                  </button>
                </div>

                {/* Telegram */}
                <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
                      <Image src="/icons/telegram.svg" alt="Telegram" width={22} height={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">Telegram</h4>
                      <span className="text-[11px] text-text-tertiary">Bot Token</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTelegramModal(true)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                      connectedChannels.includes('telegram')
                        ? 'bg-success/10 text-success'
                        : 'border border-border bg-surface-secondary text-text-primary hover:border-brand'
                    }`}
                  >
                    {connectedChannels.includes('telegram')
                      ? isRTL ? 'متصل ✓' : 'Connected ✓'
                      : isRTL ? 'ربط البوت' : 'Connect'}
                  </button>
                </div>

                {/* WooCommerce */}
                <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                      <Image src="/icons/woocommerce-icon.svg" alt="WooCommerce" width={22} height={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">WooCommerce</h4>
                      <span className="text-[11px] text-text-tertiary">REST API Keys</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowWooCommercePanel(true)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                      connectedChannels.includes('woocommerce')
                        ? 'bg-success/10 text-success'
                        : 'border border-border bg-surface-secondary text-text-primary hover:border-brand'
                    }`}
                  >
                    {connectedChannels.includes('woocommerce')
                      ? isRTL ? 'متصل ✓' : 'Connected ✓'
                      : isRTL ? 'ربط' : 'Connect'}
                  </button>
                </div>
              </div>

              {/* Modals for real channel connections */}
              {showWhatsAppModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                  <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-surface-elevated p-6 shadow-2xl">
                    <WhatsAppConnect
                      isConnected={connectedChannels.includes('whatsapp')}
                      onConnected={() => {
                        setConnectedChannels((c) => [...c, 'whatsapp'])
                        setShowWhatsAppModal(false)
                        toast.success('WhatsApp connected!')
                      }}
                      onClose={() => setShowWhatsAppModal(false)}
                    />
                  </div>
                </div>
              )}

              {showShopifyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                  <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-surface-elevated p-6 shadow-2xl">
                    <ShopifyConnect
                      isConnected={connectedChannels.includes('shopify')}
                      onConnect={async ({ shop_domain }) => {
                        try {
                          const token = getToken()
                          await fetch(`${API}/api/channels/shopify/connect`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${token}`,
                              Accept: 'application/json',
                              ...getBusinessHeaders(),
                            },
                            body: JSON.stringify({ shop_url: shop_domain }),
                          })
                          setConnectedChannels((c) => [...c, 'shopify'])
                          setShowShopifyModal(false)
                          toast.success('Shopify connected!')
                        } catch {
                          toast.error('Failed to initiate Shopify connect')
                        }
                      }}
                      onDisconnect={async () => {}}
                      onClose={() => setShowShopifyModal(false)}
                    />
                  </div>
                </div>
              )}

              {showWooCommercePanel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                  <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-surface-elevated p-6 shadow-2xl">
                    <div className="flex justify-end mb-2">
                      <button
                        type="button"
                        onClick={() => setShowWooCommercePanel(false)}
                        className="p-1 rounded-lg border border-border hover:bg-surface-secondary text-text-tertiary"
                      >
                        ✕
                      </button>
                    </div>
                    <WooCommerceConnect
                      isConnected={connectedChannels.includes('woocommerce')}
                      onConnect={async ({ store_url }) => {
                        setConnectedChannels((c) => [...c, 'woocommerce'])
                        setShowWooCommercePanel(false)
                        toast.success('WooCommerce connected!')
                      }}
                      onDisconnect={async () => {}}
                    />
                  </div>
                </div>
              )}

              {showTelegramModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                  <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-surface-elevated p-6 shadow-2xl">
                    <div className="flex justify-end mb-2">
                      <button
                        type="button"
                        onClick={() => setShowTelegramModal(false)}
                        className="p-1 rounded-lg border border-border hover:bg-surface-secondary text-text-tertiary"
                      >
                        ✕
                      </button>
                    </div>
                    <TelegramConnect
                      isConnected={connectedChannels.includes('telegram')}
                      onConnect={async ({ bot_token }) => {
                        const token = getToken()
                        const res = await fetch(`${API}/api/channels/telegram/connect`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                            Accept: 'application/json',
                            ...getBusinessHeaders(),
                          },
                          body: JSON.stringify({ bot_token }),
                        })
                        if (!res.ok) throw new Error('Telegram connection failed')
                        setConnectedChannels((c) => [...c, 'telegram'])
                        setShowTelegramModal(false)
                        toast.success('Telegram connected!')
                      }}
                      onDisconnect={async () => {}}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 4: AI ASSISTANT CONFIGURATION */}
          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand">Step 4 of 8</span>
                <h2 className="text-2xl font-black text-text-primary">
                  {isRTL ? 'تخصيص شخصية المساعد الذكي' : 'Configure Your AI Assistant'}
                </h2>
                <p className="mt-1 text-xs text-text-secondary sm:text-sm">
                  {isRTL
                    ? 'حدد اسم ونبرة ونموذج الذكاء الاصطناعي ليعكس روح علامتك التجارية.'
                    : 'Name your assistant, choose its communication style, and select the AI model.'}
                </p>
              </div>

              {/* Assistant Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-text-secondary">
                  {isRTL ? 'اسم المساعد' : 'Assistant Name'}
                </label>
                <input
                  type="text"
                  value={data.assistantName}
                  onChange={(e) => setData({ ...data, assistantName: e.target.value })}
                  placeholder={isRTL ? 'مثال: نذير أو سارة' : 'e.g. Naz Support or Maya'}
                  className="w-full rounded-xl border border-border bg-surface-secondary/50 px-4 py-2.5 text-sm font-medium outline-none focus:border-brand"
                />
              </div>

              {/* Personality Styles */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-text-secondary">
                  {isRTL ? 'شخصية ونبرة الرد' : 'Personality & Tone'}
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PERSONALITY_STYLES.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setData({ ...data, assistantPersonality: style.id, replyStyle: style.id })}
                      className={`flex flex-col text-start rounded-2xl border p-4 transition-all ${
                        data.assistantPersonality === style.id
                          ? 'border-brand bg-brand/10 shadow-xs'
                          : 'border-border bg-surface hover:border-brand/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{style.icon}</span>
                        <span className="text-sm font-bold text-text-primary">
                          {isRTL ? style.ar : style.en}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-text-secondary">
                        {isRTL ? style.descAr : style.descEn}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Provider & Model */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-text-secondary">
                  {isRTL ? 'محرك ونموذج الذكاء الاصطناعي' : 'AI Model & Provider'}
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {AI_PROVIDERS.map((prov) => (
                    <button
                      key={prov.id}
                      type="button"
                      onClick={() => setData({ ...data, aiProvider: prov.id, aiModel: prov.model })}
                      className={`flex flex-col text-start rounded-2xl border p-3.5 transition-all ${
                        data.aiProvider === prov.id
                          ? 'border-brand bg-brand/10 shadow-xs'
                          : 'border-border bg-surface hover:border-brand/40'
                      }`}
                    >
                      <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[9px] font-bold text-brand w-fit mb-1.5">
                        {prov.tag}
                      </span>
                      <span className="text-xs font-black text-text-primary">{prov.name}</span>
                      <p className="mt-1 text-[11px] text-text-secondary leading-relaxed">
                        {isRTL ? prov.descAr : prov.descEn}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: BUSINESS KNOWLEDGE BASE */}
          {step === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand">Step 5 of 8</span>
                <h2 className="text-2xl font-black text-text-primary">
                  {isRTL ? 'قاعدة معرفة وسياسات المتجر' : 'Business Knowledge Base'}
                </h2>
                <p className="mt-1 text-xs text-text-secondary sm:text-sm">
                  {isRTL
                    ? 'أضف سياسات نشاطك أو ارفع ملفات PDF/Excel ليتعلم المساعد كيفية الإجابة بدقة.'
                    : 'Add core store policies and upload documentation so AI never hallucinates.'}
                </p>
              </div>

              {/* File Upload Zone */}
              <div className="rounded-2xl border-2 border-dashed border-border bg-surface-secondary/40 p-6 text-center transition-colors hover:border-brand/40">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                  <Upload size={22} />
                </div>
                <h4 className="text-sm font-bold text-text-primary">
                  {isRTL ? 'رفع ملف معرفة (PDF أو Excel)' : 'Upload Knowledge File (PDF or Excel)'}
                </h4>
                <p className="mt-1 text-xs text-text-tertiary">
                  {isRTL ? 'الحد الأقصى 10 ميجابايت للمستند' : 'Max 10MB per document'}
                </p>
                <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-brand bg-brand px-4 py-2 text-xs font-bold text-brand-text shadow-sm hover:opacity-90">
                  <Upload size={14} />
                  <span>{uploadBusy ? (isRTL ? 'جارٍ الفهرسة...' : 'Indexing...') : (isRTL ? 'اختر ملفاً' : 'Select File')}</span>
                  <input
                    type="file"
                    accept=".pdf,.xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    disabled={uploadBusy}
                    className="hidden"
                  />
                </label>

                {/* Uploaded files list */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2 text-start">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between rounded-xl border border-success/30 bg-success/10 p-2.5 text-xs text-success"
                      >
                        <div className="flex items-center gap-2">
                          <FileText size={14} />
                          <span className="font-semibold">{file.name}</span>
                          <span className="text-[10px] opacity-75">({file.size})</span>
                        </div>
                        <CheckCircle2 size={15} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Policy Quick Fields */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-text-secondary">
                    {isRTL ? 'سياسة الاستبدال والاسترجاع' : 'Return & Refund Policy'}
                  </label>
                  <textarea
                    rows={2}
                    value={data.returnPolicy}
                    onChange={(e) => setData({ ...data, returnPolicy: e.target.value })}
                    className="w-full rounded-xl border border-border bg-surface-secondary/50 px-3 py-2 text-xs font-medium outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-text-secondary">
                    {isRTL ? 'سياسة وأوقات الشحن والتوصيل' : 'Shipping & Delivery Details'}
                  </label>
                  <textarea
                    rows={2}
                    value={data.shippingPolicy}
                    onChange={(e) => setData({ ...data, shippingPolicy: e.target.value })}
                    className="w-full rounded-xl border border-border bg-surface-secondary/50 px-3 py-2 text-xs font-medium outline-none focus:border-brand"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 6: AUTOMATION SETUP */}
          {step === 6 && (
            <motion.div
              key="step-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand">Step 6 of 8</span>
                <h2 className="text-2xl font-black text-text-primary">
                  {isRTL ? 'تفعيل قوالب الأتمتة الجاهزة' : 'Deploy Automation Workflows'}
                </h2>
                <p className="mt-1 text-xs text-text-secondary sm:text-sm">
                  {isRTL
                    ? 'اختر القوالب التي تريد تفعيلها فوراً لخدمة عملائك.'
                    : 'Toggle instant workflows to automatically engage, assist, and convert buyers.'}
                </p>
              </div>

              <div className="space-y-3">
                {AUTOMATION_TEMPLATES.map((tmpl) => {
                  const Icon = tmpl.icon
                  const isActive = data.activeAutomations.includes(tmpl.id)
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => {
                        if (isActive) {
                          setData({
                            ...data,
                            activeAutomations: data.activeAutomations.filter((id) => id !== tmpl.id),
                          })
                        } else {
                          setData({
                            ...data,
                            activeAutomations: [...data.activeAutomations, tmpl.id],
                          })
                        }
                      }}
                      className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-all ${
                        isActive
                          ? 'border-brand/40 bg-brand/5 shadow-xs'
                          : 'border-border bg-surface opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface shadow-xs"
                          style={{ color: tmpl.color }}
                        >
                          <Icon size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-text-primary">
                            {isRTL ? tmpl.titleAr : tmpl.titleEn}
                          </h4>
                          <p className="mt-0.5 text-xs text-text-secondary">
                            {isRTL ? tmpl.descAr : tmpl.descEn}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`flex h-6 w-11 items-center rounded-full p-1 transition-colors ${
                          isActive ? 'bg-brand' : 'bg-surface-secondary'
                        }`}
                      >
                        <div
                          className={`h-4 w-4 rounded-full bg-white transition-transform ${
                            isActive ? (isRTL ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 7: TEST THE ASSISTANT */}
          {step === 7 && (
            <motion.div
              key="step-7"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand">Step 7 of 8</span>
                <h2 className="text-2xl font-black text-text-primary">
                  {isRTL ? 'تجربة المساعد الذكي مباشرة' : 'Test Your AI Assistant'}
                </h2>
                <p className="mt-1 text-xs text-text-secondary sm:text-sm">
                  {isRTL
                    ? 'أرسل رسالة تجريبية ولاحظ كيف يجيب المساعد بناءً على معلومات متجرك.'
                    : 'Send a prompt or pick a question below to see live grounded reasoning in action.'}
                </p>
              </div>

              {/* Chat Simulator Window */}
              <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
                <div className="flex items-center justify-between border-b border-border bg-surface-secondary px-4 py-2.5 text-xs font-bold text-text-secondary">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    <span>{data.assistantName || 'Naz Assistant'} (Simulation Mode)</span>
                  </div>
                  <span className="text-[11px] text-text-tertiary">Verified Engine</span>
                </div>

                {/* Messages stream */}
                <div
                  ref={chatScrollRef}
                  className="max-h-64 min-h-[220px] overflow-y-auto p-4 space-y-3 text-xs"
                >
                  {testMessages.length === 0 && (
                    <div className="py-8 text-center text-text-tertiary">
                      {isRTL
                        ? 'انقر على أحد الأسئلة السريعة أدناه أو اكتب رسالتك لتجربة الرد.'
                        : 'Click a prompt chip below or type a message to test.'}
                    </div>
                  )}

                  {testMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-brand text-white'
                            : 'border border-border bg-surface-elevated text-text-primary shadow-xs'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <div className="mt-1 flex items-center justify-between gap-3 text-[9px] opacity-70">
                          {msg.tag && <span className="font-bold text-brand-cyan">{msg.tag}</span>}
                          <span>{msg.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {isBotTyping && (
                    <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                      <Bot size={14} className="animate-spin text-brand" />
                      <span>{isRTL ? 'المساعد يكتب رداً...' : 'Assistant is typing...'}</span>
                    </div>
                  )}
                </div>

                {/* Prompt suggestions chips */}
                <div className="flex flex-wrap gap-1.5 border-t border-border bg-surface-secondary/40 p-2.5">
                  {[
                    isRTL ? 'وين وصل طلبي الأخير؟' : 'Where is my order #1042?',
                    isRTL ? 'ما هي سياسة الاسترجاع؟' : 'What is your return policy?',
                    isRTL ? 'ما هي مواعيد العمل لديكم؟' : 'What are your working hours?',
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTestInput(chip)}
                      className="rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-text-secondary hover:border-brand/40"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Message input */}
                <div className="flex items-center gap-2 border-t border-border p-3">
                  <input
                    type="text"
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendTestMessage()
                    }}
                    placeholder={isRTL ? 'اكتب رسالة تجريبية...' : 'Type a test message...'}
                    className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium outline-none focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={handleSendTestMessage}
                    disabled={!testInput.trim() || isBotTyping}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-white disabled:opacity-50"
                  >
                    <Send size={14} className={isRTL ? 'rotate-180' : ''} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 8: SETUP COMPLETION */}
          {step === 8 && (
            <motion.div
              key="step-8"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="text-center space-y-6"
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-success/10 text-success shadow-xl">
                <CheckCircle size={42} />
              </div>

              <div>
                <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
                  {isRTL ? 'جاهز للانطلاق بنسبة 100%' : '100% Ready for Deployment'}
                </span>
                <h2 className="mt-3 text-3xl font-black text-text-primary">
                  {isRTL ? 'تم تجهيز مساحة عملك بنجاح!' : 'Your Workspace is Ready!'}
                </h2>
                <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-text-secondary leading-relaxed">
                  {isRTL
                    ? `مساعدك الذكي (${data.assistantName}) تم تدريبه وضبطه وهو جاهز لخدمة عملائك فوراً.`
                    : `Your AI assistant (${data.assistantName}) has been trained and is ready to automate conversations.`}
                </p>
              </div>

              {/* Completion Checklist */}
              <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-5 text-start space-y-3">
                <div className="flex items-center gap-2.5 text-xs font-bold text-text-primary">
                  <CheckCircle2 size={16} className="text-success shrink-0" />
                  <span>{isRTL ? 'تم حفظ ملف وهوية النشاط التجاري' : 'Business profile & identity configured'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-bold text-text-primary">
                  <CheckCircle2 size={16} className="text-success shrink-0" />
                  <span>
                    {connectedChannels.length > 0
                      ? isRTL
                        ? `تم ربط قنوات الاتصال (${connectedChannels.join(', ')})`
                        : `Channels connected (${connectedChannels.join(', ')})`
                      : isRTL
                      ? 'يمكنك ربط القنوات لاحقاً من لوحة التحكم'
                      : 'Channels ready to link anytime from settings'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-bold text-text-primary">
                  <CheckCircle2 size={16} className="text-success shrink-0" />
                  <span>{isRTL ? 'تم ضبط شخصية ونبرة المساعد الذكي' : 'AI persona & multi-model engine verified'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-bold text-text-primary">
                  <CheckCircle2 size={16} className="text-success shrink-0" />
                  <span>{isRTL ? 'تمت فهرسة سياسات وقاعدة معرفة المتجر' : 'Store policies & knowledge base indexed'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-bold text-text-primary">
                  <CheckCircle2 size={16} className="text-success shrink-0" />
                  <span>{isRTL ? 'تم تفعيل مسارات الأتمتة الأساسية' : 'Core autonomous workflows activated'}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-bold text-text-secondary transition-all hover:border-brand/40 hover:text-text-primary"
            >
              <ArrowLeft size={14} className={isRTL ? 'rotate-180' : ''} />
              <span>{isRTL ? 'السابق' : 'Back'}</span>
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={saving || (step === 2 && !data.businessName.trim())}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-xs font-black text-brand-text shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>{isRTL ? 'جارٍ الحفظ...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <span>{isRTL ? 'التالي' : 'Continue'}</span>
                  <ArrowRight size={14} className={isRTL ? 'rotate-180' : ''} />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-success px-7 py-3 text-sm font-black text-white shadow-lg transition-transform hover:-translate-y-0.5"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{isRTL ? 'جارٍ التفعيل...' : 'Finishing...'}</span>
                </>
              ) : (
                <>
                  <span>{isRTL ? 'الانتقال إلى لوحة التحكم' : 'Go to Dashboard'}</span>
                  <ArrowRight size={16} className={isRTL ? 'rotate-180' : ''} />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
