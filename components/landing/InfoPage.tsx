'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Mail, ShieldCheck, Sparkles } from 'lucide-react'
import Navbar from './Navbar'
import Footer from './Footer'
import { useLang } from '../../lib/LangContext'

type Section = { title: string; body: string; bullets?: string[]; links?: { label: string; href: string }[] }
type PageCopy = { eyebrow: string; title: string; intro: string; sections: Section[] }

const pages: Record<string, { en: PageCopy; ar: PageCopy }> = {
  integrations: {
    en: { eyebrow: 'Platform', title: 'Connect the tools your business already uses', intro: 'Bring customer conversations and commerce data together in one workspace. Connect the accounts you need and assign them to the right AI agent.', sections: [
      { title: 'Messaging and social', body: 'Connect supported customer communication accounts and manage them from the Channels page.', bullets: ['Instagram professional accounts', 'Facebook Pages and Messenger', 'WhatsApp Business', 'Telegram bots', 'Gmail and Google Workspace'] },
      { title: 'Commerce', body: 'Connect one or more stores and let agents use the assigned store context for product and order conversations.', bullets: ['Salla', 'Shopify', 'WooCommerce'] },
      { title: 'Set up your connections', body: 'Sign in to NazBiz to connect accounts, check their status, and configure agent assignments.', links: [{ label: 'Open Channels', href: '/dashboard/channels' }, { label: 'Explore product features', href: '/#features' }] },
    ] },
    ar: { eyebrow: 'المنصة', title: 'اربط الأدوات التي يستخدمها نشاطك', intro: 'اجمع محادثات العملاء وبيانات التجارة في مساحة عمل واحدة. اربط الحسابات التي تحتاجها وأسندها إلى وكيل الذكاء الاصطناعي المناسب.', sections: [
      { title: 'المراسلة والتواصل الاجتماعي', body: 'اربط حسابات التواصل المدعومة وأدرها من صفحة القنوات.', bullets: ['حسابات إنستغرام الاحترافية', 'صفحات فيسبوك وماسنجر', 'واتساب للأعمال', 'بوتات تيليجرام', 'Gmail وGoogle Workspace'] },
      { title: 'التجارة الإلكترونية', body: 'اربط متجراً واحداً أو أكثر، وحدد سياق المتجر الذي يستخدمه كل وكيل للإجابة عن المنتجات والطلبات.', bullets: ['سلة', 'Shopify', 'WooCommerce'] },
      { title: 'ابدأ إعداد التكاملات', body: 'سجّل الدخول لربط الحسابات ومراجعة حالتها وإعداد تعيين الوكلاء.', links: [{ label: 'فتح صفحة القنوات', href: '/dashboard/channels' }, { label: 'استكشف مزايا المنتج', href: '/#features' }] },
    ] },
  },
  security: {
    en: { eyebrow: 'Trust & security', title: 'Security is part of every connection', intro: 'NazBiz is built to help teams manage customer communication with clear account access, provider authorization, and privacy controls.', sections: [
      { title: 'Account and connection access', body: 'Only connect accounts you are authorized to manage. Provider authorization screens show the access requested by each integration.' },
      { title: 'Privacy and data controls', body: 'Review how account, message, and integration data is handled, and use the available export and retention controls.', links: [{ label: 'Read the Privacy Policy', href: '/privacy' }, { label: 'Review Terms of Service', href: '/terms' }] },
      { title: 'Security questions', body: 'For security or data-protection questions, contact the team directly.', links: [{ label: 'Contact privacy support', href: 'mailto:privacy@nazbiz.io' }] },
    ] },
    ar: { eyebrow: 'الثقة والأمان', title: 'الأمان جزء من كل اتصال', intro: 'صُممت NazBiz لمساعدة الفرق على إدارة تواصل العملاء مع وضوح صلاحيات الحسابات وتفويض مزودي الخدمة وأدوات الخصوصية.', sections: [
      { title: 'صلاحيات الحساب والاتصال', body: 'اربط فقط الحسابات المصرح لك بإدارتها. تعرض شاشات التفويض لدى المزود الصلاحيات المطلوبة لكل تكامل.' },
      { title: 'الخصوصية والتحكم بالبيانات', body: 'راجع كيفية التعامل مع بيانات الحسابات والرسائل والتكاملات، واستخدم خيارات التصدير والاحتفاظ المتاحة.', links: [{ label: 'اقرأ سياسة الخصوصية', href: '/privacy' }, { label: 'راجع شروط الخدمة', href: '/terms' }] },
      { title: 'استفسارات الأمان', body: 'للاستفسار عن الأمان أو حماية البيانات، تواصل مع الفريق مباشرة.', links: [{ label: 'تواصل مع دعم الخصوصية', href: 'mailto:privacy@nazbiz.io' }] },
    ] },
  },
  about: {
    en: { eyebrow: 'About NazBiz', title: 'A clearer way to run customer conversations', intro: 'NazBiz brings supported communication channels, AI agents, automation, and connected commerce into one workspace for growing businesses.', sections: [
      { title: 'One workspace for customer operations', body: 'Teams can organize conversations, train agents with business knowledge, connect stores, and coordinate follow-ups from a single dashboard.' },
      { title: 'AI with business context', body: 'Agents can use configured instructions and connected business data to help answer customer questions. Merchants stay in control of channel access and automation settings.' },
      { title: 'Explore NazBiz', body: 'See how the platform fits your current tools and workflow.', links: [{ label: 'View features', href: '/#features' }, { label: 'See integrations', href: '/integrations' }, { label: 'Contact us', href: '/contact' }] },
    ] },
    ar: { eyebrow: 'عن NazBiz', title: 'طريقة أوضح لإدارة محادثات العملاء', intro: 'تجمع NazBiz قنوات التواصل المدعومة ووكلاء الذكاء الاصطناعي والأتمتة والتجارة المتصلة في مساحة عمل واحدة للأنشطة النامية.', sections: [
      { title: 'مساحة واحدة لعمليات خدمة العملاء', body: 'يمكن للفرق تنظيم المحادثات وتدريب الوكلاء على معرفة النشاط وربط المتاجر وتنسيق المتابعات من لوحة تحكم واحدة.' },
      { title: 'ذكاء اصطناعي يفهم نشاطك', body: 'يستخدم الوكلاء التعليمات المهيأة وبيانات النشاط المتصلة للمساعدة في الإجابة عن أسئلة العملاء، مع احتفاظ التاجر بالتحكم في صلاحيات القنوات وإعدادات الأتمتة.' },
      { title: 'اكتشف NazBiz', body: 'تعرّف على طريقة توافق المنصة مع أدواتك وسير عملك الحالي.', links: [{ label: 'استعرض المزايا', href: '/#features' }, { label: 'عرض التكاملات', href: '/integrations' }, { label: 'تواصل معنا', href: '/contact' }] },
    ] },
  },
  careers: {
    en: { eyebrow: 'Careers', title: 'Help shape better customer experiences', intro: 'We are building practical AI tools for teams that serve customers across channels. If you are interested in working with NazBiz, tell us about your experience.', sections: [
      { title: 'Get in touch', body: 'Send your résumé and a short introduction. We will reply if a suitable opportunity is available.', links: [{ label: 'Email careers@nazbiz.io', href: 'mailto:careers@nazbiz.io?subject=Careers%20at%20NazBiz' }] },
    ] },
    ar: { eyebrow: 'الوظائف', title: 'ساهم في تحسين تجارب العملاء', intro: 'نبني أدوات ذكاء اصطناعي عملية للفرق التي تخدم العملاء عبر قنوات متعددة. إذا كنت مهتماً بالعمل مع NazBiz، أخبرنا عن خبرتك.', sections: [
      { title: 'تواصل معنا', body: 'أرسل سيرتك الذاتية ونبذة قصيرة عنك، وسنرد إذا توفرت فرصة مناسبة.', links: [{ label: 'راسل careers@nazbiz.io', href: 'mailto:careers@nazbiz.io?subject=Careers%20at%20NazBiz' }] },
    ] },
  },
  contact: {
    en: { eyebrow: 'Contact', title: 'Talk to the NazBiz team', intro: 'Have a product, setup, or account question? Send us a message and include the email address associated with your workspace so we can help faster.', sections: [
      { title: 'Customer and product support', body: 'For help with setup, channels, billing, or account access, email our support team.', links: [{ label: 'Email support@nazbiz.io', href: 'mailto:support@nazbiz.io' }] },
      { title: 'Privacy requests', body: 'For privacy or data requests, contact the privacy team.', links: [{ label: 'Email privacy@nazbiz.io', href: 'mailto:privacy@nazbiz.io' }] },
    ] },
    ar: { eyebrow: 'تواصل معنا', title: 'تواصل مع فريق NazBiz', intro: 'هل لديك سؤال عن المنتج أو الإعداد أو حسابك؟ أرسل لنا رسالة وأرفق البريد المرتبط بمساحة عملك لنتمكن من مساعدتك بسرعة.', sections: [
      { title: 'دعم العملاء والمنتج', body: 'للمساعدة في الإعداد أو القنوات أو الفوترة أو الدخول إلى الحساب، راسل فريق الدعم.', links: [{ label: 'راسل support@nazbiz.io', href: 'mailto:support@nazbiz.io' }] },
      { title: 'طلبات الخصوصية', body: 'لطلبات الخصوصية أو البيانات، تواصل مع فريق الخصوصية.', links: [{ label: 'راسل privacy@nazbiz.io', href: 'mailto:privacy@nazbiz.io' }] },
    ] },
  },
  'help-center': {
    en: { eyebrow: 'Help center', title: 'Find your way around NazBiz', intro: 'Start with these common setup steps. Sign in to your workspace to manage channels, agents, and automations.', sections: [
      { title: 'Connect a channel', body: 'Open Channels, choose an integration, and follow the provider authorization steps. Check the connection status when you return.', links: [{ label: 'Open Channels', href: '/dashboard/channels' }] },
      { title: 'Create an AI agent', body: 'Create an agent, configure its instructions and knowledge, then assign the channels and commerce connections it may use.', links: [{ label: 'Open AI agents', href: '/dashboard/bots' }] },
      { title: 'Need more help?', body: 'Email support with your workspace email and a description of the issue.', links: [{ label: 'Contact support', href: '/contact' }] },
    ] },
    ar: { eyebrow: 'مركز المساعدة', title: 'ابدأ استخدام NazBiz', intro: 'ابدأ بخطوات الإعداد الشائعة. سجّل الدخول إلى مساحة عملك لإدارة القنوات والوكلاء والأتمتة.', sections: [
      { title: 'ربط قناة', body: 'افتح صفحة القنوات واختر التكامل واتبع خطوات التفويض لدى المزود. راجع حالة الاتصال بعد العودة.', links: [{ label: 'فتح القنوات', href: '/dashboard/channels' }] },
      { title: 'إنشاء وكيل ذكاء اصطناعي', body: 'أنشئ وكيلاً واضبط تعليماته ومعرفته، ثم عيّن القنوات واتصالات التجارة التي يمكنه استخدامها.', links: [{ label: 'فتح الوكلاء', href: '/dashboard/bots' }] },
      { title: 'هل تحتاج إلى مساعدة؟', body: 'راسل الدعم باستخدام بريد مساحة عملك واشرح المشكلة.', links: [{ label: 'تواصل مع الدعم', href: '/contact' }] },
    ] },
  },
  docs: {
    en: { eyebrow: 'Documentation', title: 'Practical setup guides', intro: 'Use these guides to configure the core NazBiz workspace. Provider-specific permissions and features may vary by account and provider.', sections: [
      { title: '1. Prepare your workspace', body: 'Create or select a business workspace, then connect the communication accounts you want to manage.', links: [{ label: 'Open Settings', href: '/dashboard/settings' }, { label: 'Open Channels', href: '/dashboard/channels' }] },
      { title: '2. Configure an agent', body: 'Set the agent’s instructions, business knowledge, and supported AI provider. Assign only the channels and commerce connections it should handle.', links: [{ label: 'Open AI agents', href: '/dashboard/bots' }, { label: 'Open AI Knowledge', href: '/dashboard/ai-knowledge' }] },
      { title: '3. Build automation carefully', body: 'Create sequences or workflows, review their trigger and audience, then activate them when your configuration is ready.', links: [{ label: 'Open Sequences', href: '/dashboard/sequences' }, { label: 'Open Workflows', href: '/dashboard/workflows' }] },
      { title: 'Questions', body: 'If a setup step does not match your provider screen, contact support with a screenshot and workspace email.', links: [{ label: 'Contact support', href: '/contact' }] },
    ] },
    ar: { eyebrow: 'الوثائق', title: 'أدلة إعداد عملية', intro: 'استخدم هذه الأدلة لإعداد مساحة عمل NazBiz. قد تختلف الأذونات والميزات الخاصة بكل مزود بحسب الحساب والمنصة.', sections: [
      { title: '1. إعداد مساحة العمل', body: 'أنشئ مساحة عمل لنشاطك أو اختر واحدة، ثم اربط حسابات التواصل التي تريد إدارتها.', links: [{ label: 'فتح الإعدادات', href: '/dashboard/settings' }, { label: 'فتح القنوات', href: '/dashboard/channels' }] },
      { title: '2. إعداد وكيل', body: 'أدخل تعليمات الوكيل ومعرفة النشاط واختر مزود الذكاء الاصطناعي المدعوم. عيّن له القنوات واتصالات التجارة المطلوبة فقط.', links: [{ label: 'فتح الوكلاء', href: '/dashboard/bots' }, { label: 'فتح معرفة الذكاء الاصطناعي', href: '/dashboard/ai-knowledge' }] },
      { title: '3. إنشاء الأتمتة', body: 'أنشئ تسلسلاً أو سير عمل وراجع المشغّل والجمهور المستهدف، ثم فعّله بعد التأكد من الإعداد.', links: [{ label: 'فتح التسلسلات', href: '/dashboard/sequences' }, { label: 'فتح سير العمل', href: '/dashboard/workflows' }] },
      { title: 'الاستفسارات', body: 'إذا اختلفت خطوات الإعداد عن شاشة المزود لديك، تواصل مع الدعم وأرفق صورة الشاشة وبريد مساحة العمل.', links: [{ label: 'تواصل مع الدعم', href: '/contact' }] },
    ] },
  },
  status: {
    en: { eyebrow: 'System status', title: 'Service status and support', intro: 'This page is the public contact point for service-status questions. It does not currently display a live incident feed or component telemetry.', sections: [
      { title: 'Need to report an issue?', body: 'If you cannot access NazBiz or a feature is unavailable, email support with the affected page, approximate time, and workspace email.', links: [{ label: 'Contact support', href: 'mailto:support@nazbiz.io?subject=Service%20status%20question' }] },
      { title: 'Check your workspace', body: 'If you can sign in, the admin system-health page can show operational information available to your account.', links: [{ label: 'Open system health', href: '/dashboard/admin/system-health' }] },
    ] },
    ar: { eyebrow: 'حالة النظام', title: 'حالة الخدمة والدعم', intro: 'هذه الصفحة هي نقطة التواصل العامة للاستفسار عن حالة الخدمة. لا تعرض الصفحة حالياً موجزاً مباشراً للحوادث أو بيانات تشغيل المكونات.', sections: [
      { title: 'هل تريد الإبلاغ عن مشكلة؟', body: 'إذا تعذر عليك الدخول إلى NazBiz أو لم تعمل ميزة ما، راسل الدعم مع ذكر الصفحة ووقت المشكلة التقريبي وبريد مساحة العمل.', links: [{ label: 'تواصل مع الدعم', href: 'mailto:support@nazbiz.io?subject=Service%20status%20question' }] },
      { title: 'تحقق من مساحة عملك', body: 'إذا تمكنت من تسجيل الدخول، تعرض صفحة صحة النظام معلومات التشغيل المتاحة لحسابك.', links: [{ label: 'فتح صحة النظام', href: '/dashboard/admin/system-health' }] },
    ] },
  },
}

export default function InfoPage({ slug }: { slug: string }) {
  const { isRTL } = useLang()
  const page = pages[slug]
  if (!page) return null
  const copy = isRTL ? page.ar : page.en
  const BackIcon = isRTL ? ArrowRight : ArrowLeft

  return <main dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen text-text-primary">
    <Navbar />
    <section className="relative overflow-hidden px-5 pb-16 pt-32 sm:px-8 sm:pt-40">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-gradient-to-b from-brand/10 via-transparent to-transparent" />
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-brand"><BackIcon size={16} />{isRTL ? 'العودة إلى الصفحة الرئيسية' : 'Back to home'}</Link>
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3 py-1.5 text-xs font-semibold text-brand"><Sparkles size={14} />{copy.eyebrow}</p>
        <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">{copy.title}</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-text-secondary sm:text-lg">{copy.intro}</p>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {copy.sections.map((section) => <article key={section.title} className="rounded-2xl border border-border bg-surface-card p-6 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">{slug === 'security' ? <ShieldCheck size={20} /> : slug === 'docs' || slug === 'help-center' ? <BookOpen size={20} /> : slug === 'contact' ? <Mail size={20} /> : <CheckCircle2 size={20} />}</div>
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <p className="mt-3 text-sm leading-7 text-text-secondary">{section.body}</p>
            {section.bullets && <ul className="mt-4 space-y-2 text-sm text-text-secondary">{section.bullets.map((item) => <li key={item} className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand" />{item}</li>)}</ul>}
            {section.links && <div className="mt-5 flex flex-wrap gap-3">{section.links.map((item) => <Link key={item.href + item.label} href={item.href} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-brand transition hover:border-brand/40 hover:bg-brand/5">{item.label}<ArrowLeft size={14} className={isRTL ? 'rotate-180' : ''} /></Link>)}</div>}
          </article>)}
        </div>
      </div>
    </section>
    <Footer />
  </main>
}
