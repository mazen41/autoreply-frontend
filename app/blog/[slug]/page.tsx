'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion, useScroll, useSpring } from 'framer-motion'
import { useState, useEffect } from 'react'
import DOMPurify from 'dompurify'
import { Calendar, Clock, User, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { useLang } from '../../../lib/LangContext'
import BlogTopBar from '../../../components/blog/BlogTopBar'
import { fadeUp, fadeIn, staggerContainer, defaultTransition } from '../../../lib/motion'

const tools = [
  { slug: 'sales-script', nameAr: 'مولد نصوص البيع', nameEn: 'Sales Script Generator' },
  { slug: 'copy-enhancer', nameAr: 'محسن النصوص الإعلانية', nameEn: 'Copywriting Enhancer' },
  { slug: 'complaint-analyzer', nameAr: 'محلل الشكاوى', nameEn: 'Review & Complaint Analyzer' },
  { slug: 'campaign-ideator', nameAr: 'مولد أفكار الحملات', nameEn: 'Ad Campaign Ideator' },
  { slug: 'policy-generator', nameAr: 'مولد سياسات المتجر', nameEn: 'Store Policy Generator' },
  { slug: 'tone-transformer', nameAr: 'محول النبرة', nameEn: 'Tone Transformer' },
  { slug: 'seo-keywords', nameAr: 'مستخرج كلمات SEO', nameEn: 'SEO Keyword Extractor' },
  { slug: 'pricing-calc', nameAr: 'حاسبة التسعير الذكية', nameEn: 'Smart Pricing Calculator' },
  { slug: 'title-generator', nameAr: 'مولد العناوين الجذابة', nameEn: 'Click-Worthy Title Generator' },
  { slug: 'persona-builder', nameAr: 'مولد شخصيات العملاء', nameEn: 'User Persona Builder' },
]

const categoryToolMap: Record<string, string[]> = {
  'التجارة الإلكترونية': ['seo-keywords', 'pricing-calc', 'policy-generator'],
  'أتمتة المبيعات': ['sales-script', 'copy-enhancer', 'complaint-analyzer'],
  'ريادة الأعمال': ['persona-builder', 'campaign-ideator', 'title-generator'],
}

interface Post {
  id: number
  title: string
  title_en?: string | null
  slug: string
  excerpt?: string | null
  excerpt_en?: string | null
  body: string
  body_en?: string | null
  category?: string | null
  author?: string | null
  published_at: string
  featured_image_url?: string | null
}

async function getPost(slug: string): Promise<Post | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${slug}`, {
      next: { revalidate: 60 },
    })

    if (!res.ok) {
      return null
    }

    return res.json()
  } catch {
    return null
  }
}

function estimateReadTime(text: string) {
  const words = text.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

function ArticleSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <div className="skeleton skeleton-text-sm w-32 mb-6" />
      <div className="skeleton aspect-video w-full mb-8" style={{ borderRadius: 'var(--radius-lg)' }} />
      <div className="skeleton skeleton-text-sm w-24 mb-4" />
      <div className="skeleton mb-3" style={{ height: '2.2rem', width: '85%' }} />
      <div className="skeleton mb-8" style={{ height: '2.2rem', width: '55%' }} />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton skeleton-text w-full" />
        ))}
      </div>
    </div>
  )
}

export default function BlogArticlePage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug
  const { isRTL } = useLang()

  const [post, setPost] = useState<Post | null | undefined>(undefined)

  useEffect(() => {
    if (!slug) return
    let active = true
    setPost(undefined)
    getPost(slug).then((data) => {
      if (active) setPost(data)
    })
    return () => {
      active = false
    }
  }, [slug])

  // Reading progress bar
  const { scrollYProgress } = useScroll()
  const progressWidth = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 })

  const loading = post === undefined

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'transparent' }}>
        <BlogTopBar />
        <ArticleSkeleton />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen" style={{ background: 'transparent' }}>
        <BlogTopBar />
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="min-h-[70vh] flex items-center justify-center px-6"
        >
          <div className="text-center max-w-md">
            <div className="empty-state-icon mx-auto mb-5">
              <Sparkles size={22} />
            </div>
            <h1 className="font-black text-2xl mb-3" style={{ color: 'var(--text-primary)' }}>
              {isRTL ? 'المقال غير موجود' : 'Article not found'}
            </h1>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              {isRTL
                ? 'ربما تم نقل هذا المقال أو حذفه. تصفح باقي المقالات من المدونة.'
                : 'This article may have been moved or removed. Browse the rest of the blog instead.'}
            </p>
            <Link href="/blog" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold btn-primary">
              {isRTL ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
              {isRTL ? 'العودة للمدونة' : 'Back to blog'}
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  const title = (isRTL ? post.title : post.title_en) || post.title
  const body = (isRTL ? post.body : post.body_en) || post.body
  const cleanBody = typeof window !== 'undefined' ? DOMPurify.sanitize(body) : body

  const relatedTools = (post.category && categoryToolMap[post.category]) || tools.slice(0, 3).map(t => t.slug)
  const relatedToolObjects = tools.filter(t => relatedTools.includes(t.slug))

  const formattedDate = new Intl.DateTimeFormat(isRTL ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(post.published_at))

  const BackIcon = isRTL ? ArrowRight : ArrowLeft

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      {/* Reading progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-50 h-[3px] origin-left"
        style={{ scaleX: progressWidth, background: 'var(--accent)' }}
      />

      <BlogTopBar />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="lg:col-span-2"
          >
            <motion.div variants={fadeUp} transition={defaultTransition}>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm mb-6 transition-colors duration-200 hover:text-[var(--accent)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                <BackIcon size={15} />
                {isRTL ? 'العودة للمدونة' : 'Back to blog'}
              </Link>
            </motion.div>

            {post.featured_image_url && (
              <motion.div
                variants={fadeUp}
                transition={defaultTransition}
                className="mb-8 aspect-video rounded-2xl overflow-hidden"
                style={{ background: 'var(--border)' }}
              >
                <img src={post.featured_image_url} alt={title} className="w-full h-full object-cover" />
              </motion.div>
            )}

            {post.category && (
              <motion.div
                variants={fadeUp}
                transition={defaultTransition}
                className="inline-block px-4 py-2 rounded-lg text-sm font-bold mb-4"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-focus)' }}
              >
                {post.category}
              </motion.div>
            )}

            <motion.h1
              variants={fadeUp}
              transition={defaultTransition}
              className="font-black mb-4"
              style={{ fontSize: 'clamp(1.8rem,3vw,2.5rem)', color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1.25 }}
            >
              {title}
            </motion.h1>

            <motion.div
              variants={fadeUp}
              transition={defaultTransition}
              className="flex flex-wrap items-center gap-4 text-sm mb-8"
              style={{ color: 'var(--text-secondary)' }}
            >
              {post.author && (
                <span className="flex items-center gap-1.5"><User size={14} /> {post.author}</span>
              )}
              <span className="flex items-center gap-1.5"><Calendar size={14} /> {formattedDate}</span>
              <span className="flex items-center gap-1.5"><Clock size={14} /> {estimateReadTime(body)} {isRTL ? 'دقائق قراءة' : 'min read'}</span>
            </motion.div>

            <motion.div
              variants={fadeUp}
              transition={defaultTransition}
              className="prose prose-invert max-w-none mb-12 email-content"
              style={{ color: 'var(--text-secondary)' }}
              dangerouslySetInnerHTML={{ __html: cleanBody }}
            />

            {/* Related Tools */}
            <motion.div
              variants={fadeUp}
              transition={defaultTransition}
              className="p-6 rounded-2xl mb-8"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                {isRTL ? 'أدوات مجانية ذات صلة' : 'Related free tools'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedToolObjects.map((tool) => (
                  <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                    <motion.div
                      whileHover={{ y: -3 }}
                      transition={{ duration: 0.2 }}
                      className="p-4 rounded-xl transition-colors duration-200"
                      style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
                    >
                      <div className="font-bold mb-1" style={{ color: 'var(--accent)' }}>{isRTL ? tool.nameAr : tool.nameEn}</div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{isRTL ? tool.nameEn : tool.nameAr}</div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Upsell Banner */}
            <motion.div
              variants={fadeUp}
              transition={defaultTransition}
              className="p-6 rounded-2xl text-center"
              style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-focus)' }}
            >
              <h3 className="font-bold mb-3" style={{ color: 'var(--accent)' }}>
                {isRTL ? 'اكتشف كيف يمكن للرد الآلي أن يضاعف مبيعاتك' : 'See how Autoreply can double your sales'}
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                {isRTL ? 'دع الذكاء الاصطناعي يرد على عملائك تلقائياً على جميع المنصات' : 'Let AI automatically reply to your customers across every channel'}
              </p>
              <Link href="/register" className="inline-block px-6 py-3 rounded-lg font-bold text-sm btn-primary">
                {isRTL ? 'جرّب مجاناً' : 'Try it free'}
              </Link>
            </motion.div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...defaultTransition, delay: 0.15 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-24">
              <div className="p-6 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  {isRTL ? 'أدوات مجانية قد تعجبك' : 'Free tools you might like'}
                </h3>
                <div className="space-y-3">
                  {tools.slice(0, 3).map((tool) => (
                    <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                      <motion.div
                        whileHover={{ y: -3 }}
                        transition={{ duration: 0.2 }}
                        className="p-3 rounded-xl transition-colors duration-200"
                        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
                      >
                        <div className="font-bold text-sm mb-1" style={{ color: 'var(--accent)' }}>{isRTL ? tool.nameAr : tool.nameEn}</div>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{isRTL ? tool.nameEn : tool.nameAr}</div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
                <Link href="/tools" className="block text-center text-sm mt-4 transition-colors duration-200 hover:opacity-80" style={{ color: 'var(--accent)' }}>
                  {isRTL ? 'عرض جميع الأدوات ←' : 'View all tools →'}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
