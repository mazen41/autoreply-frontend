'use client'

import React from 'react'
import { Sparkles, MessageCircle, HelpCircle, ShoppingBag, UserCheck, MessageSquarePlus, Check } from 'lucide-react'
import { useLang } from '../../../lib/LangContext'
import { BotCapabilitiesState, CommentSettings, PublicInfoCategory } from './types'

interface Step05CapabilitiesProps {
  capabilities: BotCapabilitiesState
  setCapabilities: React.Dispatch<React.SetStateAction<BotCapabilitiesState>>
  commentSettings: Record<number, CommentSettings>
  setCommentSettings: React.Dispatch<React.SetStateAction<Record<number, CommentSettings>>>
  selectedChannelIds: number[]
}

const PUBLIC_INFO_OPTIONS: Array<{ id: PublicInfoCategory; labelEn: string; labelAr: string }> = [
  { id: 'general_business_info', labelEn: 'Business Overview & Hours', labelAr: 'معلومات النشاط وساعات العمل' },
  { id: 'product_names', labelEn: 'Product Names', labelAr: 'أسماء المنتجات' },
  { id: 'product_descriptions', labelEn: 'Descriptions & Details', labelAr: 'أوصاف ومواصفات المنتجات' },
  { id: 'product_prices', labelEn: 'Prices', labelAr: 'الأسعار الرسمية' },
  { id: 'discounts', labelEn: 'Discounts & Offers', labelAr: 'العروض والخصومات' },
  { id: 'availability', labelEn: 'Stock Availability', labelAr: 'حالة التوفر والمخزون' },
  { id: 'product_links', labelEn: 'Direct Store Links', labelAr: 'روابط الشراء المباشرة' },
]

export default function Step05Capabilities({
  capabilities,
  setCapabilities,
  commentSettings,
  setCommentSettings,
  selectedChannelIds,
}: Step05CapabilitiesProps) {
  const { isRTL, t } = useLang()
  const copy = t.botCreationWizard || {}

  const toggleCapability = (key: keyof BotCapabilitiesState) => {
    setCapabilities((cur) => ({ ...cur, [key]: !cur[key] }))
  }

  const capabilityItems = [
    {
      key: 'autoReply' as const,
      icon: MessageCircle,
      title: copy.capAutoReplyTitle || (isRTL ? 'الردود الآلية الذكية 24/7' : '24/7 Smart Automated Replies'),
      desc: copy.capAutoReplyDesc || (isRTL ? 'الرد الفوري والذكي على استفسارات ورسائل العملاء عبر كافة القنوات على مدار الساعة.' : 'Instant, contextual replies to all inbound customer inquiries around the clock.'),
      color: 'text-brand bg-brand/10 border-brand/30',
      activeBorder: 'border-brand/50 bg-brand/5',
    },
    {
      key: 'faqGrounding' as const,
      icon: HelpCircle,
      title: copy.capFaqTitle || (isRTL ? 'الإجابة الدقيقة من قاعدة المعرفة' : 'Grounded Knowledge Retrieval'),
      desc: copy.capFaqDesc || (isRTL ? 'الاستناد الصارم إلى مستنداتك وسياساتك لتقديم إجابات موثوقة ومطابقة بدون أي هلوسة.' : 'Strict reference to your uploaded files and store policies with zero guesswork.'),
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
      activeBorder: 'border-teal-500/50 bg-teal-500/5',
    },
    {
      key: 'commerceRouting' as const,
      icon: ShoppingBag,
      title: copy.capCommerceTitle || (isRTL ? 'الاستعلام عن المنتجات والطلبات' : 'Store Catalog & Order Routing'),
      desc: copy.capCommerceDesc || (isRTL ? 'فحص توفر المنتجات في متجرك، والأسعار، وروابط الشراء المباشرة لتسهيل الدفع.' : 'Check product availability, live pricing, and direct checkout links from your store.'),
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      activeBorder: 'border-cyan-500/50 bg-cyan-500/5',
    },
    {
      key: 'humanHandoff' as const,
      icon: UserCheck,
      title: copy.capHandoffTitle || (isRTL ? 'التحويل الذكي لفريق الدعم البشري' : 'Seamless Human Escalation'),
      desc: copy.capHandoffDesc || (isRTL ? 'اكتشاف استياء العميل أو الكلمات المفتاحية ونقل المحادثة لموظف بشري مع إشعار فوري.' : 'Detect customer frustration or high-priority requests and transfer smoothly to a human.'),
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      activeBorder: 'border-purple-500/50 bg-purple-500/5',
    },
    {
      key: 'commentAutomation' as const,
      icon: MessageSquarePlus,
      title: copy.capCommentsTitle || (isRTL ? 'الرد التلقائي على تعليقات المنشورات' : 'Post Comment Automation'),
      desc: copy.capCommentsDesc || (isRTL ? 'الرد الذكي على تعليقات فيسبوك وإنستغرام ونقل العميل للرسائل الخاصة لشراء أسرع.' : 'Engage customers in post comments with public answers and private DM follow-ups.'),
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
      activeBorder: 'border-pink-500/50 bg-pink-500/5',
    },
  ]

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Step Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-3 py-1 text-xs font-semibold text-pink-400 mb-3">
          <Sparkles size={13} />
          <span>{isRTL ? 'الخطوة 05 · القدرات الذكية' : 'Step 05 · Bot Capabilities'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          {copy.step5Title || (isRTL ? 'ما هي القدرات التي يمتلكها مساعدك؟' : 'What should your assistant be able to do?')}
        </h1>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed max-w-xl">
          {copy.step5Subtitle ||
            (isRTL
              ? 'فعّل الميزات والقدرات الذكية التي يتمتع بها وكيلك لخدمة نشاطك التجاري بأعلى كفاءة.'
              : 'Enable smart capabilities tailored to your store operations and customer workflow.')}
        </p>
      </div>

      {/* Capabilities Cards */}
      <div className="space-y-4">
        {capabilityItems.map((item) => {
          const isEnabled = capabilities[item.key]
          const Icon = item.icon

          return (
            <div
              key={item.key}
              className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 ${
                isEnabled
                  ? `${item.activeBorder} shadow-lg shadow-black/20`
                  : 'border-white/[0.08] bg-surface-elevated/40 hover:border-white/20 hover:bg-surface-elevated/70'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${item.color}`}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                    <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                {/* Modern Switch Toggle */}
                <button
                  type="button"
                  onClick={() => toggleCapability(item.key)}
                  aria-pressed={isEnabled}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isEnabled ? 'bg-brand' : 'bg-surface-elevated'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isEnabled ? (isRTL ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Sub-settings if Comment Automation is Enabled */}
              {item.key === 'commentAutomation' && isEnabled && (
                <div className="mt-4 pt-4 border-t border-white/[0.08] space-y-3">
                  <p className="text-xs font-bold text-text-secondary">
                    {isRTL ? 'المعلومات المسموح بنشرها علناً في التعليقات:' : 'Allowed Public Information in Comments:'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PUBLIC_INFO_OPTIONS.map((opt) => (
                      <label
                        key={opt.id}
                        className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.03] p-2.5 text-xs text-text-secondary cursor-pointer hover:bg-white/[0.06]"
                      >
                        <input
                          type="checkbox"
                          defaultChecked={true}
                          className="rounded border-white/20 bg-surface accent-brand"
                        />
                        <span>{isRTL ? opt.labelAr : opt.labelEn}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
