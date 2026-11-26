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
      subtitle: 'This policy explains how Nazeer Business (NazBiz) processes business and customer data to provide inbox, AI, automation, and commerce features.',
      lastUpdated: 'Last updated: November 26, 2026',
      backHome: 'Back to Platform',
      contactUs: 'Questions? Reach out to privacy@nazbiz.io',
      sections: [
        {
          id: 'who-we-are',
          icon: <ShieldCheck className="w-5 h-5 text-brand" />,
          title: '1. Who we are',
          content: `Arabic registered name: مؤسسة نزير صالح خشيم لتقنية المعلومات\n\nNazeer Business ("NazBiz", "we", "us", "our") is an AI-powered customer messaging platform at nazbiz.io. It is operated by Nazir Saleh Khashim Establishment for Information Technology, Commercial Registration No. 7055562016, Al Shuraibat District, Madinah, Saudi Arabia. We act as a data processor for the customer messages our business customers ("Merchants") connect to the platform, and as a data controller for Merchant account data. Contact: privacy@nazbiz.io.`
        },
        {
          id: 'data-collection',
          icon: <Lock className="w-5 h-5 text-ai-accent" />,
          title: '2. Data we collect',
          items: [
            'Account data: name, email address, password hash, and business settings.',
            'Business knowledge base: product catalogs, FAQs, policies and instructions the Merchant provides.',
            'Channel access tokens: authorization tokens for Meta (Facebook and Instagram), WhatsApp, TikTok, Telegram, Gmail, Salla, Shopify and WooCommerce. Tokens are encrypted at rest.',
            'Message data: incoming and outgoing customer messages and comments, sender display name and channel identifier, and media sent in conversations.',
            'Store data: orders, products, shipping status and customer contact details from connected stores, only as needed for replies the Merchant enables.',
            'Technical data: IP address, browser details, session times and system health metrics.'
          ]
        },
        {
          id: 'how-we-use-data',
          icon: <Sparkles className="w-5 h-5 text-info" />,
          title: '3. How we use data',
          items: [
            "Show conversations in the Merchant's unified inbox and send replies the Merchant (or the Merchant's configured bot) triggers.",
            "Generate AI replies from the Merchant's knowledge base and connected store data.",
            'Run workflows, sequences and campaigns the Merchant configures.',
            'Secure the platform, prevent abuse and measure performance.'
          ],
          note: 'We do not sell personal data. We do not use customer messages or platform data from Meta, TikTok, Google or Salla to train public AI models, to build advertising profiles, or for purposes unrelated to providing the service to the Merchant.'
        },
        {
          id: 'meta',
          icon: <Globe className="w-5 h-5 text-emerald-400" />,
          title: '4. Meta (Facebook, Instagram, Messenger)',
          content: `When a Merchant connects a Facebook Page or Instagram professional account, we receive, through the official Meta APIs and only after the Merchant authorizes it, the Page or account profile, messages sent to that Page or account, and comments on its posts. We use this only to show those conversations in the inbox and to send replies and comment responses that the Merchant or the Merchant's configured automation triggers. We never send unsolicited messages. We follow Meta's Platform Terms and messaging policies, including the messaging window rules. The Merchant can disconnect the Page at any time in the dashboard and can remove our access in Facebook or Instagram settings.`
        },
        {
          id: 'tiktok',
          icon: <Globe className="w-5 h-5 text-brand" />,
          title: '5. TikTok',
          content: `When a business owner connects a TikTok Business account through TikTok's official authorization (OAuth), we access, with the scopes the owner approves, the account's basic profile, its comments, and its direct messages. We use this data only to display conversations and comments in the Merchant's inbox and to send replies or manage comments the Merchant or the Merchant's configured automation triggers. We store TikTok access tokens encrypted. We do not sell TikTok data, share it with advertisers or data brokers, or use it to train public AI models. The owner can disconnect TikTok at any time in the dashboard, which stops access and deletes the stored token. The owner can also revoke access in TikTok. To request deletion of TikTok data we hold, email privacy@nazbiz.io; we complete deletion within 30 days.`
        },
        {
          id: 'commerce',
          icon: <Globe className="w-5 h-5 text-info" />,
          title: '6. Salla, Shopify and WooCommerce',
          content: `When a Merchant installs our app on a Salla store, or connects Shopify or WooCommerce, we receive the store information, products, orders, shipping status and customer details the Merchant authorizes. We use them to answer customer questions about orders, shipping and stock, and to keep the product catalog current in the Merchant's knowledge base. Order actions occur only when the Merchant enables them. If the Merchant uninstalls the app or disconnects the store, we stop syncing and delete the store's stored tokens, and we delete the remaining store data on request or within the retention period below.`
        },
        {
          id: 'google',
          icon: <Lock className="w-5 h-5 text-amber-400" />,
          title: '7. Google user data (Gmail)',
          content: `If a Merchant connects Gmail, we access the messages the Merchant authorizes only to show customer emails in the inbox and to draft or send replies on the Merchant's behalf. Our use of information received from Google APIs follows the Google API Services User Data Policy, including the Limited Use requirements. We do not use Gmail data for advertising or to train generalized AI models, and no humans read it except where the Merchant asks for support, for security investigation, or where law requires.`
        },
        {
          id: 'providers',
          icon: <Globe className="w-5 h-5 text-emerald-400" />,
          title: '8. Service providers and where data is processed',
          intro: 'We use these providers to run the service. Each receives only the data needed for its function.',
          items: [
            'Hosting: Hostinger.',
            'AI providers, when enabled by the Merchant: Google (Gemini), Groq, OpenAI and Anthropic. Message text, relevant business context and media submitted for analysis may be sent to the configured provider to produce a reply.',
            'Real-time updates and email delivery: Pusher and the configured email service.',
            'Payments: Paymob or MyFatoorah. We do not store raw card numbers.',
            'Legacy WhatsApp session connection: Evolution API, for Merchants who use that option.'
          ],
          note: 'Because some providers are outside Saudi Arabia and Egypt, personal data may be transferred internationally. We transfer data only to providers that give contractual protection for it.'
        },
        {
          id: 'security',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
          title: '9. Security',
          items: [
            'Access tokens and channel credentials are encrypted at rest. Passwords are stored as hashes.',
            'Connections use HTTPS.',
            "Each Merchant's data is logically isolated from other Merchants.",
            'We limit staff access to what is needed to run and support the service.'
          ]
        },
        {
          id: 'retention',
          icon: <Eye className="w-5 h-5 text-brand" />,
          title: '10. Retention and deletion',
          content: `By default we keep messages for 365 days and inbound media for 30 days. Merchants can change these periods in Privacy & Data settings. When an account is deleted, we delete its data within 30 days, except what the law requires us to keep. Data you sent to a connected provider is also subject to that provider's own retention rules.`
        },
        {
          id: 'rights',
          icon: <ShieldCheck className="w-5 h-5 text-info" />,
          title: '11. Your rights',
          content: `You can access and export your data, correct it, and ask us to delete it. End customers whose messages a Merchant processes should contact that Merchant first; we will help the Merchant respond. Send requests to privacy@nazbiz.io. We respond within 30 days. Our processing follows the Saudi Personal Data Protection Law where it applies.`
        },
        {
          id: 'children',
          icon: <ShieldCheck className="w-5 h-5 text-amber-400" />,
          title: '12. Children',
          content: `The service is for businesses and is not directed at children under 18.`
        },
        {
          id: 'changes',
          icon: <Sparkles className="w-5 h-5 text-brand" />,
          title: '13. Changes',
          content: `We will update the date above when this policy changes and notify Merchants of material changes by email or in the dashboard.`
        },
        {
          id: 'contact',
          icon: <Globe className="w-5 h-5 text-emerald-400" />,
          title: '14. Contact',
          content: `Nazir Saleh Khashim Establishment for Information Technology, Al Shuraibat District, Madinah, Saudi Arabia. CR 7055562016. privacy@nazbiz.io | support@nazbiz.io`
        }
      ]
    },
    ar: {
      title: 'سياسة الخصوصية',
      badge: 'حماية وأمان البيانات',
      subtitle: 'توضح هذه السياسة كيف تعالج نذير للأعمال (NazBiz) بيانات الأعمال والعملاء لتوفير صندوق الوارد، الذكاء الاصطناعي، الأتمتة، وميزات التجارة الإلكترونية.',
      lastUpdated: 'آخر تحديث: 26 نوفمبر 2026',
      backHome: 'العودة إلى المنصة',
      contactUs: 'لديك استفسار؟ تواصل معنا عبر privacy@nazbiz.io',
      sections: [
        {
          id: 'who-we-are',
          icon: <ShieldCheck className="w-5 h-5 text-brand" />,
          title: '1. من نحن',
          content: `الاسم المسجل بالعربية: مؤسسة نزير صالح خشيم لتقنية المعلومات\n\nنذير للأعمال ("NazBiz"، "نحن") هي منصة مراسلة عملاء مدعومة بالذكاء الاصطناعي على nazbiz.io، وتُدار بواسطة مؤسسة نزير صالح خشيم لتقنية المعلومات، سجل تجاري رقم 7055562016، حي الشريبات، المدينة المنورة، المملكة العربية السعودية. نعمل كمعالج بيانات لرسائل العملاء التي يربطها عملاؤنا التجاريون ("التجار") بالمنصة، وكمتحكم في بيانات حساب التاجر. للتواصل: privacy@nazbiz.io.`
        },
        {
          id: 'data-collection',
          icon: <Lock className="w-5 h-5 text-ai-accent" />,
          title: '2. البيانات التي نجمعها',
          items: [
            'بيانات الحساب: الاسم، البريد الإلكتروني، كلمة المرور المشفرة، وإعدادات النشاط التجاري.',
            'قاعدة المعرفة: كتالوجات المنتجات، الأسئلة الشائعة، السياسات والتعليمات التي يقدمها التاجر.',
            'رموز وصول القنوات: رموز التفويض لمنصات Meta (فيسبوك وإنستغرام)، واتساب، تيك توك، تيليجرام، جيميل، سلة، شوبيفاي وWooCommerce. يتم تشفير جميع الرموز أثناء التخزين.',
            'بيانات الرسائل: رسائل وتعليقات العملاء الواردة والصادرة، اسم المرسل ومعرف القناة، والوسائط المرسلة في المحادثات.',
            'بيانات المتجر: الطلبات، المنتجات، حالة الشحن وبيانات تواصل العملاء من المتاجر المرتبطة، فقط بالقدر اللازم للردود التي يفعّلها التاجر.',
            'البيانات التقنية: عنوان IP، تفاصيل المتصفح، أوقات الجلسات ومقاييس صحة النظام.'
          ]
        },
        {
          id: 'how-we-use-data',
          icon: <Sparkles className="w-5 h-5 text-info" />,
          title: '3. كيف نستخدم البيانات',
          items: [
            'عرض المحادثات في صندوق الوارد الموحد للتاجر وإرسال الردود التي يطلقها التاجر (أو البوت المُعد من قِبله).',
            'توليد ردود الذكاء الاصطناعي من قاعدة معرفة التاجر وبيانات المتجر المرتبط.',
            'تشغيل مسارات العمل والتسلسلات والحملات التي يُعدّها التاجر.',
            'تأمين المنصة ومنع إساءة الاستخدام وقياس الأداء.'
          ],
          note: 'نحن لا نبيع البيانات الشخصية. ولا نستخدم رسائل العملاء أو بيانات المنصات من Meta أو TikTok أو Google أو سلة لتدريب نماذج ذكاء اصطناعي عامة، أو لبناء ملفات إعلانية، أو لأغراض غير متعلقة بتقديم الخدمة للتاجر.'
        },
        {
          id: 'meta',
          icon: <Globe className="w-5 h-5 text-emerald-400" />,
          title: '4. Meta (فيسبوك، إنستغرام، ماسنجر)',
          content: `عندما يربط التاجر صفحة فيسبوك أو حساب إنستغرام احترافي، نستلم عبر واجهات Meta الرسمية وفقط بعد تفويض التاجر، ملف الصفحة أو الحساب، والرسائل المرسلة إليها، والتعليقات على منشوراتها. نستخدم هذه البيانات فقط لعرض المحادثات في صندوق الوارد وإرسال الردود التي يطلقها التاجر أو أتمتته. لا نرسل رسائل غير مرغوب فيها أبداً، ونلتزم بشروط وسياسات Meta بما في ذلك قواعد نافذة المراسلة. يمكن للتاجر فصل الصفحة في أي وقت من لوحة التحكم وإزالة صلاحياتنا من إعدادات فيسبوك أو إنستغرام.`
        },
        {
          id: 'tiktok',
          icon: <Globe className="w-5 h-5 text-brand" />,
          title: '5. TikTok',
          content: `عندما يربط مالك النشاط التجاري حساب TikTok Business عبر التفويض الرسمي (OAuth)، نصل ضمن الصلاحيات الموافق عليها إلى الملف الأساسي للحساب وتعليقاته ورسائله المباشرة. نستخدم هذه البيانات فقط لعرض المحادثات والتعليقات في صندوق الوارد وإرسال الردود أو إدارة التعليقات التي يطلقها التاجر أو أتمتته. نخزن رموز وصول TikTok مشفرة، ولا نبيع بيانات TikTok أو نشاركها مع معلنين أو وسطاء بيانات أو نستخدمها لتدريب نماذج ذكاء اصطناعي عامة. يمكن للمالك فصل الحساب في أي وقت من لوحة التحكم أو إلغاء الصلاحية من TikTok. لطلب حذف بيانات TikTok لدينا، راسل privacy@nazbiz.io وسنكمل الحذف خلال 30 يوماً.`
        },
        {
          id: 'commerce',
          icon: <Globe className="w-5 h-5 text-info" />,
          title: '6. سلة، شوبيفاي وWooCommerce',
          content: `عند تثبيت تطبيقنا على متجر سلة أو ربط شوبيفاي أو WooCommerce، نستلم معلومات المتجر والمنتجات والطلبات وحالة الشحن وبيانات العملاء التي يفوضها التاجر. نستخدمها للإجابة على أسئلة العملاء حول الطلبات والشحن والمخزون وتحديث كتالوج المنتجات في قاعدة المعرفة. لا تُنفذ إجراءات الطلبات إلا عندما يفعّلها التاجر. عند إلغاء التثبيت أو فصل المتجر نوقف المزامنة ونحذف الرموز المخزنة، ونحذف بقية بيانات المتجر عند الطلب أو ضمن فترة الاحتفاظ أدناه.`
        },
        {
          id: 'google',
          icon: <Lock className="w-5 h-5 text-amber-400" />,
          title: '7. بيانات مستخدمي Google (Gmail)',
          content: `إذا ربط التاجر حساب Gmail، نصل إلى الرسائل المفوضة فقط لعرض رسائل العملاء في صندوق الوارد وصياغة أو إرسال الردود نيابة عن التاجر. يلتزم استخدامنا للمعلومات المستلمة من واجهات Google بسياسة بيانات مستخدمي خدمات Google API بما في ذلك متطلبات الاستخدام المحدود. لا نستخدم بيانات Gmail للإعلانات أو تدريب نماذج ذكاء اصطناعي عامة، ولا يطلع عليها أي شخص بشري إلا عند طلب التاجر للدعم أو للتحقيق الأمني أو بموجب القانون.`
        },
        {
          id: 'providers',
          icon: <Globe className="w-5 h-5 text-emerald-400" />,
          title: '8. مزودو الخدمة ومكان معالجة البيانات',
          intro: 'نستخدم المزودين التاليين لتشغيل الخدمة، ويتلقى كل منهم فقط البيانات اللازمة لوظيفته:',
          items: [
            'الاستضافة: Hostinger.',
            'مزودو الذكاء الاصطناعي عند تفعيلهم من التاجر: Google (Gemini)، Groq، OpenAI وAnthropic. قد يُرسل نص الرسالة وسياق العمل ذو الصلة والوسائط المرسلة للتحليل لإنتاج الرد.',
            'التحديثات الفورية وإرسال البريد: Pusher وخدمة البريد الإلكتروني المُعدة.',
            'المدفوعات: Paymob أو MyFatoorah. لا نخزن أرقام البطاقات الخام.',
            'اتصال واتساب التقليدي: Evolution API للتجار الذين يستخدمون هذا الخيار.'
          ],
          note: 'نظراً لوجود بعض المزودين خارج المملكة العربية السعودية ومصر، قد تُنقل البيانات الشخصية دولياً فقط إلى مزودين يوفرون حماية تعاقدية لها.'
        },
        {
          id: 'security',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
          title: '9. الأمان',
          items: [
            'يتم تشفير رموز الوصول وبيانات اعتماد القنوات أثناء التخزين، وتُحفظ كلمات المرور كقيم مجزأة (Hashes).',
            'تستخدم جميع الاتصالات بروتوكول HTTPS.',
            'بيانات كل تاجر معزولة منطقياً عن بقية التجار.',
            'نقيّد وصول الموظفين إلى الحد الأدنى اللازم لتشغيل ودعم الخدمة.'
          ]
        },
        {
          id: 'retention',
          icon: <Eye className="w-5 h-5 text-brand" />,
          title: '10. الاحتفاظ بالبيانات والحذف',
          content: `بشكل افتراضي نحتفظ بالرسائل لمدة 365 يوماً والوسائط الواردة لمدة 30 يوماً، ويمكن للتاجر تعديل هذه المدد من إعدادات الخصوصية والبيانات. عند حذف الحساب نحذف بياناته خلال 30 يوماً باستثناء ما يوجب القانون الاحتفاظ به.`
        },
        {
          id: 'rights',
          icon: <ShieldCheck className="w-5 h-5 text-info" />,
          title: '11. حقوقك',
          content: `يمكنك الوصول إلى بياناتك وتصديرها وتصحيحها وطلب حذفها. يجب على العملاء النهائيين التواصل مع التاجر المعني أولاً وسنساعد التاجر في الاستجابة. أرسل الطلبات إلى privacy@nazbiz.io ونرد خلال 30 يوماً. تخضع معالجتنا لنظام حماية البيانات الشخصية السعودي حيثما ينطبق.`
        },
        {
          id: 'children',
          icon: <ShieldCheck className="w-5 h-5 text-amber-400" />,
          title: '12. الأطفال',
          content: `الخدمة مخصصة للأعمال التجارية وليست موجهة لمن هم دون 18 عاماً.`
        },
        {
          id: 'changes',
          icon: <Sparkles className="w-5 h-5 text-brand" />,
          title: '13. التغييرات',
          content: `سنحدّث التاريخ أعلاه عند تغيير هذه السياسة ونخطر التجار بالتغييرات الجوهرية عبر البريد الإلكتروني أو لوحة التحكم.`
        },
        {
          id: 'contact',
          icon: <Globe className="w-5 h-5 text-emerald-400" />,
          title: '14. التواصل',
          content: `مؤسسة نزير صالح خشيم لتقنية المعلومات، حي الشريبات، المدينة المنورة، المملكة العربية السعودية. سجل تجاري 7055562016. privacy@nazbiz.io | support@nazbiz.io`
        }
      ]
    }
  }

  const active = content[lang]

  return (
    <div className="min-h-screen bg-bg text-text-primary selection:bg-brand/20 selection:text-brand" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-text-secondary hover:text-brand transition-colors">
            {lang === 'ar' ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            <span>{active.backHome}</span>
          </Link>
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-xs font-bold text-text-primary hover:border-brand/50 transition-all"
          >
            <Globe size={14} className="text-brand" />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-20">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3.5 py-1 text-xs font-bold text-brand">
            <ShieldCheck size={14} />
            <span>{active.badge}</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{active.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-text-secondary leading-relaxed">
            {active.subtitle}
          </p>
          <p className="mt-3 text-xs font-medium text-text-tertiary">{active.lastUpdated}</p>
        </div>

        <div className="space-y-8">
          {active.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="rounded-2xl border border-border bg-surface-elevated/40 p-6 sm:p-8 transition-all hover:border-border-hover"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface">
                  {section.icon}
                </div>
                <h2 className="text-xl font-bold tracking-tight">{section.title}</h2>
              </div>

              {section.content && (
                <p className="whitespace-pre-line text-sm sm:text-base leading-relaxed text-text-secondary">
                  {section.content}
                </p>
              )}

              {section.intro && (
                <p className="mb-4 text-sm sm:text-base leading-relaxed text-text-secondary">
                  {section.intro}
                </p>
              )}

              {section.items && (
                <ul className="space-y-3">
                  {section.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm sm:text-base leading-relaxed text-text-secondary">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {section.note && (
                <p className="mt-4 rounded-xl border border-border bg-surface/60 p-4 text-xs sm:text-sm leading-relaxed text-text-secondary">
                  {section.note}
                </p>
              )}
            </section>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-border bg-surface-elevated/60 p-6 text-center">
          <p className="text-sm font-medium text-text-secondary">{active.contactUs}</p>
        </div>
      </main>
    </div>
  )
}
