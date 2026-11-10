'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import { useLang } from '../../lib/LangContext'
import LanguageToggle from './LanguageToggle'
import DarkModeToggle from '../DarkModeToggle'
import WhatsAppConnect from '../channels/WhatsAppConnect'
import ShopifyConnect from '../channels/ShopifyConnect'
import WooCommerceConnect from '../channels/WooCommerceConnect'
import Select from '../ui/Select'
import { getBusinessHeaders } from '../../lib/businessContext'
import BrandLoading from '../brand/BrandLoading'
import BrandWordmark from '../brand/BrandWordmark'
import { useHydratedReducedMotion } from '../../lib/useHydratedReducedMotion'
import Image from 'next/image'
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
} from 'lucide-react'

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface OnboardingData {
  businessType: string
  businessName: string
  phone: string
  city: string
  country: string
  currency: string
  timezone: string
  workingDays: string[]
  workingFrom: string
  workingTo: string
  services: string
  faqs: { question: string; answer: string }[]
  replyStyle: string
  connectedChannel: string | null
}

interface ChannelItem {
  id: string
  type: string
  status?: string
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const BUSINESS_TYPES = [
  { id: 'store',      icon: '🛍️', ar: 'متجر إلكتروني أو تجزئة', en: 'E-commerce / Retail' },
  { id: 'restaurant', icon: '🍕', ar: 'مطعم أو كافيه',          en: 'Restaurant / Café' },
  { id: 'clinic',     icon: '🏥', ar: 'عيادة أو مركز طبي',     en: 'Clinic / Healthcare' },
  { id: 'salon',      icon: '💈', ar: 'صالون أو عناية وتجميل',  en: 'Salon / Beauty & Spa' },
  { id: 'realestate', icon: '🏢', ar: 'عقارات وتطوير عقاري',    en: 'Real Estate' },
  { id: 'consulting', icon: '💼', ar: 'مكتب استشاري أو خدمات',  en: 'Consulting / Services' },
  { id: 'other',      icon: '📦', ar: 'نشاط تجاري آخر',         en: 'Other Business' },
]

const DAYS = [
  { id: 'sat', ar: 'السبت',     en: 'Sat' },
  { id: 'sun', ar: 'الأحد',     en: 'Sun' },
  { id: 'mon', ar: 'الاثنين',   en: 'Mon' },
  { id: 'tue', ar: 'الثلاثاء',  en: 'Tue' },
  { id: 'wed', ar: 'الأربعاء', en: 'Wed' },
  { id: 'thu', ar: 'الخميس',   en: 'Thu' },
  { id: 'fri', ar: 'الجمعة',   en: 'Fri' },
]

const REPLY_STYLES = [
  {
    id: 'friendly',
    icon: '😊',
    ar: 'ودود ومرحب',
    en: 'Warm & Friendly',
    descAr: 'أسلوب محبب ومريح يشجع العميل على الشراء والتفاعل.',
    descEn: 'Approachable and engaging tone that invites questions.',
  },
  {
    id: 'formal',
    icon: '🎩',
    ar: 'رسمي واحترافي',
    en: 'Formal & Professional',
    descAr: 'أسلوب مهني وموجز يناسب الشركات والمؤسسات الراقية.',
    descEn: 'Polished corporate tone suitable for enterprise & B2B.',
  },
  {
    id: 'saudi',
    icon: '🇸🇦',
    ar: 'لهجة سعودية / خليجية',
    en: 'Saudi / Gulf Dialect',
    descAr: 'ترحيب سعودي حميمي (أهلاً وسهلاً، يسعدنا خدمتك، أبشر).',
    descEn: 'Authentic Gulf Arabic greetings and local hospitality.',
  },
  {
    id: 'arabic',
    icon: '📖',
    ar: 'عربية فصحى مبسطة',
    en: 'Modern Standard Arabic',
    descAr: 'لغة عربية واضحة ومفهومة تناسب جميع العملاء في الوطن العربي.',
    descEn: 'Clear and universally understood Arabic across all regions.',
  },
  {
    id: 'english',
    icon: '🇬🇧',
    ar: 'إنجليزية فقط',
    en: 'English Only',
    descAr: 'تواصل كامل باللغة الإنجليزية للعملاء العالميين.',
    descEn: 'Dedicated English communication for international customers.',
  },
  {
    id: 'auto',
    icon: '🌍',
    ar: 'كشف تلقائي حسب العميل',
    en: 'Auto-Detect Language',
    descAr: 'يتعرف الذكاء الاصطناعي على لغة ولهجة كل عميل ويرد بنفس لغته.',
    descEn: 'AI detects customer language and dialect and matches it.',
  },
]

const COUNTRIES = [
  'السعودية',
  'الإمارات',
  'الكويت',
  'قطر',
  'البحرين',
  'عمان',
  'مصر',
  'الأردن',
  'المغرب',
  'United Kingdom',
  'United States',
  'Other',
]

const REGIONAL_DEFAULTS: Record<string, { currency: string; timezone: string }> = {
  'السعودية': { currency: 'SAR', timezone: 'Asia/Riyadh' },
  'الإمارات': { currency: 'AED', timezone: 'Asia/Dubai' },
  'الكويت': { currency: 'KWD', timezone: 'Asia/Kuwait' },
  'قطر': { currency: 'QAR', timezone: 'Asia/Qatar' },
  'البحرين': { currency: 'BHD', timezone: 'Asia/Bahrain' },
  'عمان': { currency: 'OMR', timezone: 'Asia/Muscat' },
  'مصر': { currency: 'EGP', timezone: 'Africa/Cairo' },
  'الأردن': { currency: 'JOD', timezone: 'Asia/Amman' },
  'المغرب': { currency: 'MAD', timezone: 'Africa/Casablanca' },
  'United Kingdom': { currency: 'GBP', timezone: 'Europe/London' },
  'United States': { currency: 'USD', timezone: 'America/New_York' },
}

const MESSAGING_CHANNELS = [
  {
    id: 'whatsapp',
    label: 'WhatsApp Business',
    icon: '/icons/whatsapp.svg',
    color: '#25D366',
    descAr: 'رد فوري على محادثات واتساب برقمك الخاص مع مزامنة الكتالوج.',
    descEn: 'Instant auto-replies on WhatsApp with catalog & order sync.',
    actionLabelAr: 'ربط عبر رمز الاستجابة QR',
    actionLabelEn: 'Connect via QR Code',
  },
  {
    id: 'instagram',
    label: 'Instagram Direct & Comments',
    icon: '/icons/instagram.svg',
    color: '#E4405F',
    descAr: 'الرد الفوري على رسائل الخاص والتعليقات على المنشورات والريلز.',
    descEn: 'Reply to DMs and auto-respond to reel & post comments.',
    actionLabelAr: 'ربط حساب Instagram',
    actionLabelEn: 'Connect Instagram',
  },
  {
    id: 'facebook',
    label: 'Facebook Messenger',
    icon: '/icons/facebook.svg',
    color: '#1877F2',
    descAr: 'إدارة رسائل صفحات فيسبوك والرد على استفسارات المبيعات.',
    descEn: 'Manage Facebook page inbox and auto-qualify leads.',
    actionLabelAr: 'ربط صفحة Facebook',
    actionLabelEn: 'Connect Facebook',
  },
  {
    id: 'gmail',
    label: 'Gmail & Email',
    icon: '/icons/gmail.svg',
    color: '#EA4335',
    descAr: 'معالجة البريد الوارد وتلخيص استفسارات العملاء والرد التلقائي.',
    descEn: 'Handle incoming customer support emails autonomously.',
    actionLabelAr: 'ربط حساب Gmail',
    actionLabelEn: 'Connect Gmail',
  },
  {
    id: 'telegram',
    label: 'Telegram Bot',
    icon: '/icons/telegram.svg',
    color: '#24A1DE',
    descAr: 'ربط قنوات ومجموعات تيليجرام للبث والرد الذكي السريع.',
    descEn: 'Deploy a high-speed Telegram assistant for support & alerts.',
    actionLabelAr: 'ربط بوت Telegram',
    actionLabelEn: 'Connect Telegram',
  },
]

const STORE_CHANNELS = [
  {
    id: 'salla',
    label: 'منصة سلة (Salla)',
    icon: '/icons/sllla.svg',
    color: '#00B4D8',
    descAr: 'مزامنة مباشرة للمنتجات، المخزون، وتتبع الشحنات مع سلة تلقائياً.',
    descEn: 'Full sync with Salla for live product catalog and order tracking.',
  },
  {
    id: 'shopify',
    label: 'Shopify Store',
    icon: '/icons/shopify.svg',
    color: '#95BF47',
    descAr: 'ربط متجر شوبيفاي لمساعدة العميل على الاستفسار والشراء مباشرة.',
    descEn: 'Direct Shopify integration for live products and checkout assistance.',
  },
  {
    id: 'woocommerce',
    label: 'WooCommerce',
    icon: '/icons/woocommerce-icon.svg',
    color: '#96588A',
    descAr: 'ربط ووردبريس وووكومرس عبر مفاتيح REST API بسهولة.',
    descEn: 'Connect your WordPress WooCommerce store via REST API keys.',
  },
]

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function OnboardingWizard() {
  const { isRTL } = useLang()
  const searchParams = useSearchParams()
  const router = useRouter()
  const reducedMotion = useHydratedReducedMotion()

  const [step, setStep] = useState(1) // 1: Welcome, 2: Channels, 3: Store, 4: AI & Knowledge, 5: Live Test, 6: Automations, 7: Launch
  const [totalSteps] = useState(7)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [direction, setDirection] = useState(1)

  // Real connected channels state
  const [connectedChannels, setConnectedChannels] = useState<string[]>([])
  const [connectingChannel, setConnectingChannel] = useState<string | null>(null)

  // Integration modals state
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [showShopifyModal, setShowShopifyModal] = useState(false)
  const [showWooCommercePanel, setShowWooCommercePanel] = useState(false)

  // Knowledge file upload state
  const [uploadState, setUploadState] = useState<{ busy: boolean; message: string; error: boolean }>({
    busy: false,
    message: '',
    error: false,
  })

  // Live Test Chat Simulator state (Step 5)
  const [testMessages, setTestMessages] = useState<
    { sender: 'user' | 'bot'; text: string; time: string; orderLink?: boolean }[]
  >([])
  const [testInput, setTestInput] = useState('')
  const [isBotTyping, setIsBotTyping] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Main data state
  const [data, setData] = useState<OnboardingData>({
    businessType: 'store',
    businessName: '',
    phone: '',
    city: 'الرياض',
    country: 'السعودية',
    currency: 'SAR',
    timezone: 'Asia/Riyadh',
    workingDays: ['sat', 'sun', 'mon', 'tue', 'wed', 'thu'],
    workingFrom: '09:00',
    workingTo: '22:00',
    services: '',
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

  // Load progress and channel status from backend
  useEffect(() => {
    const loadState = async () => {
      const token = getToken()
      if (!token) {
        setLoading(false)
        return
      }

      try {
        // Fetch current onboarding status
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
          if (statusJson.completed || statusJson.wizard_dismissed) {
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

  // Scroll chat to bottom in test lab
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [testMessages, isBotTyping])

  // Initialize test simulator messages when entering Step 5
  useEffect(() => {
    if (step === 5 && testMessages.length === 0) {
      setTestMessages([
        {
          sender: 'bot',
          text: isRTL
            ? `أهلاً بك! أنا مساعد ${data.businessName || 'متجرك'} الذكي 🤖 تفضل بطرح أي سؤال وسأجيبك فوراً كما سأجيب عملاءك الحقيقيين.`
            : `Hello! I am your ${data.businessName || 'business'} AI assistant 🤖 Ask me anything and I'll reply instantly just like I would to your real customers.`,
          time: 'Just now',
        },
      ])
    }
  }, [step, isRTL, data.businessName, testMessages.length])

  // Save current step to backend
  const saveStepData = async (stepNumber: number) => {
    const token = getToken()
    if (!token) return

    try {
      if (stepNumber === 1 || stepNumber === 4) {
        // Save business type & profile
        await fetch(`${API}/api/onboarding/step1`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            ...getBusinessHeaders(),
          },
          body: JSON.stringify({ business_type: data.businessType }),
        })

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
        })

        await fetch(`${API}/api/onboarding/step3`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            ...getBusinessHeaders(),
          },
          body: JSON.stringify({
            services: data.services,
            faqs: data.faqs,
            reply_style: data.replyStyle,
          }),
        })
      }

      if (stepNumber === 2 || stepNumber === 3) {
        if (data.connectedChannel) {
          await fetch(`${API}/api/onboarding/step4`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
              ...getBusinessHeaders(),
            },
            body: JSON.stringify({ connected_channel: data.connectedChannel }),
          })
        }
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
        setDirection(1)
        setStep((s) => s + 1)
        window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' })
      } else {
        await handleFinish()
      }
    } catch (e) {
      setError(isRTL ? 'تعذر حفظ تقدم الإعداد.' : 'Could not save progress.')
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setDirection(-1)
      setStep((s) => s - 1)
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' })
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
      })
      router.replace('/dashboard')
    } catch (e) {
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
      })
      router.replace('/dashboard')
    } catch (e) {
      router.replace('/dashboard')
    } finally {
      setSaving(false)
    }
  }

  // Trigger channel connection
  const handleConnectChannel = async (channelId: string) => {
    setConnectingChannel(channelId)
    const token = getToken()

    if (channelId === 'whatsapp') {
      setShowWhatsAppModal(true)
      setConnectingChannel(null)
    } else if (channelId === 'shopify') {
      setShowShopifyModal(true)
      setConnectingChannel(null)
    } else if (channelId === 'woocommerce') {
      setShowWooCommercePanel(true)
      setConnectingChannel(null)
    } else if (channelId === 'salla' || channelId === 'facebook' || channelId === 'instagram') {
      try {
        const endpoint = channelId === 'salla' ? 'salla' : 'facebook'
        const res = await fetch(`${API}/api/channels/connect/${endpoint}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...getBusinessHeaders(),
          },
          body: JSON.stringify({ return_to: 'onboarding' }),
        })
        const json = await res.json()
        if (json.url) window.location.assign(json.url)
      } catch (err) {
        setError(isRTL ? 'تعذر بدء الربط.' : 'Could not start connection.')
      } finally {
        setConnectingChannel(null)
      }
    } else if (channelId === 'gmail') {
      try {
        const res = await fetch(`${API}/api/channels/connect/gmail?return_to=onboarding`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            ...getBusinessHeaders(),
          },
        })
        const json = await res.json()
        if (json.url) window.location.assign(json.url)
      } catch (err) {
        setError(isRTL ? 'تعذر ربط بريد Gmail.' : 'Could not connect Gmail.')
      } finally {
        setConnectingChannel(null)
      }
    } else {
      setConnectingChannel(null)
    }
  }

  // Test Assistant Simulator Chat Message Handler
  const handleSendTestMessage = (customText?: string) => {
    const textToSend = customText || testInput
    if (!textToSend.trim()) return

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMsg = { sender: 'user' as const, text: textToSend, time: now }

    setTestMessages((prev) => [...prev, userMsg])
    if (!customText) setTestInput('')
    setIsBotTyping(true)

    // Simulate intelligent bot thinking and replying based on configured parameters
    setTimeout(() => {
      let botReply = ''
      const lower = textToSend.toLowerCase()

      if (
        lower.includes('مواعيد') ||
        lower.includes('دوام') ||
        lower.includes('ساعات') ||
        lower.includes('hours') ||
        lower.includes('time') ||
        lower.includes('open')
      ) {
        botReply = isRTL
          ? `أهلاً بك! ساعات عمل ${data.businessName || 'متجرنا'} هي من ${data.workingFrom} إلى ${data.workingTo} طوال أيام ${data.workingDays.map(d => DAYS.find(x => x.id === d)?.ar).join('، ')} 🕒 نسعد دائماً بخدمتكم!`
          : `Hello! Our operating hours are from ${data.workingFrom} to ${data.workingTo} on ${data.workingDays.map(d => DAYS.find(x => x.id === d)?.en).join(', ')}. How can we assist you today?`
      } else if (
        lower.includes('مكان') ||
        lower.includes('موقع') ||
        lower.includes('عنوان') ||
        lower.includes('location') ||
        lower.includes('address') ||
        lower.includes('where')
      ) {
        botReply = isRTL
          ? `موقعنا في ${data.city || 'الرياض'}، ${data.country || 'المملكة العربية السعودية'} 📍 والتوصيل متاح مباشرة إلى باب منزلك!`
          : `We are based in ${data.city || 'Riyadh'}, ${data.country || 'Saudi Arabia'} 📍 with fast direct delivery to your doorstep!`
      } else if (
        lower.includes('منتج') ||
        lower.includes('خدمات') ||
        lower.includes('سعر') ||
        lower.includes('عرض') ||
        lower.includes('price') ||
        lower.includes('service') ||
        lower.includes('product')
      ) {
        botReply = isRTL
          ? `يسعدنا استفسارك! أبرز ما نقدمه في ${data.businessName || 'نشاطنا'}: ${data.services || 'أحدث المنتجات والخدمات الحصرية بأعلى معايير الجودة'} 🛍️ هل ترغب في الاطلاع على الكتالوج أو إتمام الطلب؟`
          : `Thank you for asking! We specialize in: ${data.services || 'high-quality products and bespoke customer services'} 🛍️ Would you like to view our full catalog or place an order?`
      } else {
        // Match FAQ or standard tone response
        const matchedFaq = data.faqs.find(
          (f) => f.question && textToSend.includes(f.question.slice(0, 10))
        )
        if (matchedFaq && matchedFaq.answer) {
          botReply = matchedFaq.answer
        } else {
          botReply = isRTL
            ? `شكراً لتواصلك مع ${data.businessName || 'نذير بزنس'}! تم استلام رسالتك وسأقوم بمساعدتك بكل سرور وفقاً لنظام خدماتنا المعتمد. هل ترغب في التحدث مع أحد موظفينا أو الاستفسار عن الطلبات؟ ✨`
            : `Thank you for reaching out to ${data.businessName || 'NazBiz'}! I have received your request and am happy to assist you with our verified business data. Would you like me to connect you with support or assist with an order? ✨`
        }
      }

      setTestMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: botReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          orderLink: lower.includes('طلب') || lower.includes('شراء') || lower.includes('order'),
        },
      ])
      setIsBotTyping(false)
    }, 750)
  }

  if (loading) return <BrandLoading label={isRTL ? 'جارٍ تحميل معالج الإعداد...' : 'Preparing Onboarding Journey...'} />

  const stepLabels = [
    { num: 1, titleAr: 'مرحباً بك', titleEn: 'Welcome' },
    { num: 2, titleAr: 'قنوات المراسلة', titleEn: 'Channels' },
    { num: 3, titleAr: 'ربط المتجر', titleEn: 'Store Sync' },
    { num: 4, titleAr: 'مساعد الذكاء الاصطناعي', titleEn: 'AI Brain' },
    { num: 5, titleAr: 'تجربة المساعد', titleEn: 'Live Test' },
    { num: 6, titleAr: 'تفعيل الأتمتة', titleEn: 'Automations' },
    { num: 7, titleAr: 'جاهز للانطلاق', titleEn: 'Ready' },
  ]

  const progressPercent = Math.round((step / totalSteps) * 100)

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="relative min-h-screen overflow-x-hidden transition-colors duration-300"
      style={{ background: 'var(--background)' }}
    >
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 60% 50% at 85% 15%, rgba(0, 217, 255, 0.05), transparent 70%),
            radial-gradient(ellipse 50% 60% at 15% 85%, rgba(113, 60, 255, 0.06), transparent 70%)
          `,
        }}
      />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-surface-elevated/80 px-4 py-3 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandWordmark width="75px" priority />
            <div className="hidden items-center gap-2 rounded-full border border-border bg-surface-secondary px-3 py-1 text-xs font-bold text-text-secondary sm:flex">
              <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
              <span>{isRTL ? 'إعداد مساحة العمل' : 'Workspace Setup'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Progress pill */}
            <div className="flex items-center gap-2 rounded-full border border-border bg-surface-secondary px-3 py-1 text-xs font-black">
              <span className="text-brand">{progressPercent}%</span>
              <span className="text-text-tertiary">
                {isRTL ? `خطوة ${step} من ${totalSteps}` : `Step ${step} of ${totalSteps}`}
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface-secondary p-1">
              <LanguageToggle />
              <div className="h-4 w-[1px] bg-border" />
              <DarkModeToggle />
            </div>

            {step < totalSteps && (
              <button
                type="button"
                onClick={handleSkip}
                className="hidden text-xs font-semibold text-text-tertiary transition-colors hover:text-text-primary sm:block"
              >
                {isRTL ? 'تخطي الإعداد' : 'Skip setup'}
              </button>
            )}
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-border/50">
          <motion.div
            className="h-full bg-gradient-to-r from-brand via-brand-violet to-brand-cyan"
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </header>

      {/* Main Container */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Left Steps Navigation Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-3xl border border-border bg-surface-elevated/70 p-6 shadow-sm backdrop-blur-md">
              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-text-tertiary">
                {isRTL ? 'خطوات التفعيل' : 'Setup Roadmap'}
              </p>
              <div className="space-y-2">
                {stepLabels.map((s) => {
                  const isCurrent = step === s.num
                  const isDone = step > s.num
                  return (
                    <button
                      key={s.num}
                      type="button"
                      disabled={s.num > step}
                      onClick={() => {
                        if (s.num < step) {
                          setDirection(-1)
                          setStep(s.num)
                        }
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl p-3 text-start transition-all ${
                        isCurrent
                          ? 'border border-brand/30 bg-brand/10 font-bold text-brand shadow-sm'
                          : isDone
                          ? 'text-text-primary hover:bg-surface-secondary cursor-pointer'
                          : 'text-text-tertiary opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black transition-colors ${
                          isDone
                            ? 'bg-success text-white'
                            : isCurrent
                            ? 'bg-brand text-white shadow-md'
                            : 'border border-border bg-surface-secondary'
                        }`}
                      >
                        {isDone ? <Check size={14} /> : `0${s.num}`}
                      </span>
                      <span className="text-xs font-bold">
                        {isRTL ? s.titleAr : s.titleEn}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Verified Security Notice */}
              <div className="mt-8 border-t border-border pt-4">
                <div className="flex items-center gap-2 text-[11px] text-text-tertiary">
                  <ShieldCheck size={14} className="text-brand" />
                  <span>{isRTL ? 'إعداد مشفر وآمن بالكامل' : '100% Encrypted & Safe'}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Main Step Card */}
          <main className="min-w-0">
            <div className="rounded-3xl border border-border bg-surface-elevated/95 p-6 shadow-xl backdrop-blur-xl sm:p-10">
              <AnimatePresence mode="wait">
                {/* ════════════════════════════════════════════════════════════
                    STEP 1: WELCOME & OVERVIEW
                ════════════════════════════════════════════════════════════ */}
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    className="space-y-8"
                  >
                    <div>
                      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3.5 py-1 text-xs font-bold text-brand">
                        <Sparkles size={14} />
                        <span>{isRTL ? 'الخطوة الأولى • مرحباً بك' : 'Step 1 • Welcome to Naz Autoreply'}</span>
                      </div>
                      <h1 className="text-3xl font-black tracking-tight text-text-primary sm:text-4xl">
                        {isRTL
                          ? 'أهلاً بك! دعنا نفعّل موظف الذكاء الاصطناعي لمتجرك 🚀'
                          : "Let's activate your 24/7 AI Sales Assistant 🚀"}
                      </h1>
                      <p className="mt-3 text-sm leading-relaxed text-text-secondary sm:text-base">
                        {isRTL
                          ? 'خلال 3 دقائق فقط، سنقوم بربط قنواتك وتدريب مساعدك الذكي على منتجاتك، ليقوم بالرد التلقائي وإتمام المبيعات على مدار الساعة.'
                          : 'In under 3 minutes, we will connect your channels, train your AI on your catalog, and launch automated 24/7 sales.'}
                      </p>
                    </div>

                    {/* Business Type Selector */}
                    <div>
                      <label className="mb-3 block text-sm font-bold text-text-primary">
                        {isRTL ? 'ما هو نوع نشاطك التجاري؟' : 'What is your business type?'}
                      </label>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {BUSINESS_TYPES.map((type) => {
                          const isSelected = data.businessType === type.id
                          return (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => setData({ ...data, businessType: type.id })}
                              className={`flex flex-col items-center gap-2.5 rounded-2xl p-4 text-center transition-all ${
                                isSelected
                                  ? 'border-2 border-brand bg-brand/5 shadow-md ring-1 ring-brand'
                                  : 'border border-border bg-surface-secondary/50 hover:border-brand/40 hover:bg-surface-elevated'
                              }`}
                            >
                              <span className="text-3xl">{type.icon}</span>
                              <span
                                className={`text-xs font-bold ${
                                  isSelected ? 'text-brand' : 'text-text-primary'
                                }`}
                              >
                                {isRTL ? type.ar : type.en}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* What you will accomplish cards */}
                    <div className="rounded-2xl border border-border bg-surface-secondary/50 p-5">
                      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-text-tertiary">
                        {isRTL ? 'ما الذي ستنجزه خلال هذا المعالج:' : "What you'll accomplish during setup:"}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="flex items-start gap-2.5">
                          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" />
                          <div className="text-xs">
                            <strong className="block text-text-primary">
                              {isRTL ? 'ربط القنوات والمتاجر' : 'Channel & Store Sync'}
                            </strong>
                            <span className="text-text-secondary">WhatsApp, Salla, Instagram</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand" />
                          <div className="text-xs">
                            <strong className="block text-text-primary">
                              {isRTL ? 'تدريب عقل الذكاء' : 'AI Business Brain'}
                            </strong>
                            <span className="text-text-secondary">
                              {isRTL ? 'أسعارك، كتالوجك، والأسئلة' : 'Catalog, hours, and FAQ'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-violet" />
                          <div className="text-xs">
                            <strong className="block text-text-primary">
                              {isRTL ? 'تجربة حية تفاعلية' : 'Live Interactive Test'}
                            </strong>
                            <span className="text-text-secondary">
                              {isRTL ? 'اختبر الرد قبل الانطلاق' : 'Verify bot replies instantly'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ════════════════════════════════════════════════════════════
                    STEP 2: CONNECT MESSAGING CHANNELS
                ════════════════════════════════════════════════════════════ */}
                {step === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    className="space-y-6"
                  >
                    <div>
                      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3.5 py-1 text-xs font-bold text-brand">
                        <Radio size={14} />
                        <span>{isRTL ? 'الخطوة 2 • قنوات المراسلة' : 'Step 2 • Messaging Channels'}</span>
                      </div>
                      <h2 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl">
                        {isRTL ? 'اربط قنوات التواصل مع عملائك 💬' : 'Connect Customer Channels 💬'}
                      </h2>
                      <p className="mt-2 text-xs text-text-secondary sm:text-sm">
                        {isRTL
                          ? 'اربط واتساب، انستقرام أو فيسبوك ليقوم المساعد الذكي بالرد الفوري على كل محادثة جديدة.'
                          : 'Connect your channels so your AI assistant can auto-reply to new messages and comments.'}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {MESSAGING_CHANNELS.map((ch) => {
                        const isConnected = connectedChannels.includes(ch.id)
                        const isConnecting = connectingChannel === ch.id
                        return (
                          <div
                            key={ch.id}
                            className={`flex flex-col gap-4 rounded-2xl border p-4 transition-all sm:flex-row sm:items-center sm:justify-between ${
                              isConnected
                                ? 'border-success/40 bg-success/5 shadow-sm'
                                : 'border-border bg-surface-secondary/40 hover:border-brand/40'
                            }`}
                          >
                            <div className="flex items-start gap-3.5">
                              <div
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl p-2.5 shadow-sm"
                                style={{ background: `${ch.color}15`, border: `1px solid ${ch.color}30` }}
                              >
                                <Image
                                  src={ch.icon}
                                  alt={ch.label}
                                  width={22}
                                  height={22}
                                  className="h-5 w-5 object-contain"
                                />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-bold text-text-primary">{ch.label}</h3>
                                  {isConnected && (
                                    <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-bold text-success">
                                      ✓ {isRTL ? 'متصل ونشط' : 'Connected'}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-text-secondary">
                                  {isRTL ? ch.descAr : ch.descEn}
                                </p>
                              </div>
                            </div>

                            <div className="shrink-0">
                              {isConnected ? (
                                <div className="inline-flex items-center gap-1.5 rounded-xl border border-success/30 bg-success/10 px-4 py-2 text-xs font-bold text-success">
                                  <Check size={14} />
                                  <span>{isRTL ? 'تم الربط' : 'Linked'}</span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleConnectChannel(ch.id)}
                                  disabled={isConnecting}
                                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-elevated px-4 py-2.5 text-xs font-bold text-text-primary shadow-sm transition-all hover:border-brand hover:bg-brand hover:text-white disabled:opacity-50 sm:w-auto"
                                >
                                  {isConnecting ? (
                                    <span>{isRTL ? 'جاري الاتصال...' : 'Connecting...'}</span>
                                  ) : (
                                    <>
                                      <span>{isRTL ? ch.actionLabelAr : ch.actionLabelEn}</span>
                                      <ExternalLink size={13} />
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="rounded-xl border border-brand/20 bg-brand/5 p-4 text-xs text-brand">
                      💡 {isRTL
                        ? 'نصيحة: يمكنك البدء بربط واتساب الآن، وإضافة بقية القنوات في أي وقت لاحقاً من لوحة التحكم.'
                        : 'Tip: You can connect WhatsApp now and link additional channels anytime from your dashboard.'}
                    </div>
                  </motion.div>
                )}

                {/* ════════════════════════════════════════════════════════════
                    STEP 3: CONNECT STORE & E-COMMERCE
                ════════════════════════════════════════════════════════════ */}
                {step === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    className="space-y-6"
                  >
                    <div>
                      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3.5 py-1 text-xs font-bold text-brand">
                        <ShoppingBag size={14} />
                        <span>{isRTL ? 'الخطوة 3 • ربط المتجر الإلكتروني' : 'Step 3 • Connect Your Store'}</span>
                      </div>
                      <h2 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl">
                        {isRTL ? 'اربط متجرك لمزامنة المنتجات والطلبات 🛒' : 'Link Your Store for Live Catalog 🛒'}
                      </h2>
                      <p className="mt-2 text-xs text-text-secondary sm:text-sm">
                        {isRTL
                          ? 'ربط متجرك يمكّن المساعد من معرفة أسعار منتجاتك، تفاصيل المخزون، وتتبع طلبات العملاء فورياً.'
                          : 'Connecting your store allows AI to know exact prices, inventory levels, and order tracking.'}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {STORE_CHANNELS.map((store) => {
                        const isConnected = connectedChannels.includes(store.id)
                        const isConnecting = connectingChannel === store.id
                        return (
                          <div
                            key={store.id}
                            className={`flex flex-col gap-4 rounded-2xl border p-4 transition-all sm:flex-row sm:items-center sm:justify-between ${
                              isConnected
                                ? 'border-success/40 bg-success/5 shadow-sm'
                                : 'border-border bg-surface-secondary/40 hover:border-brand/40'
                            }`}
                          >
                            <div className="flex items-start gap-3.5">
                              <div
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl p-2.5 shadow-sm"
                                style={{ background: `${store.color}15`, border: `1px solid ${store.color}30` }}
                              >
                                <Image
                                  src={store.icon}
                                  alt={store.label}
                                  width={22}
                                  height={22}
                                  className="h-5 w-5 object-contain"
                                />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-bold text-text-primary">{store.label}</h3>
                                  {isConnected && (
                                    <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-bold text-success">
                                      ✓ {isRTL ? 'مربوط' : 'Connected'}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-text-secondary">
                                  {isRTL ? store.descAr : store.descEn}
                                </p>
                              </div>
                            </div>

                            <div className="shrink-0">
                              {isConnected ? (
                                <div className="inline-flex items-center gap-1.5 rounded-xl border border-success/30 bg-success/10 px-4 py-2 text-xs font-bold text-success">
                                  <Check size={14} />
                                  <span>{isRTL ? 'تم الربط' : 'Linked'}</span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleConnectChannel(store.id)}
                                  disabled={isConnecting}
                                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-elevated px-4 py-2.5 text-xs font-bold text-text-primary shadow-sm transition-all hover:border-brand hover:bg-brand hover:text-white sm:w-auto"
                                >
                                  <span>{isRTL ? 'ربط المتجر الآن' : 'Connect Store'}</span>
                                  <ExternalLink size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="rounded-xl border border-border bg-surface-secondary/60 p-4 text-xs text-text-secondary">
                      ℹ️ {isRTL
                        ? 'إذا لم يكن لديك متجر إلكتروني مدعوم، يمكنك تخطي هذه الخطوة وإدخال خدماتك ومنتجاتك يدوياً في الخطوة القادمة.'
                        : 'If you do not run an online store, you can skip this step and enter your products/services manually in the next step.'}
                    </div>
                  </motion.div>
                )}

                {/* ════════════════════════════════════════════════════════════
                    STEP 4: AI BRAIN & KNOWLEDGE CONFIGURATION
                ════════════════════════════════════════════════════════════ */}
                {step === 4 && (
                  <motion.div
                    key="step-4"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    className="space-y-6"
                  >
                    <div>
                      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3.5 py-1 text-xs font-bold text-brand">
                        <Bot size={14} />
                        <span>{isRTL ? 'الخطوة 4 • عقل الذكاء والمعرفة' : 'Step 4 • Train Your AI Brain'}</span>
                      </div>
                      <h2 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl">
                        {isRTL ? 'إعداد شخصية المساعد وقاعدة المعرفة 🧠' : 'AI Personality & Knowledge Base 🧠'}
                      </h2>
                      <p className="mt-2 text-xs text-text-secondary sm:text-sm">
                        {isRTL
                          ? 'حدد اسم نشاطك، أسلوب الرد، وساعات العمل ليعتمد عليها الذكاء الاصطناعي في إجاباته.'
                          : 'Set business name, hours, reply tone, and catalog so the assistant represents you accurately.'}
                      </p>
                    </div>

                    {/* Business Name and Phone */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-text-secondary">
                          {isRTL ? 'اسم النشاط التجاري *' : 'Business Name *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={data.businessName}
                          onChange={(e) => setData({ ...data, businessName: e.target.value })}
                          placeholder={isRTL ? 'مثال: متجر أصالة' : 'e.g. Asala Boutique'}
                          className="w-full rounded-xl border border-border bg-surface-secondary/50 px-4 py-3 text-sm font-medium outline-none focus:border-brand focus:bg-surface-elevated focus:ring-2 focus:ring-brand/20"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-text-secondary">
                          {isRTL ? 'رقم الهاتف المعتمد' : 'Support Phone Number'}
                        </label>
                        <input
                          type="tel"
                          value={data.phone}
                          onChange={(e) => setData({ ...data, phone: e.target.value })}
                          placeholder="+966 5x xxx xxxx"
                          className="w-full rounded-xl border border-border bg-surface-secondary/50 px-4 py-3 text-sm font-medium outline-none focus:border-brand focus:bg-surface-elevated focus:ring-2 focus:ring-brand/20"
                        />
                      </div>
                    </div>

                    {/* Country, City, Currency */}
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Select
                          label={isRTL ? 'الدولة' : 'Country'}
                          value={data.country}
                          onChange={(e) => {
                            const c = e.target.value
                            const defaults = REGIONAL_DEFAULTS[c] || { currency: 'SAR', timezone: 'Asia/Riyadh' }
                            setData({ ...data, country: c, currency: defaults.currency, timezone: defaults.timezone })
                          }}
                          options={COUNTRIES.map((c) => ({ value: c, label: c }))}
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
                          placeholder={isRTL ? 'الرياض' : 'Riyadh'}
                          className="w-full rounded-xl border border-border bg-surface-secondary/50 px-4 py-3 text-sm font-medium outline-none focus:border-brand focus:bg-surface-elevated focus:ring-2 focus:ring-brand/20"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Select
                          label={isRTL ? 'العملة' : 'Currency'}
                          value={data.currency}
                          onChange={(e) => setData({ ...data, currency: e.target.value })}
                          options={['SAR', 'AED', 'KWD', 'QAR', 'BHD', 'OMR', 'EGP', 'USD', 'EUR', 'GBP'].map((code) => ({
                            value: code,
                            label: code,
                          }))}
                        />
                      </div>
                    </div>

                    {/* Working Days */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-text-secondary">
                        {isRTL ? 'أيام العمل' : 'Operating Days'}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {DAYS.map((d) => {
                          const isSelected = data.workingDays.includes(d.id)
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => {
                                const newDays = isSelected
                                  ? data.workingDays.filter((x) => x !== d.id)
                                  : [...data.workingDays, d.id]
                                setData({ ...data, workingDays: newDays })
                              }}
                              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                isSelected
                                  ? 'border border-brand bg-brand text-brand-text shadow-sm'
                                  : 'border border-border bg-surface-secondary text-text-secondary hover:text-text-primary'
                              }`}
                            >
                              {isRTL ? d.ar : d.en}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Working Hours */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-text-secondary">
                          {isRTL ? 'من الساعة' : 'From'}
                        </label>
                        <input
                          type="time"
                          value={data.workingFrom}
                          onChange={(e) => setData({ ...data, workingFrom: e.target.value })}
                          className="w-full rounded-xl border border-border bg-surface-secondary/50 px-4 py-2.5 text-sm font-medium outline-none focus:border-brand"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-text-secondary">
                          {isRTL ? 'إلى الساعة' : 'To'}
                        </label>
                        <input
                          type="time"
                          value={data.workingTo}
                          onChange={(e) => setData({ ...data, workingTo: e.target.value })}
                          className="w-full rounded-xl border border-border bg-surface-secondary/50 px-4 py-2.5 text-sm font-medium outline-none focus:border-brand"
                        />
                      </div>
                    </div>

                    {/* Reply Tone Style */}
                    <div className="space-y-2.5">
                      <label className="block text-xs font-bold text-text-secondary">
                        {isRTL ? 'نبرة وأسلوب الرد المطلوب' : 'AI Assistant Reply Personality'}
                      </label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {REPLY_STYLES.map((style) => {
                          const isSelected = data.replyStyle === style.id
                          return (
                            <button
                              key={style.id}
                              type="button"
                              onClick={() => setData({ ...data, replyStyle: style.id })}
                              className={`rounded-2xl border p-3.5 text-start transition-all ${
                                isSelected
                                  ? 'border-brand bg-brand/5 shadow-sm ring-1 ring-brand'
                                  : 'border-border bg-surface-secondary/40 hover:border-brand/40'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">{style.icon}</span>
                                  <span className="text-xs font-bold text-text-primary">
                                    {isRTL ? style.ar : style.en}
                                  </span>
                                </div>
                                {isSelected && <Check size={16} className="text-brand" />}
                              </div>
                              <p className="mt-1 text-[11px] text-text-secondary">
                                {isRTL ? style.descAr : style.descEn}
                              </p>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Products and Services Catalog */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-text-secondary">
                        {isRTL ? 'قائمة المنتجات أو الخدمات والأسعار' : 'Products & Services Catalogue'}
                      </label>
                      <textarea
                        rows={3}
                        value={data.services}
                        onChange={(e) => setData({ ...data, services: e.target.value })}
                        placeholder={
                          isRTL
                            ? 'اكتب هنا أبرز منتجاتك، أسعارها، أو الخدمات التي تقدمها (مثال: قهوة V60 بسعر 18 ر.س، استشارة قانونية 300 ر.س، شحن مجاني فوق 150 ر.س)'
                            : 'List your core offerings, key prices, and delivery terms here...'
                        }
                        className="w-full rounded-xl border border-border bg-surface-secondary/50 p-3.5 text-sm font-medium outline-none focus:border-brand focus:bg-surface-elevated focus:ring-2 focus:ring-brand/20"
                      />
                    </div>

                    {/* FAQs Builder */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-text-secondary">
                          {isRTL ? 'الأسئلة الشائعة وإجاباتها' : 'Frequently Asked Questions (FAQ)'}
                        </label>
                        <button
                          type="button"
                          onClick={() => setData({ ...data, faqs: [...data.faqs, { question: '', answer: '' }] })}
                          className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
                        >
                          <Plus size={14} />
                          <span>{isRTL ? 'إضافة سؤال جديد' : 'Add FAQ'}</span>
                        </button>
                      </div>

                      {data.faqs.map((faq, index) => (
                        <div
                          key={index}
                          className="relative space-y-2 rounded-2xl border border-border bg-surface-secondary/40 p-3.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-text-tertiary">
                              {isRTL ? `سؤال #${index + 1}` : `FAQ #${index + 1}`}
                            </span>
                            {data.faqs.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setData({ ...data, faqs: data.faqs.filter((_, i) => i !== index) })}
                                className="text-text-tertiary hover:text-error"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={faq.question}
                            onChange={(e) => {
                              const newFaqs = [...data.faqs]
                              newFaqs[index].question = e.target.value
                              setData({ ...data, faqs: newFaqs })
                            }}
                            placeholder={isRTL ? 'السؤال المتكرر...' : 'Customer question...'}
                            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs font-medium outline-none focus:border-brand"
                          />
                          <input
                            type="text"
                            value={faq.answer}
                            onChange={(e) => {
                              const newFaqs = [...data.faqs]
                              newFaqs[index].answer = e.target.value
                              setData({ ...data, faqs: newFaqs })
                            }}
                            placeholder={isRTL ? 'الإجابة المعتمدة...' : 'Verified answer...'}
                            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs font-medium outline-none focus:border-brand"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Knowledge File Upload */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-text-secondary">
                        {isRTL ? 'رفع ملف معرفة أو كتالوج (PDF أو Excel)' : 'Upload Knowledge Document (PDF / Excel)'}
                      </label>
                      <div className="rounded-2xl border-2 border-dashed border-border bg-surface-secondary/30 p-6 text-center">
                        <input
                          type="file"
                          id="onboarding-doc"
                          accept=".pdf,.xlsx,.xls"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            if (file.size > 15 * 1024 * 1024) {
                              setUploadState({
                                busy: false,
                                message: isRTL ? 'حجم الملف يتجاوز 15MB.' : 'File exceeds 15MB limit.',
                                error: true,
                              })
                              return
                            }
                            setUploadState({ busy: true, message: '', error: false })
                            const token = getToken()
                            const fd = new FormData()
                            fd.append('file', file)

                            try {
                              const res = await fetch(`${API}/api/onboarding/upload-knowledge`, {
                                method: 'POST',
                                headers: {
                                  Authorization: `Bearer ${token}`,
                                  Accept: 'application/json',
                                  ...getBusinessHeaders(),
                                },
                                body: fd,
                              })
                              const json = await res.json()
                              if (!res.ok) throw new Error(json.message || 'Upload failed')
                              setUploadState({
                                busy: false,
                                message: isRTL ? 'تم رفع الملف بنجاح وتدريب الذكاء الاصطناعي عليه!' : 'File uploaded and parsed into knowledge base!',
                                error: false,
                              })
                            } catch (cause) {
                              setUploadState({
                                busy: false,
                                message: isRTL ? 'تعذر رفع الملف، يرجى المحاولة لاحقاً.' : 'Upload failed. Please try again.',
                                error: true,
                              })
                            }
                          }}
                        />
                        <label htmlFor="onboarding-doc" className="cursor-pointer">
                          <Upload size={28} className="mx-auto mb-2 text-text-tertiary" />
                          <div className="text-xs font-bold text-text-primary">
                            {uploadState.busy
                              ? (isRTL ? 'جارٍ تحليل الملف وتدريب الذكاء...' : 'Parsing document...')
                              : (isRTL ? 'اضغط لاختيار ملف PDF أو Excel' : 'Click to select a PDF or Excel document')}
                          </div>
                          <div className="mt-1 text-[11px] text-text-tertiary">
                            {isRTL ? 'الحد الأقصى 15 ميجابايت' : 'Maximum file size 15MB'}
                          </div>
                        </label>
                        {uploadState.message && (
                          <p
                            className={`mt-2 text-xs font-medium ${
                              uploadState.error ? 'text-error' : 'text-success'
                            }`}
                          >
                            {uploadState.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ════════════════════════════════════════════════════════════
                    STEP 5: INTERACTIVE LIVE TEST LAB (SIMULATED CHAT)
                ════════════════════════════════════════════════════════════ */}
                {step === 5 && (
                  <motion.div
                    key="step-5"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    className="space-y-6"
                  >
                    <div>
                      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3.5 py-1 text-xs font-bold text-brand">
                        <Play size={14} />
                        <span>{isRTL ? 'الخطوة 5 • التجربة الحية' : 'Step 5 • Interactive Test Lab'}</span>
                      </div>
                      <h2 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl">
                        {isRTL ? 'جرّب موظفك الذكي الآن مباشرة 💬' : 'Test Your AI Assistant Live 💬'}
                      </h2>
                      <p className="mt-2 text-xs text-text-secondary sm:text-sm">
                        {isRTL
                          ? 'اختبر كيف سيرد مساعدك على استفسارات العملاء بناءً على بيانات متجرك وأسلوب الرد الذي اخترته.'
                          : 'See how your assistant will respond to customer questions based on the business rules and tone you configured.'}
                      </p>
                    </div>

                    {/* Chat Simulator Sandbox */}
                    <div className="mx-auto max-w-xl overflow-hidden rounded-3xl border border-border bg-surface-secondary/70 shadow-2xl">
                      {/* Chat Header */}
                      <div className="flex items-center justify-between border-b border-border bg-surface-elevated px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white shadow-sm">
                            <Bot size={18} />
                            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface-elevated bg-success" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-text-primary">
                              {data.businessName || (isRTL ? 'مساعد نذير الذكي' : 'Naz AI Assistant')}
                            </div>
                            <div className="text-[10px] text-success">
                              {isRTL ? 'متصل الآن • رد آلي فوري' : 'Online • Instant Autonomous Replies'}
                            </div>
                          </div>
                        </div>
                        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">
                          {data.replyStyle.toUpperCase()}
                        </span>
                      </div>

                      {/* Chat message list */}
                      <div
                        ref={chatScrollRef}
                        className="h-80 space-y-3 overflow-y-auto p-4 text-xs"
                        style={{
                          backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
                          backgroundSize: '24px 24px',
                        }}
                      >
                        {testMessages.map((msg, i) => (
                          <div
                            key={i}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed shadow-sm ${
                                msg.sender === 'user'
                                  ? 'rounded-tr-xs bg-brand text-white'
                                  : 'rounded-tl-xs border border-border bg-surface-elevated text-text-primary'
                              }`}
                            >
                              <p className="font-medium">{msg.text}</p>
                              {msg.orderLink && (
                                <div className="mt-2 rounded-xl border border-brand/20 bg-brand/5 p-2 text-[11px] font-bold text-brand">
                                  🔗 {isRTL ? 'رابط الدفع المباشر: nazbiz.io/pay/order-104' : 'Checkout link attached'}
                                </div>
                              )}
                              <span
                                className={`mt-1 block text-end text-[9px] ${
                                  msg.sender === 'user' ? 'text-white/70' : 'text-text-tertiary'
                                }`}
                              >
                                {msg.time}
                              </span>
                            </div>
                          </div>
                        ))}

                        {isBotTyping && (
                          <div className="flex justify-start">
                            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-xs border border-border bg-surface-elevated px-4 py-2 text-xs text-text-tertiary">
                              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce" />
                              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce [animation-delay:0.2s]" />
                              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce [animation-delay:0.4s]" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Quick prompt test chips */}
                      <div className="border-t border-border bg-surface-elevated/60 p-2.5">
                        <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                          {isRTL ? 'جرّب الضغط على أحد الأسئلة السريعة:' : 'Click a quick question to test:'}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            isRTL ? 'ما هي مواعيد العمل لديكم؟' : 'What are your business hours?',
                            isRTL ? 'ما هي المنتجات أو الخدمات المتوفرة؟' : 'What products do you offer?',
                            isRTL ? 'أين يقع متجركم؟' : 'Where is your location?',
                          ].map((q, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSendTestMessage(q)}
                              className="rounded-full border border-border bg-surface-elevated px-2.5 py-1 text-[11px] font-medium text-text-secondary transition-colors hover:border-brand hover:text-brand"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Chat Input */}
                      <div className="flex items-center gap-2 border-t border-border bg-surface-elevated p-3">
                        <input
                          type="text"
                          value={testInput}
                          onChange={(e) => setTestInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSendTestMessage()
                          }}
                          placeholder={isRTL ? 'اكتب سؤالك هنا للاختبار...' : 'Type a test message here...'}
                          className="flex-1 rounded-xl border border-border bg-surface-secondary/50 px-3.5 py-2 text-xs outline-none focus:border-brand focus:bg-surface-elevated"
                        />
                        <button
                          type="button"
                          onClick={() => handleSendTestMessage()}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-sm transition-transform hover:scale-105"
                        >
                          <Send size={15} className={isRTL ? 'rotate-180' : ''} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ════════════════════════════════════════════════════════════
                    STEP 6: WORKFLOWS & AUTOMATIONS
                ════════════════════════════════════════════════════════════ */}
                {step === 6 && (
                  <motion.div
                    key="step-6"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    className="space-y-6"
                  >
                    <div>
                      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3.5 py-1 text-xs font-bold text-brand">
                        <Workflow size={14} />
                        <span>{isRTL ? 'الخطوة 6 • محرك الأتمتة' : 'Step 6 • Workflows & Automations'}</span>
                      </div>
                      <h2 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl">
                        {isRTL ? 'مسارات العمل والمتابعة الذكية ⚡' : 'Automated Workflows & Sequences ⚡'}
                      </h2>
                      <p className="mt-2 text-xs text-text-secondary sm:text-sm">
                        {isRTL
                          ? 'مسارات العمل تقوم بتنفيذ الإجراءات تلقائياً (مثل إرسال العروض، تأكيد الطلب، أو تحويل العميل للموظف البشري).'
                          : 'Workflows autonomously handle triggers like new orders, lead capture, and team handoffs.'}
                      </p>
                    </div>

                    {/* Pre-built Automation Cards */}
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-brand/30 bg-brand/5 p-4 shadow-sm">
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
                          <Zap size={18} />
                        </div>
                        <h3 className="text-xs font-bold text-text-primary">
                          {isRTL ? 'الرد الفوري على مدار الساعة' : '24/7 Instant Auto-Reply'}
                        </h3>
                        <p className="mt-1 text-[11px] text-text-secondary">
                          {isRTL
                            ? 'الرد على كل رسالة واردة خلال 8 ثوانٍ بمجرد وصولها وتأهيل العميل.'
                            : 'Respond to every incoming inquiry in under 8 seconds autonomously.'}
                        </p>
                        <div className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-success">
                          <Check size={12} />
                          <span>{isRTL ? 'مفعل تلقائياً' : 'Enabled by default'}</span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border bg-surface-secondary/40 p-4">
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-violet text-white shadow-sm">
                          <Clock size={18} />
                        </div>
                        <h3 className="text-xs font-bold text-text-primary">
                          {isRTL ? 'وضع بعد ساعات العمل' : 'Out-of-Hours Responder'}
                        </h3>
                        <p className="mt-1 text-[11px] text-text-secondary">
                          {isRTL
                            ? 'إشعار العميل بمواعيد العمل الرسمية مع حفظ سؤاله للإجابة الفورية.'
                            : 'Let customers know hours while capturing their contact details.'}
                        </p>
                        <div className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-brand">
                          <span>{isRTL ? 'جاهز للتخصيص' : 'Ready to customize'}</span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border bg-surface-secondary/40 p-4">
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-cyan text-white shadow-sm">
                          <ShoppingBag size={18} />
                        </div>
                        <h3 className="text-xs font-bold text-text-primary">
                          {isRTL ? 'متابعة السلات المتروكة' : 'Abandoned Cart Sequence'}
                        </h3>
                        <p className="mt-1 text-[11px] text-text-secondary">
                          {isRTL
                            ? 'إرسال تذكير عبر واتساب للعميل الذي لم يكمل طلبه لزيادة المبيعات.'
                            : 'Send WhatsApp follow-ups to customers who left items in cart.'}
                        </p>
                        <div className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-brand">
                          <span>{isRTL ? 'جاهز للتخصيص' : 'Ready to customize'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-surface-secondary/60 p-4 text-xs text-text-secondary">
                      💡 {isRTL
                        ? 'ستتمكن من إنشاء وتعديل مسارات عملك بسهولة من قسم مسارات العمل (Workflows) في لوحة التحكم.'
                        : 'You can create, edit, and fine-tune unlimited custom workflows in the Workflows builder inside your dashboard.'}
                    </div>
                  </motion.div>
                )}

                {/* ════════════════════════════════════════════════════════════
                    STEP 7: READY TO LAUNCH & SUMMARY
                ════════════════════════════════════════════════════════════ */}
                {step === 7 && (
                  <motion.div
                    key="step-7"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="text-center"
                  >
                    {/* Animated celebration badge */}
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-brand/20 bg-brand/10 shadow-2xl">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                      >
                        <Check size={40} className="text-brand" />
                      </motion.div>
                    </div>

                    <h2 className="text-3xl font-black tracking-tight text-text-primary sm:text-4xl">
                      {isRTL ? '🎉 موظفك الذكي جاهز للعمل!' : '🎉 Your AI Assistant is Ready!'}
                    </h2>
                    <p className="mx-auto mt-2 max-w-lg text-sm text-text-secondary sm:text-base">
                      {isRTL
                        ? 'تم إعداد مساحة عملك بنجاح. أنت الآن جاهز لبدء استقبال المحادثات وأتمتة مبيعاتك على مدار الساعة.'
                        : 'Your workspace is fully configured. You are ready to automate customer conversations and boost sales 24/7.'}
                    </p>

                    {/* Setup Summary Checklist */}
                    <div className="mx-auto mt-8 max-w-md rounded-2xl border border-border bg-surface-secondary/50 p-5 text-start shadow-sm">
                      <div className="mb-3 text-xs font-bold uppercase tracking-wider text-text-tertiary">
                        {isRTL ? 'ملخص الإعداد المكتمل' : 'Setup Summary'}
                      </div>
                      <div className="space-y-2.5 text-xs">
                        <div className="flex items-center justify-between border-b border-border/80 pb-2">
                          <span className="text-text-secondary">{isRTL ? 'اسم النشاط:' : 'Business Name:'}</span>
                          <span className="font-bold text-text-primary">
                            {data.businessName || (isRTL ? 'محدد' : 'Configured')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-border/80 pb-2">
                          <span className="text-text-secondary">{isRTL ? 'أسلوب الرد:' : 'AI Tone:'}</span>
                          <span className="font-bold text-brand">
                            {REPLY_STYLES.find((s) => s.id === data.replyStyle)?.[isRTL ? 'ar' : 'en']}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-border/80 pb-2">
                          <span className="text-text-secondary">{isRTL ? 'قنوات المراسلة:' : 'Channels:'}</span>
                          <span className="font-bold text-text-primary">
                            {connectedChannels.length > 0
                              ? connectedChannels.join(', ')
                              : (isRTL ? 'جاهز للربط' : 'Ready to link')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-text-secondary">{isRTL ? 'الأتمتة الفورية:' : 'Automation:'}</span>
                          <span className="font-bold text-success">
                            ✓ {isRTL ? 'مفعلة ونشطة' : 'Active 24/7'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Launch Action */}
                    <div className="mx-auto mt-8 max-w-md space-y-3">
                      <motion.button
                        type="button"
                        onClick={handleFinish}
                        disabled={saving}
                        whileHover={{ scale: 1.015, y: -1 }}
                        whileTap={{ scale: 0.985 }}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-black text-white shadow-xl transition-all"
                        style={{
                          background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)',
                          boxShadow: '0 8px 28px -4px rgba(23, 105, 255, 0.45)',
                        }}
                      >
                        {saving ? (
                          <span>{isRTL ? 'جارٍ تحضير لوحة التحكم...' : 'Opening dashboard...'}</span>
                        ) : (
                          <>
                            <span>{isRTL ? 'الدخول إلى لوحة التحكم ←' : 'Enter Dashboard →'}</span>
                          </>
                        )}
                      </motion.button>
                      <p className="text-[11px] text-text-tertiary">
                        {isRTL
                          ? 'ستبدأ جولة تفاعلية سريعة لشرح أقسام لوحة التحكم فور دخولك.'
                          : 'An interactive guided tour will introduce key dashboard features.'}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom Navigation Buttons */}
              {step < 7 && (
                <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
                  <div>
                    {step > 1 && (
                      <button
                        type="button"
                        onClick={handleBack}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-elevated px-4 py-2.5 text-xs font-bold text-text-secondary transition-colors hover:text-text-primary"
                      >
                        <ArrowLeft size={14} className={isRTL ? 'rotate-180' : ''} />
                        <span>{isRTL ? 'السابق' : 'Previous'}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSkip}
                      disabled={saving}
                      className="text-xs font-semibold text-text-tertiary hover:text-text-secondary"
                    >
                      {isRTL ? 'تخطي هذه الخطوة' : 'Skip step'}
                    </button>

                    <motion.button
                      type="button"
                      onClick={handleNext}
                      disabled={saving}
                      whileHover={!saving ? { scale: 1.02 } : {}}
                      whileTap={!saving ? { scale: 0.98 } : {}}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-brand-hover disabled:opacity-70"
                    >
                      {saving ? (
                        <span>{isRTL ? 'جارٍ الحفظ...' : 'Saving...'}</span>
                      ) : (
                        <>
                          <span>
                            {step === 6
                              ? (isRTL ? 'إنهاء الإعداد والمتابعة' : 'Complete Setup')
                              : (isRTL ? 'التالي' : 'Next')}
                          </span>
                          <ArrowRight size={14} className={isRTL ? 'rotate-180' : ''} />
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <WhatsAppConnect
          isConnected={connectedChannels.includes('whatsapp')}
          onConnected={() => {
            setConnectedChannels((prev) => Array.from(new Set([...prev, 'whatsapp'])))
            setData((d) => ({ ...d, connectedChannel: 'whatsapp' }))
            setShowWhatsAppModal(false)
          }}
          onClose={() => setShowWhatsAppModal(false)}
        />
      )}

      {/* Shopify Modal */}
      {showShopifyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl">
            <ShopifyConnect
              isConnected={connectedChannels.includes('shopify')}
              onClose={() => setShowShopifyModal(false)}
              onConnect={async (shop) => {
                const token = getToken()
                const res = await fetch(`${API}/api/channels/shopify/connect`, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    ...getBusinessHeaders(),
                  },
                  body: JSON.stringify({ ...shop, return_to: 'onboarding' }),
                })
                const json = await res.json()
                if (json.authorization_url) window.location.assign(json.authorization_url)
              }}
              onDisconnect={async () => setShowShopifyModal(false)}
            />
          </div>
        </div>
      )}

      {/* WooCommerce Panel */}
      {showWooCommercePanel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-border bg-surface-elevated p-6 shadow-2xl">
            <WooCommerceConnect
              isConnected={connectedChannels.includes('woocommerce')}
              onConnect={async (store) => {
                const token = getToken()
                const res = await fetch(`${API}/api/channels/woocommerce/connect`, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    ...getBusinessHeaders(),
                  },
                  body: JSON.stringify({ ...store, return_to: 'onboarding' }),
                })
                const json = await res.json()
                if (json.authorization_url) window.location.assign(json.authorization_url)
              }}
              onDisconnect={async () => setShowWooCommercePanel(false)}
            />
            <div className="mt-4 text-end">
              <button
                type="button"
                onClick={() => setShowWooCommercePanel(false)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-text-secondary hover:text-text-primary"
              >
                {isRTL ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
