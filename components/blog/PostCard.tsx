'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, Clock, ArrowLeft, ArrowRight } from 'lucide-react'
import { fadeUp, defaultTransition } from '../../lib/motion'

export interface BlogPost {
  id: number
  title: string
  title_en?: string | null
  slug: string
  excerpt: string
  excerpt_en?: string | null
  category?: string | null
  author?: string | null
  published_at: string
  featured_image_url?: string | null
}

function estimateReadTime(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

export default function PostCard({
  post,
  isRTL,
  locale,
  index = 0,
  featured = false,
}: {
  post: BlogPost
  isRTL: boolean
  locale: string
  index?: number
  featured?: boolean
}) {
  const title = (isRTL ? post.title : post.title_en) || post.title
  const excerpt = (isRTL ? post.excerpt : post.excerpt_en) || post.excerpt
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight

  const formattedDate = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(post.published_at))

  if (featured) {
    return (
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        transition={defaultTransition}
      >
        <Link href={`/blog/${post.slug}`} className="group block">
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden transition-all duration-500"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="relative aspect-video md:aspect-auto overflow-hidden" style={{ background: 'var(--border)' }}>
              {post.featured_image_url && (
                <img
                  src={post.featured_image_url}
                  alt={title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              )}
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(180deg, transparent 40%, color-mix(in srgb, var(--background) 60%, transparent) 100%)' }}
              />
            </div>
            <div className="p-8 flex flex-col justify-center">
              {post.category && (
                <div
                  className="inline-flex w-fit items-center px-3 py-1.5 rounded-lg text-xs font-bold mb-4"
                  style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-focus)' }}
                >
                  {post.category}
                </div>
              )}
              <h2
                className="font-black mb-3 transition-colors duration-300 group-hover:text-[var(--accent)]"
                style={{ fontSize: 'clamp(1.4rem,2.4vw,1.9rem)', color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.25 }}
              >
                {title}
              </h2>
              <p className="text-sm mb-6 line-clamp-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {excerpt}
              </p>
              <div className="flex items-center gap-4 text-xs mb-5" style={{ color: 'var(--text-tertiary)' }}>
                <span className="flex items-center gap-1.5"><Calendar size={13} /> {formattedDate}</span>
                <span className="flex items-center gap-1.5"><Clock size={13} /> {estimateReadTime(excerpt)} {isRTL ? 'دقائق قراءة' : 'min read'}</span>
              </div>
              <div className="inline-flex items-center gap-2 text-sm font-bold w-fit" style={{ color: 'var(--accent)' }}>
                {isRTL ? 'اقرأ المقال' : 'Read article'}
                <ArrowIcon size={15} className="transition-transform duration-300 group-hover:translate-x-[-3px] rtl:group-hover:translate-x-[3px]" />
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      transition={{ ...defaultTransition, delay: (index % 6) * 0.05 }}
    >
      <Link href={`/blog/${post.slug}`} className="group block h-full">
        <motion.div
          whileHover={{ y: -6 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="h-full flex flex-col rounded-2xl overflow-hidden card-os"
          style={{ background: 'var(--surface)' }}
        >
          <div className="relative aspect-video overflow-hidden" style={{ background: 'var(--border)' }}>
            {post.featured_image_url && (
              <img
                src={post.featured_image_url}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            )}
          </div>
          <div className="p-5 flex flex-col flex-1">
            {post.category && (
              <div
                className="inline-flex w-fit items-center px-2.5 py-1 rounded-lg text-[11px] font-bold mb-3"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-focus)' }}
              >
                {post.category}
              </div>
            )}
            <h3
              className="font-bold mb-2 line-clamp-2 transition-colors duration-300 group-hover:text-[var(--accent)]"
              style={{ color: 'var(--text-primary)', fontSize: '1.05rem', lineHeight: 1.4 }}
            >
              {title}
            </h3>
            <p className="text-sm mb-4 line-clamp-2 flex-1" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {excerpt}
            </p>
            <div className="flex items-center gap-3 text-xs pt-3" style={{ color: 'var(--text-tertiary)', borderTop: '1px solid var(--divider)' }}>
              <span className="flex items-center gap-1.5"><Calendar size={12} /> {formattedDate}</span>
              <span className="flex items-center gap-1.5"><Clock size={12} /> {estimateReadTime(excerpt)} {isRTL ? 'د' : 'min'}</span>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  )
}
