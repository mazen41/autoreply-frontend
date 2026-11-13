'use client'

import React, { useState, useRef, useEffect, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../../lib/LangContext'
import { HelpCircle, ChevronDown, Sparkles } from 'lucide-react'

interface FaqItem {
  qEn: string
  qAr: string
  aEn: string
  aAr: string
}

const FAQ_ITEMS: FaqItem[] = [
  {
    qEn: 'What is Naz AutoReply?',
    qAr: 'ما هي منصة نذير (Naz AutoReply)؟',
    aEn: 'Naz AutoReply is an autonomous conversational AI platform for businesses and e-commerce stores. It connects WhatsApp, Instagram, Telegram, Messenger, TikTok, and online stores to automatically respond to customer inquiries, answer product questions, and look up orders 24/7.',
    aAr: 'نذير هي منصة ذكاء اصطناعي محادثية متقدمة للأعمال والمتاجر الإلكترونية. تربط قنوات المراسلة (واتساب، إنستغرام، تلغرام، ماسنجر، تيك توك) بمتاجرك للرد الآلي الفوري على استفسارات العملاء والبحث في الطلبات على مدار الساعة.',
  },
  {
    qEn: 'Which communication channels are supported?',
    qAr: 'ما هي قنوات المراسلة المدعومة في المنصة؟',
    aEn: 'Naz supports official WhatsApp Cloud API and QR web sessions, Instagram Direct Messages & comments, Facebook Messenger, TikTok business messages, Telegram bots, and Gmail email inquiries.',
    aAr: 'تدعم المنصة الربط الرسمي السحابي والويب لواتساب، رسائل وتعليقات إنستغرام، ماسنجر فيسبوك، رسائل تيك توك للأعمال، بوتات تلغرام، وبريد جيميل المؤسسي.',
  },
  {
    qEn: 'How does the AI learn about my business?',
    qAr: 'كيف يتعلم الذكاء الاصطناعي معلومات وسياسات نشاطي التجاري؟',
    aEn: 'You can upload your store documents (PDF, Excel catalogs, price lists), define business FAQs, and configure custom instructions, response tones, and operational hours. The AI strictly references your verified business context.',
    aAr: 'يمكنك ببساطة رفع مستنداتك وسياساتك (ملفات PDF، جداول Excel للأسعار والمنتجات)، وإدخال الأسئلة الشائعة وتحديد نبرة الرد وساعات العمل. يعتمد المساعد فقط على معلوماتك المعتمدة دون أي تخمين.',
  },
  {
    qEn: 'Which AI providers and models are available?',
    qAr: 'ما هي نماذج ومزودات الذكاء الاصطناعي المتاحة؟',
    aEn: 'Naz is engineered with a multi-model architecture supporting OpenAI (GPT-4o), Anthropic (Claude 3.5), Google (Gemini 2.5 Flash), and Groq, with automated failover for zero-downtime reliability.',
    aAr: 'تعمل المنصة ببنية تشغيل سحابية مرنة تدعم نماذج OpenAI (GPT-4o) وAnthropic (Claude 3.5) وGoogle (Gemini 2.5 Flash) مع تحويل فوري ذكي لحماية استمرارية الخدمة.',
  },
  {
    qEn: 'Can I connect my online store to Naz?',
    qAr: 'هل يمكنني ربط متجري الإلكتروني بالمنصة؟',
    aEn: 'Yes! We support direct integrations with Salla, Shopify, and WooCommerce. The AI accesses live catalog data, product availability, and pricing automatically.',
    aAr: 'نعم بالتأكيد! تدعم المنصة الربط المباشر مع منصات سلة (Salla)، شوبيفاي (Shopify)، وووكومرس (WooCommerce) لمزامنة كتالوج المنتجات والمخزون والأسعار لحظياً.',
  },
  {
    qEn: 'Can the AI answer order status and shipment questions?',
    qAr: 'هل يستطيع الذكاء الاصطناعي الإجابة على استفسارات حالة الطلبات والشحن؟',
    aEn: 'Yes. When connected to your store (Salla, Shopify, or WooCommerce), the AI can securely look up a customer’s order status, carrier shipment tracking details, and estimated delivery dates during chat.',
    aAr: 'نعم. بمجرد ربط متجرك، يستطيع المساعد الاستعلام بأمان عن حالة طلب العميل، رقم بوليصة الشحن، ورابط التتبع المباشر لشركات النقل وموعد التسليم المتوقع فوراً.',
  },
  {
    qEn: 'Can I manage multiple channels from one shared inbox?',
    qAr: 'هل يمكنني إدارة جميع القنوات من صندوق وارد واحد مشترك؟',
    aEn: 'Absolutely. All conversations across all connected channels stream into Naz’s unified omnichannel inbox, allowing you and your team to monitor, reply, or take over from AI whenever needed.',
    aAr: 'بالتأكيد. تصب جميع المحادثات من كافة القنوات في صندوق وارد موحد ومركزي، مما يتيح لك ولفريقك مراقبة المحادثات أو التدخل واستلام المحادثة من الذكاء الاصطناعي في أي لحظة.',
  },
  {
    qEn: 'How do subscriptions and AI credits work?',
    qAr: 'كيف تعمل خطط الاشتراك وباقات رصيد الذكاء الاصطناعي؟',
    aEn: 'Every account starts with a 14-day free business trial with generous AI credits. Paid plans include monthly or yearly packages with flexible AI reply allowances, and you can top up credits at any time.',
    aAr: 'يبدأ كل حساب جديد بتجربة أعمال مجانية لمدة 14 يوماً مع رصيد ذكاء اصطناعي وافر. تتوفر باقات شهرية وسنوية مرنة مع إمكانية شحن باقات رصيد إضافية متى احتجت.',
  },
  {
    qEn: 'How secure is customer and business data?',
    qAr: 'ما مدى أمان وحماية بيانات عملائي ومتجري؟',
    aEn: 'We use enterprise-grade encryption in transit and at rest. Your store credentials, API tokens, and customer message data are never shared or used to train public third-party AI models.',
    aAr: 'نطبق أعلى معايير التشفير والحماية السحابية. مفاتيح الربط وبيانات عملائك ومحادثاتهم مشفرة بالكامل ولا يتم أبداً استخدامها لتدريب نماذج ذكاء اصطناعي عامة.',
  },
  {
    qEn: 'How can I get started?',
    qAr: 'كيف أبدأ باستخدام المنصة اليوم؟',
    aEn: 'Click "Start Automating", create your business account in 60 seconds without a credit card, and follow our guided 8-step setup wizard to connect your first channel and train your assistant.',
    aAr: 'انقر على "ابدأ الآن"، أنشئ حسابك خلال 60 ثانية بدون الحاجة لبطاقة ائتمان، واتبع معالج الإعداد البسيط لربط قناتك الأولى وبدء الأتمتة فوراً.',
  },
]

function AccordionItem({
  item,
  isOpen,
  onToggle,
  isRTL,
}: {
  item: FaqItem
  isOpen: boolean
  onToggle: () => void
  isRTL: boolean
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)
  const panelId = useId()

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0)
    }
  }, [isOpen])

  return (
    <div
      className={`rounded-2xl transition-all duration-200 border ${
        isOpen
          ? 'border-brand/40 bg-surface-elevated shadow-sm'
          : 'border-border bg-surface-elevated/60 hover:border-brand/20'
      }`}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="w-full flex items-center justify-between p-5 text-start gap-4 transition-colors"
        onClick={onToggle}
      >
        <span
          className={`font-bold text-sm sm:text-base flex-1 ${
            isOpen ? 'text-brand' : 'text-text-primary'
          }`}
        >
          {isRTL ? item.qAr : item.qEn}
        </span>
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-200 border ${
            isOpen
              ? 'border-brand/30 bg-brand/10 text-brand rotate-180'
              : 'border-border bg-surface text-text-tertiary'
          }`}
        >
          <ChevronDown size={16} />
        </div>
      </button>

      <div
        id={panelId}
        aria-hidden={!isOpen}
        style={{
          height,
          overflow: 'hidden',
          transition: 'height 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div ref={contentRef} className="px-5 pb-5 text-xs sm:text-sm leading-relaxed text-text-secondary">
          <p>{isRTL ? item.aAr : item.aEn}</p>
        </div>
      </div>
    </div>
  )
}

export default function FAQ() {
  const { isRTL } = useLang()
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="relative overflow-hidden px-4 py-24 sm:px-6 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          {/* Left Column: Heading */}
          <div className="text-start">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3.5 py-1 text-xs font-bold text-brand">
              <HelpCircle size={13} />
              <span>{isRTL ? 'إجابات واضحة وشاملة' : 'Frequently Asked Questions'}</span>
            </div>
            <h2 className="text-balance text-3xl font-black tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
              {isRTL ? 'كل ما تحتاج معرفته عن نذير' : 'Everything You Need to Know About Naz AutoReply'}
            </h2>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-text-secondary">
              {isRTL
                ? 'إليك إجابات تفصيلية عن إمكانيات الربط، الذكاء الاصطناعي، أمان البيانات، وباقات الاشتراك.'
                : 'Direct, clear answers covering integrations, AI accuracy, security, and subscription plans.'}
            </p>
          </div>

          {/* Right Column: Accordion Items */}
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, index) => (
              <AccordionItem
                key={index}
                item={item}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                isRTL={isRTL}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
