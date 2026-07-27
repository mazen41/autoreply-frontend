'use client'

import Link from 'next/link'
import { useAuth } from '../../components/AuthProvider'
import { useState, useEffect } from 'react'

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

async function getPost(slug: string) {
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

export default function BlogArticlePage({ params }: { params: { slug: string } }) {
  const { user } = useAuth()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPost()
  }, [params.slug])

  const loadPost = async () => {
    setLoading(true)
    const postData = await getPost(params.slug)
    setPost(postData)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <h1 className="font-black text-2xl mb-4" style={{ color: 'var(--text-primary)' }}>Loading...</h1>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <h1 className="font-black text-2xl mb-4" style={{ color: 'var(--text-primary)' }}>المقال غير موجود</h1>
          <Link href="/blog" className="text-sm" style={{ color: 'var(--accent)' }}>العودة للمدونة</Link>
        </div>
      </div>
    )
  }

  const relatedTools = categoryToolMap[post.category] || tools.slice(0, 3).map(t => t.slug)
  const relatedToolObjects = tools.filter(t => relatedTools.includes(t.slug))

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span style={{ color: 'var(--accent)', fontSize: 20 }}>✦</span>
            <span className="text-xl font-black" style={{ color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>Naz</span>
          </Link>
          {user ? (
            <Link href="/dashboard" className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-focus)' }}>
              Dashboard
            </Link>
          ) : (
            <Link href="/register" className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-focus)' }}>
              Sign Up Free
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Back Link */}
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm mb-6"
              style={{ color: 'var(--text-secondary)' }}>
              ← العودة للمدونة
            </Link>

            {/* Article Header */}
            {post.featured_image_url && (
              <div className="mb-8 aspect-video rounded-2xl overflow-hidden"
                style={{ background: 'var(--border)' }}>
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {post.category && (
              <div className="inline-block px-4 py-2 rounded-lg text-sm font-bold mb-4"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-focus)' }}>
                {post.category}
              </div>
            )}

            <h1 className="font-black mb-4" style={{ fontSize: 'clamp(1.8rem,3vw,2.5rem)', color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
              {post.title}
            </h1>

            <div className="flex items-center gap-4 text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
              <span>{post.author}</span>
              <span>•</span>
              <span>{formatDate(post.published_at)}</span>
            </div>

            {/* Article Body */}
            <div
              className="prose prose-invert max-w-none mb-12"
              style={{ color: 'var(--text-secondary)' }}
              dangerouslySetInnerHTML={{ __html: post.body }}
            />

            {/* Related Tools */}
            <div className="p-6 rounded-2xl mb-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>أدوات مجانية ذات صلة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedToolObjects.map((tool) => (
                  <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                    <div className="p-4 rounded-xl transition-all hover:scale-105"
                      style={{ background: 'var(--border)', border: '1px solid var(--border)' }}>
                      <div className="font-bold mb-1" style={{ color: 'var(--accent)' }}>{tool.nameAr}</div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{tool.nameEn}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Upsell Banner */}
            <div className="p-6 rounded-2xl text-center" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-focus)' }}>
              <h3 className="font-bold mb-3" style={{ color: 'var(--accent)' }}>
                اكتشف كيف يمكن لـ Naz Autoreply أن يضاعف مبيعاتك
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                دع الذكاء الاصطناعي يرد على عملائك تلقائياً على جميع المنصات
              </p>
              <Link href="/register" className="inline-block px-6 py-3 rounded-lg font-bold text-sm"
                style={{ background: 'var(--accent)', color: 'var(--text-primary)' }}>
                جرّب مجاناً
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="p-6 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>أدوات مجانية قد تعجبك</h3>
                <div className="space-y-3">
                  {tools.slice(0, 3).map((tool) => (
                    <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                      <div className="p-3 rounded-xl transition-all hover:scale-105"
                        style={{ background: 'var(--border)', border: '1px solid var(--border)' }}>
                        <div className="font-bold text-sm mb-1" style={{ color: 'var(--accent)' }}>{tool.nameAr}</div>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{tool.nameEn}</div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/tools" className="block text-center text-sm mt-4" style={{ color: 'var(--accent)' }}>
                  عرض جميع الأدوات →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
