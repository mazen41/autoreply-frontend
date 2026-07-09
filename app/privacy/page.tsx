'use client'

import React, { useState } from 'react'
import { useLang } from '../../lib/LangContext'
import { useTheme } from '../../lib/ThemeContext'
import Link from 'next/link'

export default function PrivacyPage() {
  const { isRTL, t, setLang } = useLang()
  const { theme } = useTheme()
  const [lang, setLangState] = useState(isRTL ? 'ar' : 'en')

  const toggleLang = () => {
    const newLang = lang === 'ar' ? 'en' : 'ar'
    setLangState(newLang)
    setLang(newLang)
  }

  const content = {
    en: {
      title: 'Privacy Policy',
      subtitle: 'Naz Autoreply is committed to protecting your privacy',
      sections: [
        {
          title: '1. Introduction',
          content: `Naz Autoreply ("we", "our", "the platform") is committed to protecting the privacy of its users. This policy explains what data we collect, how we use it, and your rights regarding your personal information. By using Naz Autoreply you agree to this policy.`
        },
        {
          title: '2. What Data We Collect',
          items: [
            'Account data: name, email address, password (hashed and never stored in plain text)',
            'Business profile data: business name, description, product information you provide during onboarding',
            'Channel connection data: access tokens for connected Facebook Pages, Instagram accounts, Gmail accounts, and WhatsApp numbers — stored encrypted and never shared',
            'Message data: incoming and outgoing messages processed through connected channels for the purpose of providing automated replies',
            'Usage data: pages visited, features used, timestamps, IP address, browser type',
            'Payment data: handled entirely by Stripe — we do not store credit card numbers'
          ]
        },
        {
          title: '3. How We Use Your Data',
          items: [
            'To provide the automated reply service',
            'To generate AI responses on your behalf using your business profile context',
            'To display your inbox and conversation history in the dashboard',
            'To improve and maintain the platform',
            'To send service notifications (never marketing without consent)',
            'We never sell your data to third parties',
            'We never use your customers\' messages for AI training'
          ]
        },
        {
          title: '4. Third Party Services We Use',
          items: [
            'Meta (Facebook/Instagram) API — to send and receive messages on your connected pages',
            'Google API — to send and receive Gmail messages',
            '360dialog — to send and receive WhatsApp messages',
            'Anthropic (Claude AI) — to generate automated replies. Messages are sent to Anthropic\'s API for processing and are subject to Anthropic\'s data policies',
            'Stripe — for payment processing',
            'All third party services have their own privacy policies which we encourage you to review'
          ]
        },
        {
          title: '5. Data Storage & Security',
          items: [
            'All data is stored on secured servers',
            'All channel access tokens are encrypted at rest using AES-256 encryption',
            'All data transmission uses HTTPS/TLS',
            'We conduct regular security reviews',
            'We retain your data for as long as your account is active. You may request deletion at any time.'
          ]
        },
        {
          title: '6. Your Rights',
          items: [
            'Right to access your data',
            'Right to correct inaccurate data',
            'Right to delete your account and all associated data',
            'Right to export your data',
            'To exercise any of these rights contact us at privacy@nazautoreply.com'
          ]
        },
        {
          title: '7. Cookies',
          content: `We use cookies for authentication (keeping you logged in) and language/theme preferences. We do not use advertising cookies or tracking pixels on the dashboard. The public website may use analytics cookies (Google Analytics).`
        },
        {
          title: '8. Children\'s Privacy',
          content: `Naz Autoreply is not intended for users under the age of 18. We do not knowingly collect data from minors.`
        },
        {
          title: '9. Changes to This Policy',
          content: `We may update this policy from time to time. We will notify registered users by email of any significant changes. Continued use of the platform after changes constitutes acceptance.`
        },
        {
          title: '10. Contact Us',
          content: `For any privacy-related questions: privacy@nazautoreply.com`
        }
      ],
      lastUpdated: 'Last updated: July 2026',
      backHome: '← Back to Homepage'
    },
    ar: {
      title: 'سياسة الخصوصية',
      subtitle: 'ناز أوتو ريبلي ملتزمة بحماية خصوصيتك',
      sections: [
        {
          title: '1. مقدمة',
          content: `ناز أوتو ريبلي ("نحن"، "خدمتنا"، "المنصة") ملتزمة بحماية خصوصية مستخدميها. توضح هذه السياسة البيانات التي نجمعها، وكيف نستخدمها، وحقوقك المتعلقة بمعلوماتك الشخصية. باستخدام ناز أوتو ريبلي فإنك توافق على هذه السياسة.`
        },
        {
          title: '2. البيانات التي نجمعها',
          items: [
            'بيانات الحساب: الاسم، عنوان البريد الإلكتروني، كلمة المرور (مشفرة ولا يتم تخزينها كنص عادي)',
            'بيانات الملف التجاري: اسم النشاط التجاري، الوصف، معلومات المنتج التي تقدمها أثناء التسجيل',
            'بيانات اتصال القنوات: رموز الوصول لصفحات فيسبوك المتصلة، حسابات إنستغرام، حسابات جيميل، وأرقام واتساب — يتم تخزينها مشفرة ولا يتم مشاركتها',
            'بيانات الرسائل: الرسائل الواردة والصادرة التي تتم معالجتها عبر القنوات المتصلة لغرض تقديم الردود الآلية',
            'بيانات الاستخدام: الصفحات التي تمت زيارتها، الميزات المستخدمة، الطوابع الزمنية، عنوان IP، نوع المتصفح',
            'بيانات الدفع: تتم معالجتها بالكامل بواسطة Stripe — لا نقوم بتخزين أرقام بطاقات الائتمان'
          ]
        },
        {
          title: '3. كيف نستخدم بياناتك',
          items: [
            'لتقديم خدمة الرد الآلي',
            'لتوليد ردود الذكاء الاصطناعي نيابة عنك باستخدام سياق ملفك التجاري',
            'لعرض صندوق الوارد وسجل المحادثات في لوحة التحكم',
            'لتحسين وصيانة المنصة',
            'لإرسال إشعارات الخدمة (أبداً تسويق بدون موافقة)',
            'نحن لا نبيع بياناتك لأطراف ثالثة',
            'نحن لا نستخدم رسائل عملائك لتدريب الذكاء الاصطناعي'
          ]
        },
        {
          title: '4. خدمات الطرف الثالث التي نستخدمها',
          items: [
            'واجهة برمجة تطبيقات ميتا (فيسبوك/إنستغرام) — لإرسال واستقبال الرسائل على صفحاتك المتصلة',
            'واجهة برمجة تطبيقات جوجل — لإرسال واستقبال رسائل جيميل',
            '360dialog — لإرسال واستقبال رسائل واتساب',
            'Anthropic (Claude AI) — لتوليد الردود الآلية. يتم إرسال الرسائل إلى واجهة برمجة تطبيقات Anthropic للمعالجة وهي تخضع لسياسات بيانات Anthropic',
            'Stripe — لمعالجة المدفوعات',
            'جميع خدمات الطرف الثالث لديها سياسات خصوصية خاصة بها ونشجعك على مراجعتها'
          ]
        },
        {
          title: '5. تخزين البيانات والأمان',
          items: [
            'جميع البيانات مخزنة على خوادم آمنة',
            'جميع رموز الوصول للقنوات مشفرة عند التخزين باستخدام تشفير AES-256',
            'جميع نقل البيانات يستخدم HTTPS/TLS',
            'نحن نجري مراجعات أمنية منتظمة',
            'نحتفظ ببياناتك طالما أن حسابك نشط. يمكنك طلب الحذف في أي وقت.'
          ]
        },
        {
          title: '6. حقوقك',
          items: [
            'الحق في الوصول إلى بياناتك',
            'الحق في تصحيح البيانات غير الدقيقة',
            'الحق في حذف حسابك وجميع البيانات المرتبطة به',
            'الحق في تصدير بياناتك',
            'لممارسة أي من هذه الحقوق اتصل بنا على privacy@nazautoreply.com'
          ]
        },
        {
          title: '7. ملفات تعريف الارتباط (Cookies)',
          content: `نحن نستخدم ملفات تعريف الارتباط للمصادقة (لإبقائك مسجلاً للدخول) وتفضيلات اللغة/المظهر. لا نستخدم ملفات تعريف الارتباط للإعلانات أو بكسل التتبع في لوحة التحكم. قد يستخدم الموقع العام ملفات تعريف الارتباط للتحليلات (Google Analytics).`
        },
        {
          title: '8. خصوصية الأطفال',
          content: `ناز أوتو ريبلي ليست مخصصة للمستخدمين دون سن 18 عاماً. لا نقوم بجمع بيانات من القاصرين عن علم.`
        },
        {
          title: '9. التغييرات على هذه السياسة',
          content: `قد نقوم بتحديث هذه السياسة من وقت لآخر. سنقوم بإخطار المستخدمين المسجلين بالبريد الإلكتروني بأي تغييرات هامة. الاستمرار في استخدام المنصة بعد التغييرات يشكل قبولاً لها.`
        },
        {
          title: '10. اتصل بنا',
          content: `لأي أسئلة متعلقة بالخصوصية: privacy@nazautoreply.com`
        }
      ],
      lastUpdated: 'آخر تحديث: يوليو 2026',
      backHome: '→ العودة إلى الصفحة الرئيسية'
    }
  }

  const c = content[lang as keyof typeof content]

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span style={{ color: 'var(--primary)', fontSize: 24, filter: 'drop-shadow(0 0 8px rgba(108,99,255,0.8))' }}>✦</span>
            <span className="text-xl font-black" style={{ color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>Naz</span>
          </Link>
          <button
            onClick={toggleLang}
            className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
            style={{ 
              background: 'rgba(255,255,255,0.04)', 
              border: '1px solid var(--border)', 
              color: 'var(--text-secondary)' 
            }}
          >
            {lang === 'ar' ? '🇬🇧 English' : '🇸🇦 العربية'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>
            {c.title}
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            {c.subtitle}
          </p>
        </div>

        <div className="space-y-10">
          {c.sections.map((section, index) => (
            <section key={index}>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                {section.title}
              </h2>
              {section.content ? (
                <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {section.content}
                </p>
              ) : (
                <ul className="space-y-3" style={{ color: 'var(--text-secondary)' }}>
                  {section.items?.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-3">
                      <span style={{ color: 'var(--primary)', marginTop: '2px' }}>•</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {c.lastUpdated}
          </p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold transition-colors"
            style={{ color: 'var(--primary)' }}
          >
            {c.backHome}
          </Link>
        </div>
      </main>
    </div>
  )
}
