'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bot,
  Check,
  CircleHelp,
  Mail,
  MessageCircle,
  MessagesSquare,
  Radio,
  Sparkles,
  Workflow,
  Zap,
} from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { useLang } from '../../lib/LangContext'

const CHANNELS = [
  { name: 'Instagram', label: 'IG', color: '#E4405F', brand: 'instagram' },
  { name: 'Facebook', label: 'f', color: '#1877F2', brand: 'facebook' },
  { name: 'WhatsApp', label: 'WA', color: '#25D366', Icon: MessageCircle },
  { name: 'Gmail', label: 'G', color: '#EA4335', Icon: Mail },
  { name: 'Telegram', label: 'TG', color: '#2AABEE', Icon: Radio },
]

const CAPABILITIES = [
  {
    eyebrow: { en: 'ONE WORKSPACE', ar: 'مساحة عمل واحدة' },
    title: { en: 'Conversations stay together.', ar: 'كل المحادثات في مكان واحد.' },
    body: { en: 'Bring connected channel conversations into a shared inbox your team can work from.', ar: 'اجمع محادثات القنوات المرتبطة في صندوق وارد مشترك لفريقك.' },
    Icon: MessagesSquare,
    accent: 'var(--brand-blue)',
  },
  {
    eyebrow: { en: 'YOUR BUSINESS CONTEXT', ar: 'معرفة نشاطك التجاري' },
    title: { en: 'Give your agent useful context.', ar: 'امنح وكيلك سياقاً يساعده.' },
    body: { en: 'Add business knowledge and instructions so AI-assisted replies can reflect how your business works.', ar: 'أضف معلومات نشاطك وتعليماته لتكون الردود المساعدة بالذكاء الاصطناعي أقرب لطريقة عملك.' },
    Icon: BookOpen,
    accent: 'var(--brand-cyan)',
  },
  {
    eyebrow: { en: 'AUTOMATIONS', ar: 'الأتمتة' },
    title: { en: 'Turn customer events into follow-up.', ar: 'حوّل تفاعلات العملاء إلى متابعة.' },
    body: { en: 'Build sequences and workflows around customer activity, with timing and actions you configure.', ar: 'أنشئ تسلسلات وسير عمل حسب تفاعل العميل، بالتوقيت والإجراءات التي تحددها.' },
    Icon: Workflow,
    accent: 'var(--brand-violet)',
  },
]

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 22, filter: 'blur(5px)' }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.68, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

function SectionHeading({
  eyebrow,
  title,
  body,
  align = 'center',
}: {
  eyebrow: string
  title: string
  body?: string
  align?: 'center' | 'start'
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl'}>
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold tracking-[0.16em]"
        style={{ borderColor: 'var(--accent-outline)', color: 'var(--accent)', background: 'var(--accent-subtle)' }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--brand-cyan)' }} />
        {eyebrow}
      </div>
      <h2 className="text-balance text-3xl font-black leading-tight tracking-[-0.045em] sm:text-4xl lg:text-5xl"
        style={{ color: 'var(--text-primary)' }}>
        {title}
      </h2>
      {body && <p className="mx-auto mt-4 max-w-2xl text-base leading-7 sm:text-lg" style={{ color: 'var(--text-secondary)' }}>{body}</p>}
    </div>
  )
}

function HeroPreview({ isRTL }: { isRTL: boolean }) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className="relative mx-auto w-full max-w-[780px] [perspective:1400px]"
      initial={reduceMotion ? false : { opacity: 0, y: 32, rotateY: isRTL ? -5 : 5, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, rotateY: 0, scale: 1 }}
      transition={{ duration: 1, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute -inset-8 rounded-[36px] blur-3xl" aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse, var(--accent-outline), transparent 68%)' }} />

      <div className="relative overflow-hidden rounded-[22px] border shadow-2xl sm:rounded-[28px]"
        style={{ borderColor: 'var(--border-strong)', background: 'var(--surface)', boxShadow: 'var(--shadow-premium)' }}>
        <div className="flex h-11 items-center gap-2 border-b px-4 sm:h-12 sm:px-5" style={{ borderColor: 'var(--border)' }}>
          <span className="h-2.5 w-2.5 rounded-full bg-error/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          <span className="ms-2 text-[10px] font-semibold tracking-wide sm:text-xs" style={{ color: 'var(--text-tertiary)' }}>NazBiz / Inbox</span>
          <span className="ms-auto inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[9px] font-semibold sm:text-[10px]" style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--brand-cyan)' }} />
            {isRTL ? 'معاينة توضيحية' : 'Illustrative preview'}
          </span>
        </div>

        <div className="relative aspect-[1.56] overflow-hidden bg-[#080B14]">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src="/video/nazbiz-conversation-loop.mp4"
            poster="/video/nazbiz-conversation-poster.jpg"
            autoPlay={!reduceMotion}
            loop
            muted
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#080B14]/65 to-transparent" />
          <div className="absolute bottom-3 start-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] backdrop-blur-md sm:bottom-5 sm:start-5 sm:text-xs"
            style={{ borderColor: 'rgba(148,163,184,.22)', background: 'rgba(8,11,20,.76)', color: '#dbeafe' }}>
            <Sparkles size={13} style={{ color: 'var(--brand-cyan)' }} />
            {isRTL ? 'محادثة توضيحية' : 'Conversation flow preview'}
          </div>
        </div>
      </div>

      <motion.div
        className="absolute -end-4 top-[14%] hidden items-center gap-2 rounded-2xl border px-3 py-2.5 shadow-xl backdrop-blur-xl sm:flex lg:-end-8"
        animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ borderColor: 'var(--border-strong)', background: 'color-mix(in srgb, var(--surface) 88%, transparent)', color: 'var(--text-secondary)' }}
      >
        <span className="grid h-8 w-8 place-items-center rounded-xl" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}><MessagesSquare size={15} /></span>
        <span className="text-[11px] font-semibold">{isRTL ? 'صندوق وارد موحد' : 'Unified inbox'}</span>
      </motion.div>

      <motion.div
        className="absolute -start-4 bottom-[15%] hidden items-center gap-2 rounded-2xl border px-3 py-2.5 shadow-xl backdrop-blur-xl sm:flex lg:-start-8"
        animate={reduceMotion ? undefined : { y: [0, 6, 0] }}
        transition={{ duration: 6.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ borderColor: 'var(--border-strong)', background: 'color-mix(in srgb, var(--surface) 88%, transparent)', color: 'var(--text-secondary)' }}
      >
        <span className="grid h-8 w-8 place-items-center rounded-xl" style={{ background: 'var(--ai-subtle)', color: 'var(--ai-accent)' }}><Bot size={15} /></span>
        <span className="text-[11px] font-semibold">{isRTL ? 'وكيلك ومعرفته' : 'Your agent + knowledge'}</span>
      </motion.div>
    </motion.div>
  )
}

function ChannelRail({ isRTL }: { isRTL: boolean }) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="relative mx-auto mt-12 max-w-5xl overflow-hidden rounded-2xl border px-4 py-4 sm:px-7 sm:py-5"
      style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface) 84%, transparent)' }}>
      <div className="absolute inset-y-1/2 start-8 end-8 hidden h-px -translate-y-1/2 md:block" style={{ background: 'linear-gradient(90deg, transparent, var(--border-strong) 18%, var(--border-strong) 82%, transparent)' }} />
      <div className="relative flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        {CHANNELS.map(({ name, label, color, Icon, brand }, index) => (
          <motion.div
            key={name}
            className="flex items-center gap-2.5 rounded-xl border px-3 py-2.5 sm:px-4"
            initial={reduceMotion ? false : { opacity: 0, y: index % 2 === 0 ? 12 : -12, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.44, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
            whileHover={reduceMotion ? undefined : { y: -3, borderColor: color }}
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)' }}
          >
            <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: `${color}14`, color }}>
              {brand === 'instagram' ? <span aria-hidden="true" className="text-[21px] leading-none">◎</span> : null}
              {brand === 'facebook' ? <span aria-hidden="true" className="pt-1 text-[24px] font-black leading-[20px]">f</span> : null}
              {!brand && Icon ? <Icon size={15} strokeWidth={2.2} aria-hidden="true" /> : null}
            </span>
            <span className="text-xs font-semibold sm:text-sm">{name}</span>
            <span className="sr-only">{label}</span>
          </motion.div>
        ))}
      </div>
      <p className="mt-4 text-center text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
        {isRTL ? 'اربط القنوات المتاحة لحسابك من صفحة القنوات.' : 'Connect the channels available to your account from Channels.'}
      </p>
    </div>
  )
}

function FlowDemo({ isRTL }: { isRTL: boolean }) {
  const reduceMotion = useReducedMotion()
  const labels = isRTL
    ? { eyebrow: 'من الرسالة إلى الرد', title: 'تجربة واضحة، وفريقك في الصورة.', question: 'هل يمكنكم مساعدتي في اختيار هدية؟', response: 'بالتأكيد، لمن ستختار الهدية؟', context: 'سياق النشاط التجاري', result: 'رد مساعد جاهز للمراجعة', caption: 'مثال توضيحي — تعتمد الردود على إعدادات الوكيل ومعلومات نشاطك.' }
    : { eyebrow: 'FROM MESSAGE TO REPLY', title: 'A clear flow, with your team in the picture.', question: 'Can you help me choose a gift?', response: 'Of course. Who are you shopping for?', context: 'Business context', result: 'AI-assisted reply', caption: 'Illustrative example. Replies depend on your agent setup and business information.' }

  return (
    <section id="how-it-works" className="relative overflow-hidden px-4 py-24 sm:px-6 lg:py-32">
      <div className="absolute start-1/2 top-1/2 h-[460px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]" aria-hidden="true" style={{ background: 'radial-gradient(ellipse, var(--ai-subtle), transparent 68%)' }} />
      <div className="relative mx-auto max-w-7xl">
        <Reveal><SectionHeading eyebrow={labels.eyebrow} title={labels.title} body={isRTL ? 'اجمع القنوات، أضف معرفة نشاطك، واترك للوكيل التعامل مع الردود التي أعددته لها.' : 'Bring channels together, add your business knowledge, and let your agent handle the replies you configure it for.'} /></Reveal>

        <div className="relative mt-14 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:gap-5">
          <Reveal delay={0.05} className="h-full">
            <motion.div whileHover={reduceMotion ? undefined : { y: -4 }} className="relative h-full overflow-hidden rounded-3xl border p-5 sm:p-7" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <div className="mb-8 flex items-center justify-between"><span className="text-xs font-bold tracking-widest" style={{ color: 'var(--text-tertiary)' }}>{isRTL ? 'رسالة العميل' : 'CUSTOMER MESSAGE'}</span><span className="rounded-full px-2.5 py-1 text-[10px]" style={{ color: '#E4405F', background: 'rgba(228,64,95,.1)' }}>Instagram</span></div>
              <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface-elevated)', color: 'var(--accent)' }}>A</span><div className="rounded-2xl rounded-ss-md border px-4 py-3 text-sm leading-6" style={{ borderColor: 'var(--border)', background: 'var(--surface-elevated)', color: 'var(--text-primary)' }}>{labels.question}</div></div>
              <div className="mt-8 flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: '#E4405F' }} />{isRTL ? 'تصل إلى صندوق الوارد' : 'Arrives in the inbox'}</div>
            </motion.div>
          </Reveal>

          <div className="hidden items-center justify-center lg:flex" aria-hidden="true">
            <motion.div className="flex items-center" animate={reduceMotion ? undefined : { x: [0, 5, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
              <span className="h-px w-7" style={{ background: 'var(--border-strong)' }} /><ArrowRight size={16} style={{ color: 'var(--accent)' }} />
            </motion.div>
          </div>

          <Reveal delay={0.14} className="h-full">
            <motion.div whileHover={reduceMotion ? undefined : { y: -4 }} className="relative h-full overflow-hidden rounded-3xl border p-5 sm:p-7" style={{ borderColor: 'var(--accent-outline)', background: 'linear-gradient(150deg, var(--surface), color-mix(in srgb, var(--ai-accent) 7%, var(--surface)))' }}>
              <div className="mb-8 flex items-center justify-between"><span className="text-xs font-bold tracking-widest" style={{ color: 'var(--text-tertiary)' }}>{isRTL ? 'سياق الوكيل' : 'AGENT CONTEXT'}</span><span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: 'var(--ai-subtle)', color: 'var(--ai-accent)' }}><Bot size={17} /></span></div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}><BookOpen size={16} style={{ color: 'var(--brand-cyan)' }} /><span className="text-sm" style={{ color: 'var(--text-primary)' }}>{labels.context}</span><Check size={15} className="ms-auto" style={{ color: 'var(--success)' }} /></div>
                <div className="flex items-center gap-2 px-2 text-xs" style={{ color: 'var(--text-tertiary)' }}><span className="h-px flex-1" style={{ background: 'var(--border)' }} /><Sparkles size={13} style={{ color: 'var(--ai-accent)' }} /><span>{isRTL ? 'تعليمات الوكيل' : 'Agent instructions'}</span><span className="h-px flex-1" style={{ background: 'var(--border)' }} /></div>
              </div>
              <motion.div className="pointer-events-none absolute inset-x-8 top-[42%] h-px" animate={reduceMotion ? undefined : { opacity: [0.25, 0.9, 0.25], scaleX: [0.84, 1, 0.84] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} style={{ background: 'linear-gradient(90deg, transparent, var(--ai-accent), transparent)' }} />
            </motion.div>
          </Reveal>

          <div className="hidden items-center justify-center lg:flex" aria-hidden="true">
            <motion.div className="flex items-center" animate={reduceMotion ? undefined : { x: [0, 5, 0] }} transition={{ duration: 2.4, delay: 0.4, repeat: Infinity, ease: 'easeInOut' }}>
              <span className="h-px w-7" style={{ background: 'var(--border-strong)' }} /><ArrowRight size={16} style={{ color: 'var(--brand-cyan)' }} />
            </motion.div>
          </div>

          <Reveal delay={0.22} className="h-full">
            <motion.div whileHover={reduceMotion ? undefined : { y: -4 }} className="relative h-full overflow-hidden rounded-3xl border p-5 sm:p-7" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <div className="mb-8 flex items-center justify-between"><span className="text-xs font-bold tracking-widest" style={{ color: 'var(--text-tertiary)' }}>{isRTL ? 'الرد' : 'REPLY'}</span><span className="rounded-full px-2.5 py-1 text-[10px]" style={{ color: 'var(--ai-accent)', background: 'var(--ai-subtle)' }}>{isRTL ? 'مساعد بالذكاء الاصطناعي' : 'AI-assisted'}</span></div>
              <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}><Sparkles size={17} /></span><motion.div initial={reduceMotion ? false : { opacity: 0, clipPath: 'inset(0 100% 0 0)' }} whileInView={reduceMotion ? undefined : { opacity: 1, clipPath: 'inset(0 0% 0 0)' }} viewport={{ once: true }} transition={{ duration: reduceMotion ? 0 : 1, delay: reduceMotion ? 0 : 0.5 }} className="rounded-2xl rounded-ss-md border px-4 py-3 text-sm leading-6" style={{ borderColor: 'var(--accent-outline)', background: 'var(--accent-subtle)', color: 'var(--text-primary)' }}>{labels.response}</motion.div></div>
              <div className="mt-8 flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--brand-cyan)' }} />{labels.result}</div>
            </motion.div>
          </Reveal>
        </div>
        <p className="mt-5 text-center text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{labels.caption}</p>
      </div>
    </section>
  )
}

function WorkflowStory({ isRTL }: { isRTL: boolean }) {
  const reduceMotion = useReducedMotion()
  const items = isRTL
    ? [{ n: '01', title: 'يصل حدث من العميل', sub: 'مثلاً: تم إرسال رسالة', Icon: MessageCircle }, { n: '02', title: 'تُطبّق شروط التسلسل', sub: 'الانتظار والإجراءات التي أعددتها', Icon: Workflow }, { n: '03', title: 'تُنفّذ الخطوة التالية', sub: 'حسب القنوات والإعدادات', Icon: Zap }]
    : [{ n: '01', title: 'A customer event arrives', sub: 'For example: a message is received', Icon: MessageCircle }, { n: '02', title: 'Sequence rules are applied', sub: 'The waits and actions you configured', Icon: Workflow }, { n: '03', title: 'The next step runs', sub: 'According to your channel setup', Icon: Zap }]

  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.82fr_1.18fr] lg:items-center">
        <Reveal>
          <SectionHeading align="start" eyebrow={isRTL ? 'تسلسلات وسير عمل' : 'SEQUENCES & WORKFLOWS'} title={isRTL ? 'متابعة منظمة، حسب قواعدك.' : 'Follow-up that runs on your rules.'} body={isRTL ? 'أنشئ تسلسلات متعددة الخطوات وسير عمل يبدأ من أحداث العميل، مع تحكمك في التوقيت والقنوات.' : 'Build multi-step sequences and event-triggered workflows, with control over timing and channels.'} />
          <Link href="/dashboard/sequences" className="mt-7 inline-flex items-center gap-2 text-sm font-bold transition-colors hover:opacity-80" style={{ color: 'var(--accent)' }}>
            {isRTL ? 'استكشف الأتمتة' : 'Explore automations'} <ArrowUpRight size={16} />
          </Link>
        </Reveal>

        <div className="relative rounded-[28px] border p-5 sm:p-8" style={{ borderColor: 'var(--border)', background: 'linear-gradient(145deg, var(--surface), color-mix(in srgb, var(--accent) 4%, var(--surface)))' }}>
          <div className="absolute start-[39px] top-[74px] bottom-[76px] hidden w-px sm:block" style={{ background: 'linear-gradient(180deg, var(--brand-blue), var(--brand-cyan), var(--brand-violet))' }} />
          {items.map(({ n, title, sub, Icon }, index) => (
            <Reveal key={n} delay={index * 0.12}>
              <motion.div whileHover={reduceMotion ? undefined : { x: isRTL ? -3 : 3 }} className="relative flex items-center gap-4 py-4 sm:gap-5 sm:py-5">
                <div className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-2xl border" style={{ borderColor: 'var(--accent-outline)', background: 'var(--surface-elevated)', color: index === 1 ? 'var(--ai-accent)' : 'var(--accent)', boxShadow: '0 0 26px var(--accent-subtle)' }}><Icon size={19} /></div>
                <div className="min-w-0 flex-1 rounded-2xl border p-4 sm:p-5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                  <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold sm:text-base" style={{ color: 'var(--text-primary)' }}>{title}</h3><span className="font-mono text-[10px]" style={{ color: 'var(--text-disabled)' }}>{n}</span></div>
                  <p className="mt-1 text-xs sm:text-sm" style={{ color: 'var(--text-tertiary)' }}>{sub}</p>
                  {index === 1 && <div className="mt-4 flex gap-1.5">{[0, 1, 2, 3, 4, 5, 6].map((dot) => <motion.span key={dot} className="h-1 rounded-full" animate={reduceMotion ? undefined : { opacity: [0.25, 0.8, 0.25] }} transition={{ duration: 1.8, delay: dot * 0.1, repeat: Infinity }} style={{ width: dot === 3 ? 30 : 8, background: 'var(--ai-accent)' }} />)}</div>}
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function CinematicLanding() {
  const { isRTL } = useLang()
  const { user } = useAuth()
  const reduceMotion = useReducedMotion()
  const copy = isRTL
    ? {
        badge: 'منصة مراسلات مدعومة بالذكاء الاصطناعي',
        titleA: 'محادثات عملائك',
        titleB: 'تستحق مساحة أذكى.',
        body: 'اجمع قنوات المراسلة، وأعدّ وكلاء الذكاء الاصطناعي بمعرفة نشاطك، وتابع كل محادثة من مكان واحد.',
        primary: user ? 'افتح لوحة التحكم' : 'ابدأ الآن',
        secondary: 'كيف يعمل',
        channels: 'قنوات المراسلة',
        channelsBody: 'اربط الحسابات التي يستخدمها عملاؤك، واجعل المحادثات متاحة لفريقك في مساحة عمل واحدة.',
        capabilities: 'منصة واحدة، أجزاء مترابطة',
        capabilityBody: 'اربط القنوات والوكلاء والمعرفة والأتمتة ضمن سير عمل فريقك.',
        steps: 'ابدأ بخطوات واضحة',
        stepsBody: 'ابدأ بالقنوات التي تريدها، ثم اضبط الوكيل قبل تفعيل الردود.',
        ctaTitle: 'ابدأ من محادثاتك الحالية.',
        ctaBody: 'أنشئ مساحة عملك، واربط قناة، ثم اضبط الوكيل بما يناسب نشاطك.',
        cta: user ? 'لوحة التحكم' : 'إنشاء حساب',
        commerce: 'تستخدم متجراً إلكترونياً؟ اربط التكاملات المتاحة من القنوات.',
      }
    : {
        badge: 'AI-assisted customer messaging',
        titleA: 'Customer conversations',
        titleB: 'deserve a smarter home.',
        body: 'Bring messaging channels together, configure AI agents with your business knowledge, and keep every conversation in one workspace.',
        primary: user ? 'Open dashboard' : 'Get started',
        secondary: 'See how it works',
        channels: 'Your channels, together',
        channelsBody: 'Connect the accounts your customers use and make their conversations available to your team in one workspace.',
        capabilities: 'One platform, connected pieces',
        capabilityBody: 'Bring channels, agents, knowledge, and automations into the way your team works.',
        steps: 'A clear place to start',
        stepsBody: 'Connect the channels you need, then configure your agent before turning replies on.',
        ctaTitle: 'Start with the conversations you already have.',
        ctaBody: 'Create your workspace, connect a channel, and configure an agent for your business.',
        cta: user ? 'Go to dashboard' : 'Create an account',
        commerce: 'Use a commerce store? Connect an available integration from Channels.',
      }

  const capabilitiesTitle = isRTL ? CAPABILITIES[0].eyebrow.ar : CAPABILITIES[0].eyebrow.en

  return (
    <div className="relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      <section className="relative isolate min-h-[calc(100svh-72px)] overflow-hidden px-4 pb-16 pt-16 sm:px-6 sm:pt-20 lg:flex lg:items-center lg:pb-20 lg:pt-24">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true" style={{ backgroundImage: 'radial-gradient(circle at 74% 30%, var(--ai-subtle), transparent 34%), radial-gradient(circle at 14% 76%, var(--accent-subtle), transparent 29%)' }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[68%] opacity-40" aria-hidden="true" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)', backgroundSize: '38px 38px', maskImage: 'linear-gradient(to bottom, black, transparent)' }} />

        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[.87fr_1.13fr] lg:gap-8">
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <motion.div initial={reduceMotion ? false : { opacity: 0, x: isRTL ? 14 : -14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }} className={`mb-6 flex ${isRTL ? 'justify-end' : 'justify-start'}`}>
              <span className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold sm:text-sm" style={{ borderColor: 'var(--accent-outline)', background: 'var(--surface)', color: 'var(--text-secondary)' }}><Sparkles size={14} style={{ color: 'var(--ai-accent)' }} />{copy.badge}</span>
            </motion.div>
            <motion.h1 initial={reduceMotion ? false : { opacity: 0, y: 22, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.8, delay: 0.05, ease: [0.16, 1, 0.3, 1] }} className="max-w-2xl text-balance text-[clamp(2.65rem,5.8vw,5.5rem)] font-black leading-[1.02] tracking-[-0.055em]" style={{ color: 'var(--text-primary)' }}>
              {copy.titleA}<br /><span style={{ background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{copy.titleB}</span>
            </motion.h1>
            <motion.p initial={reduceMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.18 }} className="mt-6 max-w-xl text-base leading-7 sm:text-lg sm:leading-8" style={{ color: 'var(--text-secondary)' }}>{copy.body}</motion.p>
            <motion.div initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className={`mt-8 flex flex-wrap items-center gap-3 ${isRTL ? 'justify-end' : 'justify-start'}`}>
              <Link href={user ? '/dashboard' : '/register'} className="group inline-flex min-h-12 items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-transform hover:-translate-y-0.5" style={{ background: 'var(--brand)', color: 'var(--brand-text)', boxShadow: '0 10px 28px var(--accent-subtle)' }}>
                {copy.primary}<ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <a href="#how-it-works" className="inline-flex min-h-12 items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition-colors hover:border-accent-secondary" style={{ borderColor: 'var(--border-strong)', background: 'var(--surface)', color: 'var(--text-primary)' }}>
                {copy.secondary}<ArrowDown size={15} style={{ color: 'var(--accent)' }} />
              </a>
            </motion.div>
            <motion.div initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.48, duration: 0.55 }} className={`mt-8 flex items-center gap-2 text-xs ${isRTL ? 'justify-end' : 'justify-start'}`} style={{ color: 'var(--text-tertiary)' }}>
              <CircleHelp size={14} style={{ color: 'var(--brand-cyan)' }} />{isRTL ? 'أنت تحدد القنوات وسلوك الوكيل.' : 'You choose the channels and configure your agent.'}
            </motion.div>
          </div>

          <HeroPreview isRTL={isRTL} />
        </div>

        <div className="pointer-events-none absolute bottom-0 start-1/2 hidden h-24 w-px -translate-x-1/2 lg:block" style={{ background: 'linear-gradient(transparent, var(--border-strong))' }} />
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:pb-24">
        <div className="mx-auto max-w-7xl">
          <Reveal><SectionHeading eyebrow={copy.channels} title={copy.channels} body={copy.channelsBody} /></Reveal>
          <ChannelRail isRTL={isRTL} />
        </div>
      </section>

      <FlowDemo isRTL={isRTL} />

      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <Reveal><SectionHeading eyebrow={capabilitiesTitle} title={copy.capabilities} body={copy.capabilityBody} /></Reveal>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {CAPABILITIES.map(({ eyebrow, title, body, Icon, accent }, index) => (
              <Reveal key={eyebrow.en} delay={index * 0.1}>
                <motion.article whileHover={reduceMotion ? undefined : { y: -5 }} className="group relative h-full overflow-hidden rounded-3xl border p-6 sm:p-7" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                  <div className="absolute -end-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" style={{ background: accent }} />
                  <div className="relative">
                    <div className="mb-8 flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-[0.16em]" style={{ color: 'var(--text-tertiary)' }}>{isRTL ? eyebrow.ar : eyebrow.en}</span>
                      <span className="grid h-11 w-11 place-items-center rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface-elevated)', color: accent }}><Icon size={19} /></span>
                    </div>
                    <h3 className="max-w-xs text-xl font-bold leading-snug tracking-tight" style={{ color: 'var(--text-primary)' }}>{isRTL ? title.ar : title.en}</h3>
                    <p className="mt-3 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{isRTL ? body.ar : body.en}</p>
                    <div className="mt-8 flex items-center gap-2 text-xs font-semibold" style={{ color: accent }}><span className="font-mono">0{index + 1}</span><span className="h-px w-8" style={{ background: accent }} /><span>{isRTL ? 'مكوّن في مساحة عملك' : 'Part of your workspace'}</span></div>
                  </div>
                </motion.article>
              </Reveal>
            ))}
          </div>
          <p className="mt-5 text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>{copy.commerce}</p>
        </div>
      </section>

      <WorkflowStory isRTL={isRTL} />

      <section className="px-4 pb-24 pt-8 sm:px-6 lg:pb-32">
        <Reveal>
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[28px] border px-6 py-12 text-center sm:px-12 sm:py-16 lg:rounded-[36px] lg:py-20" style={{ borderColor: 'var(--accent-outline)', background: 'linear-gradient(130deg, color-mix(in srgb, var(--accent) 10%, var(--surface)), var(--surface) 52%, color-mix(in srgb, var(--ai-accent) 9%, var(--surface)))' }}>
            <div className="pointer-events-none absolute -start-24 -top-32 h-72 w-72 rounded-full blur-[90px]" aria-hidden="true" style={{ background: 'var(--accent-subtle)' }} />
            <div className="pointer-events-none absolute -end-20 -bottom-36 h-80 w-80 rounded-full blur-[100px]" aria-hidden="true" style={{ background: 'var(--ai-subtle)' }} />
            <div className="relative">
              <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl border" style={{ borderColor: 'var(--accent-outline)', background: 'var(--surface)', color: 'var(--accent)' }}><Bot size={22} /></div>
              <h2 className="text-balance text-3xl font-black tracking-[-0.045em] sm:text-4xl lg:text-5xl" style={{ color: 'var(--text-primary)' }}>{copy.ctaTitle}</h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 sm:text-base" style={{ color: 'var(--text-secondary)' }}>{copy.ctaBody}</p>
              <Link href={user ? '/dashboard' : '/register'} className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-transform hover:-translate-y-0.5" style={{ background: 'var(--brand)', color: 'var(--brand-text)', boxShadow: '0 10px 30px var(--accent-subtle)' }}>
                {copy.cta}<ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
