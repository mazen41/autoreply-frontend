'use client'

import React, { useState } from 'react'
import { useLang } from '../../lib/LangContext'
import Link from 'next/link'
import { ShieldCheck, Lock, Eye, ArrowLeft, ArrowRight, Sparkles, CheckCircle2, Globe } from 'lucide-react'

export default function PrivacyPage() {
  const { isRTL, setLang } = useLang()
  const [lang, setLangState] = useState<'ar' | 'en'>(isRTL ? 'ar' : 'en')

  const toggleLang = () => {
    const newLang = lang === 'ar' ? 'en' : 'ar'
    setLangState(newLang)
    setLang(newLang)
  }

  const content = {
    en: {
      title: 'Privacy Policy',
      badge: 'Security & Data Protection',
      subtitle: 'At Naz Biz (Naz Autoreply), we prioritize your privacy. We secure your channel credentials, business profile data, and customer communications with military-grade encryption.',
      lastUpdated: 'Last updated: August 2026',
      backHome: 'Back to Platform',
      contactUs: 'Questions? Reach out to privacy@nazbiz.io',
      sections: [
        {
          id: 'intro',
          icon: <ShieldCheck className="w-5 h-5 text-indigo-400" />,
          title: '1. Introduction',
          content: `Naz Biz ("Naz Autoreply", "we", "our", "the platform") is an enterprise AI automation platform designed to manage and automate multi-channel customer communications. This privacy policy explains what data we collect, how it is encrypted and processed, and your rights regarding your information.`
        },
        {
          id: 'data-collection',
          icon: <Lock className="w-5 h-5 text-purple-400" />,
          title: '2. Data Collection & Account Isolation',
          intro: 'To deliver automated replies, cross-channel inbox aggregation, and contextual AI memory, we collect the following data:',
          items: [
            'Account Credentials: Name, email address, password hashes, and business configuration metadata.',
            'Business Knowledge Base: Product catalogs, FAQs, operating policies, and guidelines provided during training.',
            'Channel Access Tokens: Secure access tokens for Meta (Facebook/Instagram), WhatsApp, Telegram, Gmail, Salla, Shopify, and TikTok. All tokens are encrypted at rest using AES-256.',
            'Message Data: Transcripts of incoming and outgoing customer messages processed to generate AI replies and populate your unified inbox.',
            'Telemetry: IP address, browser metadata, session timestamps, and operational health metrics.'
          ]
        },
        {
          id: 'data-use',
          icon: <Sparkles className="w-5 h-5 text-blue-400" />,
          title: '3. Data Processing & Usage Rules',
          intro: 'Your data is strictly processed to fulfill service requirements:',
          items: [
            'Generating and delivering automated AI customer support responses on your connected channels.',
            'Displaying real-time conversations and message logs in your unified dashboard.',
            'Personalizing customer responses using verified business details.',
            'Maintaining system security, preventing spam, and auditing platform performance.',
            'We NEVER sell your personal or customer data to third parties.',
            'We NEVER use your private customer messages to train public AI models.'
          ]
        },
        {
          id: 'providers',
          icon: <Globe className="w-5 h-5 text-emerald-400" />,
          title: '4. Third-Party Integrations & Infrastructure',
          intro: 'Naz Biz connects directly with official channel providers and infrastructure services:',
          items: [
            'Meta Platforms (Facebook & Instagram Graph API) — Authorized messaging and page management.',
            'Official Messaging Gateways (WhatsApp Business Suite & Telegram API) — Instant message delivery and receipt status.',
            'Google Cloud & Gmail API — Authorized email ingestion and reply dispatching.',
            'E-Commerce Platforms (Salla, Shopify, WooCommerce, TikTok) — Order sync, webhooks, and catalog management.',
            'AI Providers (Google Gemini & Anthropic Claude) — Contextual AI response processing under strict privacy agreements.',
            'Payment Processors (Paymob & Stripe) — Financial transactions handled via PCI-DSS compliant gateways (we never store raw credit card numbers).'
          ]
        },
        {
          id: 'security',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
          title: '5. Security & Encryption Standards',
          items: [
            'All channel credentials and access tokens are encrypted at rest using AES-256 encryption.',
            'All data in transit is protected using TLS 1.3 / HTTPS encryption protocols.',
            'Strict multi-tenant database isolation ensures your business data is never accessible by other organizations.',
            'Data is retained while your account remains active. You may request permanent deletion at any time.'
          ]
        },
        {
          id: 'rights',
          icon: <Eye className="w-5 h-5 text-amber-400" />,
          title: '6. Your Rights & Data Control',
          items: [
            'Right to Access & Export: Download and inspect your communication history and business data.',
            'Right to Rectify: Update your business information and training context at any time.',
            'Right to Erasure: Request full account and data deletion by contacting privacy@nazbiz.io.'
          ]
        }
      ]
    },
    ar: {
      title: 'سياسة الخصوصية',
      badge: 'حماية البيانات والأمان',
      subtitle: 'في ناز بيز (Naz Autoreply)، نضع خصوصيتك وأمان بياناتك في المقدمة. نقوم بتشفير رموز اتصال القنوات ومعلومات النشاط التجاري بأعلى معايير التشفير.',
      lastUpdated: 'آخر تحديث: أغسطس 2026',
      backHome: 'العودة إلى المنصة',
      contactUs: 'أسئلة؟ تواصل معنا عبر privacy@nazbiz.io',
      sections: [
        {
          id: 'intro',
          icon: <ShieldCheck className="w-5 h-5 text-indigo-400" />,
          title: '1. مقدمة',
          content: `تعتبر منصة ناز بيز ("Naz Autoreply"، "نحن"، "المنصة") منظومة متكاملة لأتمتة خدمة العملاء وإدارة المراسلات عبر القنوات المتعددة بالذكاء الاصطناعي. توضح هذه السياسة البيانات التي نجمعها، وكيفية معالجتها وتشفيرها، وحقوقك المتعلقة بمعلوماتك.`
        },
        {
          id: 'data-collection',
          icon: <Lock className="w-5 h-5 text-purple-400" />,
          title: '2. جمع البيانات والعزل الأمني',
          intro: 'لتقديم خدمة الرد الآلي الفوري وتأمين الذاكرة السياقية وصندوق الوارد الموحد، نجمع البيانات التالية بشكل آمن:',
          items: [
            'بيانات الحساب: الاسم، البريد الإلكتروني للعمل، كلمات المرور المشفرة، وإعدادات النشاط التجاري.',
            'قاعدة معارف النشاط التجاري: كتالوجات المنتجات، الأسئلة الشائعة، وسياق العمل الموفر أثناء التدريب.',
            'بيانات اتصال القنوات: رموز التوثيق المعتمدة لقنوات ميتا (فيسبوك/إنستغرام)، واتساب، تليجرام، جيميل، سلة، شوبيفاي، وتيك توك. تُشفر جميع المفاتيح باستخدام AES-256.',
            'سجلات الرسائل: محتوى الرسائل الواردة والصادرة اللازمة لتوليد ردود الذكاء الاصطناعي وعرض صندوق الوارد.',
            'البيانات التقنية: عنوان IP، معلومات المتصفح، الطوابع الزمنية، ومؤشرات الأداء.'
          ]
        },
        {
          id: 'data-use',
          icon: <Sparkles className="w-5 h-5 text-blue-400" />,
          title: '3. قواعد معالجة البيانات واستخدامها',
          intro: 'تُعالج بياناتك حصرياً لتشغيل وخدمة نشاطك التجاري:',
          items: [
            'توليد وإرسال الردود الآلية بالذكاء الاصطناعي على القنوات المتصلة.',
            'عرض المحادثات الموحدة وسجلات المراسلات في لوحة التحكم.',
            'تخصيص التفاعلات بناءً على ملف النشاط التجاري المعتمد.',
            'الحفاظ على أمان النظام ومنع الرسائل غير المرغوب فيها.',
            'نحن لا نبيع بياناتك الشخصية أو بيانات عملائك لأي أطراف ثالثة نهائياً.',
            'نحن لا نستخدم رسائل عملائك الخاصة لتدريب نماذج الذكاء الاصطناعي العامة.'
          ]
        },
        {
          id: 'providers',
          icon: <Globe className="w-5 h-5 text-emerald-400" />,
          title: '4. البنية التحتية والمنصات المتصلة',
          intro: 'تتصل ناز بيز مباشرة مع المنصات الرسمية وبوابات التوثيق لتشغيل المراسلات:',
          items: [
            'ميتا (واجهة فيسبوك وإنستغرام الرسمية Graph API) — لإدارة الصفحات والمراسلات.',
            'بوابات المراسلة (منظومة واتساب وتليجرام الرسمية) — لإرسال الرسائل وتأكيد الوصول.',
            'جوجل (Google Cloud & Gmail API) — لقراءة بريد الخدمة وإرسال الردود.',
            'منصات التجارة الإلكترونية (سلة، شوبيفاي، ووكومرس، تيك توك) — لمزامنة الطلبات والمنتجات.',
            'محركات الذكاء الاصطناعي (Google Gemini & Anthropic Claude) — لتوليد الردود السياقية وفق معايير أمان عالية.',
            'بوابات الدفع (Paymob & Stripe) — لمعالجة المعاملات المالية بشكل آمن دون تخزين بيانات البطاقات.'
          ]
        },
        {
          id: 'security',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
          title: '5. معايير الأمان والتشفير',
          items: [
            'جميع مفاتيح الاتصال ورموز القنوات مشفرة باستخدام تشفير AES-256.',
            'جميع البيانات أثناء النقل محمية ببروتوكولات TLS 1.3 / HTTPS.',
            'عزل كامل لقواعد البيانات يضمن عدم تداخل بيانات المنشآت.',
            'تُحفظ البيانات طوال فترة تفعيل الحساب، ويمكن طلب حذفها نهائياً في أي وقت.'
          ]
        },
        {
          id: 'rights',
          icon: <Eye className="w-5 h-5 text-amber-400" />,
          title: '6. حقوقك والتحكم بالبيانات',
          items: [
            'حق الوصول والتصدير: مراجعة كافة المحادثات وإعدادات الحساب.',
            'حق التعديل: تحديث معلومات وسياق عملك فورياً.',
            'حق الحذف: طلب مسح الحساب والسجلات نهائياً عبر privacy@nazbiz.io.'
          ]
        }
      ]
    }
  }

  const c = content[lang]

  return (
    <div className={`min-h-screen font-sans ${lang === 'ar' ? 'rtl' : 'ltr'}`} style={{ background: '#090d16', color: '#f8fafc' }}>
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/10 bg-slate-950/80">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              Naz <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Biz</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleLang}
              className="px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold transition-all text-slate-200 flex items-center gap-2"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>
            <Link
              href="/"
              className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white border border-white/10 hover:border-white/20 bg-white/5 transition-all"
            >
              {lang === 'ar' ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
              {c.backHome}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <section className="relative py-16 px-6 border-b border-white/5 bg-gradient-to-b from-indigo-950/30 via-slate-950 to-slate-950 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-6">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            {c.badge}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4 text-white">
            {c.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed mb-4 max-w-2xl mx-auto">
            {c.subtitle}
          </p>
          <div className="text-xs font-medium text-slate-500">
            {c.lastUpdated}
          </div>
        </div>
      </section>

      {/* Main Sections */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="space-y-8">
          {c.sections.map((sec, idx) => (
            <div
              key={sec.id || idx}
              className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-sm hover:border-indigo-500/30 transition-all shadow-xl shadow-black/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  {sec.icon}
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {sec.title}
                </h2>
              </div>

              {sec.content && (
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                  {sec.content}
                </p>
              )}

              {sec.intro && (
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-4">
                  {sec.intro}
                </p>
              )}

              {sec.items && (
                <ul className="space-y-3 mt-3">
                  {sec.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start gap-3 text-sm sm:text-base text-slate-300">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Footer Contact */}
        <div className="mt-12 text-center p-6 sm:p-8 rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-950/20 via-purple-950/20 to-slate-900/50">
          <p className="text-sm font-medium text-slate-300">
            {c.contactUs}
          </p>
        </div>
      </main>
    </div>
  )
}
