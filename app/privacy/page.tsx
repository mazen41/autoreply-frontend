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
      subtitle: 'This policy explains how Naz Biz processes business and customer data to provide inbox, AI, automation, and commerce features.',
      lastUpdated: 'Last updated: October 2026',
      backHome: 'Back to Platform',
      contactUs: 'Questions? Reach out to privacy@nazbiz.io',
      sections: [
        {
          id: 'intro',
          icon: <ShieldCheck className="w-5 h-5 text-brand" />,
          title: '1. Introduction',
          content: `Naz Biz ("Naz Autoreply", "we", "our", "the platform") is an enterprise AI automation platform designed to manage and automate multi-channel customer communications. This privacy policy explains what data we collect, how it is encrypted and processed, and your rights regarding your information.`
        },
        {
          id: 'data-collection',
          icon: <Lock className="w-5 h-5 text-ai-accent" />,
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
          icon: <Sparkles className="w-5 h-5 text-info" />,
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
            'WhatsApp Business, Telegram, and connected channel providers — message delivery and receipt status. Evolution API may be used for merchants who connect the legacy WhatsApp session integration.',
            'Google Cloud & Gmail API — Authorized email ingestion and reply dispatching.',
            'E-Commerce Platforms (Salla, Shopify, WooCommerce, TikTok) — Order sync, webhooks, and catalog management.',
            'AI providers, when enabled: Google Gemini, Groq, OpenAI, and Anthropic. Message text, relevant business context, and media submitted for analysis may be sent to the configured provider to generate a reply or analysis.',
            'Commerce platforms: Salla, Shopify, WooCommerce, and supported TikTok integrations receive store sync or order actions requested by the merchant.',
            'Operations providers may include Pusher for real-time dashboard updates, the configured email delivery service, and Paymob or MyFatoorah for payments. City-level address lookup uses the merchant-configured private Nominatim endpoint.',
            'Payment data is handled by the selected payment gateway; Naz Biz does not store raw card numbers.'
          ]
        },
        {
          id: 'security',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
          title: '5. Security & Encryption Standards',
          items: [
            'Channel credentials and access tokens are encrypted at rest by the application. Passwords are stored as hashes.',
            'Connections use HTTPS where supported by the connected provider.',
            'Strict multi-tenant database isolation ensures your business data is never accessible by other organizations.',
            'Default retention is 365 days for messages and 30 days for inbound media. Business owners can change retention periods in Privacy & Data settings.',
            'Data sent to a connected channel, commerce, AI, payment, email, or infrastructure provider is also subject to that provider’s own terms and retention rules.'
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
      subtitle: 'توضح هذه السياسة كيفية معالجة ناز بيز لبيانات المنشأة والعملاء لتقديم صندوق الوارد والذكاء الاصطناعي والأتمتة والتجارة الإلكترونية.',
      lastUpdated: 'آخر تحديث: أكتوبر 2026',
      backHome: 'العودة إلى المنصة',
      contactUs: 'أسئلة؟ تواصل معنا عبر privacy@nazbiz.io',
      sections: [
        {
          id: 'intro',
          icon: <ShieldCheck className="w-5 h-5 text-brand" />,
          title: '1. مقدمة',
          content: `تعتبر منصة ناز بيز ("Naz Autoreply"، "نحن"، "المنصة") منظومة متكاملة لأتمتة خدمة العملاء وإدارة المراسلات عبر القنوات المتعددة بالذكاء الاصطناعي. توضح هذه السياسة البيانات التي نجمعها، وكيفية معالجتها وتشفيرها، وحقوقك المتعلقة بمعلوماتك.`
        },
        {
          id: 'data-collection',
          icon: <Lock className="w-5 h-5 text-ai-accent" />,
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
          icon: <Sparkles className="w-5 h-5 text-info" />,
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
            'واتساب للأعمال السحابي وتليجرام ومزودو القنوات المتصلة — لإرسال الرسائل وتأكيد الوصول. قد تُستخدم Evolution API عند ربط تكامل واتساب القديم.',
            'جوجل (Google Cloud & Gmail API) — لقراءة بريد الخدمة وإرسال الردود.',
            'منصات التجارة الإلكترونية (سلة، شوبيفاي، ووكومرس، تيك توك) — لمزامنة الطلبات والمنتجات.',
            'مزودو الذكاء الاصطناعي عند تفعيلهم: Google Gemini وGroq وOpenAI وAnthropic. قد يُرسل نص الرسالة والسياق التجاري اللازم والوسائط المقدمة للتحليل إلى المزود المحدد لتوليد الرد أو التحليل.',
            'منصات التجارة: سلة وشوبيفاي وWooCommerce وتكاملات تيك توك المدعومة لمزامنة المتجر وتنفيذ إجراءات الطلبات التي يطلبها التاجر.',
            'قد تشمل مزودات التشغيل Pusher لتحديثات لوحة التحكم الفورية، وخدمة البريد الإلكتروني المضبوطة، وPaymob أو MyFatoorah للدفع. يستخدم تحديد المدينة نقطة Nominatim الخاصة التي يضبطها التاجر.',
            'يتعامل مزود الدفع المختار مع بيانات الدفع؛ لا تخزن ناز بيز أرقام البطاقات كاملة.'
          ]
        },
        {
          id: 'security',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
          title: '5. معايير الأمان والتشفير',
          items: [
            'تُشفّر بيانات اعتماد القنوات ورموز الوصول أثناء التخزين بواسطة التطبيق، وتُخزن كلمات المرور بصيغة تجزئة آمنة.',
            'تستخدم الاتصالات HTTPS حيثما يدعمه مزود الخدمة المتصل.',
            'عزل كامل لقواعد البيانات يضمن عدم تداخل بيانات المنشآت.',
            'مدة الاحتفاظ الافتراضية ٣٦٥ يوماً للرسائل و٣٠ يوماً للوسائط الواردة، ويمكن لمالك النشاط تعديلها من إعدادات الخصوصية والبيانات.',
            'تخضع البيانات المرسلة إلى مزودي القنوات والتجارة والذكاء الاصطناعي والدفع والبريد والبنية التحتية أيضاً لشروط وسياسات الاحتفاظ الخاصة بكل مزود.'
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
    <div className={`min-h-screen font-sans ${lang === 'ar' ? 'rtl' : 'ltr'}`} style={{ background: 'var(--background)', color: 'var(--text-primary)' }}>
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/10 bg-[var(--background)]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[image:var(--brand-gradient)] flex items-center justify-center shadow-lg shadow-brand/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              Naz <span className="text-transparent bg-clip-text bg-[image:var(--brand-gradient)]">Biz</span>
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
      <section className="relative py-16 px-6 border-b border-white/5 bg-gradient-to-b from-brand/20 via-[var(--background)] to-[var(--background)] text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand/30 bg-brand/10 text-brand text-xs font-semibold mb-6">
            <ShieldCheck className="w-4 h-4 text-brand" />
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
              className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-surface backdrop-blur-sm hover:border-brand/30 transition-all shadow-xl shadow-black/20"
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
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Footer Contact */}
        <div className="mt-12 text-center p-6 sm:p-8 rounded-2xl border border-white/10 bg-gradient-to-r from-brand-violet/10 via-brand/10 to-surface">
          <p className="text-sm font-medium text-slate-300">
            {c.contactUs}
          </p>
        </div>
      </main>
    </div>
  )
}
