'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Rss } from 'lucide-react'
import { useLang } from '../../lib/LangContext'
import BlogTopBar from '../../components/blog/BlogTopBar'
import PostCard, { BlogPost } from '../../components/blog/PostCard'
import { fadeUp, fadeIn, staggerContainer, defaultTransition } from '../../lib/motion'

const categories = [
  { value: 'all', labelAr: 'الكل', labelEn: 'All' },
  { value: 'التجارة الإلكترونية', labelAr: 'التجارة الإلكترونية', labelEn: 'E-commerce' },
  { value: 'أتمتة المبيعات', labelAr: 'أتمتة المبيعات', labelEn: 'Sales Automation' },
  { value: 'ريادة الأعمال', labelAr: 'ريادة الأعمال', labelEn: 'Entrepreneurship' },
]

async function getPosts(category: string = 'all') {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts${category !== 'all' ? `?category=${encodeURIComponent(category)}` : ''}`, {
      next: { revalidate: 60 },
    })

    if (!res.ok) {
      return { data: [], meta: { total: 0 } }
    }

    return res.json()
  } catch {
    return { data: [], meta: { total: 0 } }
  }
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="skeleton aspect-video" style={{ borderRadius: 0 }} />
      <div className="p-5 space-y-3">
        <div className="skeleton skeleton-text-sm w-20" />
        <div className="skeleton skeleton-text w-full" />
        <div className="skeleton skeleton-text w-3/4" />
        <div className="skeleton skeleton-text-sm w-1/2" />
      </div>
    </div>
  )
}

export default function BlogPage() {
  const { isRTL } = useLang()
  const [category, setCategory] = useState('all')
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    getPosts(category).then(({ data }) => {
      if (!active) return
      setPosts(data || [])
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [category])

  const locale = isRTL ? 'ar-SA' : 'en-US'
  const [featuredPost, ...restPosts] = posts

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      <BlogTopBar />

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10 text-center relative">
        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
          <motion.div
            variants={fadeUp}
            transition={defaultTransition}
            className="inline-flex items-center gap-2 mb-5 premium-kicker"
          >
            <Rss size={12} />
            {isRTL ? 'المدونة' : 'Blog'}
          </motion.div>
          <motion.h1
            variants={fadeUp}
            transition={defaultTransition}
            className="font-black mb-4"
            style={{ fontSize: 'clamp(2.2rem,5vw,3.4rem)', color: 'var(--text-primary)', letterSpacing: '-0.04em' }}
          >
            {isRTL ? 'أفكار تنمّي متجرك' : 'Ideas that grow your store'}
          </motion.h1>
          <motion.p
            variants={fadeUp}
            transition={defaultTransition}
            className="text-lg max-w-2xl mx-auto"
            style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}
          >
            {isRTL
              ? 'نصائح عملية واستراتيجيات مثبتة في التجارة الإلكترونية، أتمتة المبيعات، وريادة الأعمال.'
              : 'Practical tips and proven strategies in e-commerce, sales automation, and entrepreneurship.'}
          </motion.p>
        </motion.div>
      </div>

      {/* Category Filter — sliding pill */}
      <div className="max-w-7xl mx-auto px-6 mb-10">
        <div className="flex flex-wrap justify-center gap-2 p-1.5 w-fit mx-auto rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className="relative px-4 py-2 rounded-xl text-sm font-bold transition-colors duration-200"
              style={{ color: category === cat.value ? 'var(--on-accent-text)' : 'var(--text-secondary)' }}
            >
              {category === cat.value && (
                <motion.span
                  layoutId="categoryPill"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: 'var(--accent)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10">{isRTL ? cat.labelAr : cat.labelEn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-7xl mx-auto px-6 pb-24 min-h-[40vh]">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </motion.div>
          ) : posts.length === 0 ? (
            <motion.div key="empty" variants={fadeIn} initial="hidden" animate="visible" className="empty-state">
              <div className="empty-state-icon">
                <Rss size={22} />
              </div>
              <div className="empty-state-title">
                {isRTL ? 'لا توجد مقالات في هذا القسم' : 'No articles in this category yet'}
              </div>
              <div className="empty-state-description">
                {isRTL ? 'جرّب قسماً آخر أو عد لاحقاً لمقالات جديدة.' : 'Try another category, or check back soon for new posts.'}
              </div>
            </motion.div>
          ) : (
            <motion.div key={category} initial="hidden" animate="visible" variants={staggerContainer} className="space-y-10">
              {featuredPost && (
                <PostCard post={featuredPost} isRTL={isRTL} locale={locale} featured />
              )}
              {restPosts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {restPosts.map((post, i) => (
                    <PostCard key={post.id} post={post} isRTL={isRTL} locale={locale} index={i} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
