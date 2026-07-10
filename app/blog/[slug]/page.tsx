import Link from 'next/link'
import { Metadata } from 'next'

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

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug)
  
  if (!post) {
    return {
      title: 'Article Not Found',
    }
  }
  
  return {
    title: post.title,
    description: post.meta_description || post.excerpt,
    openGraph: {
      title: post.title,
      description: post.meta_description || post.excerpt,
      images: post.featured_image_url ? [{ url: post.featured_image_url }] : [],
    },
  }
}

export default async function BlogArticlePage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)
  
  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
        <div className="text-center">
          <h1 className="font-black text-2xl mb-4" style={{ color: '#F5F5F5' }}>المقال غير موجود</h1>
          <Link href="/blog" className="text-sm" style={{ color: '#C6FF00' }}>العودة للمدونة</Link>
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
    <div className="min-h-screen" style={{ background: '#050505' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span style={{ color: '#C6FF00', fontSize: 20, filter: 'drop-shadow(0 0 8px rgba(198,255,0,0.7))' }}>✦</span>
            <span className="text-xl font-black" style={{ color: '#F5F5F5', letterSpacing: '-0.04em' }}>Naz</span>
          </Link>
          <Link href="/register" className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
            style={{ background: 'rgba(198,255,0,0.1)', color: '#C6FF00', border: '1px solid rgba(198,255,0,0.3)' }}>
            Sign Up Free
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Back Link */}
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm mb-6"
              style={{ color: 'rgba(255,255,255,0.5)' }}>
              ← العودة للمدونة
            </Link>

            {/* Article Header */}
            {post.featured_image_url && (
              <div className="mb-8 aspect-video rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {post.category && (
              <div className="inline-block px-4 py-2 rounded-lg text-sm font-bold mb-4"
                style={{ background: 'rgba(198,255,0,0.1)', color: '#C6FF00', border: '1px solid rgba(198,255,0,0.3)' }}>
                {post.category}
              </div>
            )}

            <h1 className="font-black mb-4" style={{ fontSize: 'clamp(1.8rem,3vw,2.5rem)', color: '#F5F5F5', letterSpacing: '-0.04em' }}>
              {post.title}
            </h1>

            <div className="flex items-center gap-4 text-sm mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <span>{post.author}</span>
              <span>•</span>
              <span>{formatDate(post.published_at)}</span>
            </div>

            {/* Article Body */}
            <div 
              className="prose prose-invert max-w-none mb-12"
              style={{ color: 'rgba(255,255,255,0.8)' }}
              dangerouslySetInnerHTML={{ __html: post.body }}
            />

            {/* Related Tools */}
            <div className="p-6 rounded-2xl mb-8" style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="font-bold mb-4" style={{ color: '#F5F5F5' }}>أدوات مجانية ذات صلة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedToolObjects.map((tool) => (
                  <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                    <div className="p-4 rounded-xl transition-all hover:scale-105"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div className="font-bold mb-1" style={{ color: '#C6FF00' }}>{tool.nameAr}</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{tool.nameEn}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Upsell Banner */}
            <div className="p-6 rounded-2xl text-center" style={{ background: 'rgba(198,255,0,0.05)', border: '1px solid rgba(198,255,0,0.15)' }}>
              <h3 className="font-bold mb-3" style={{ color: '#C6FF00' }}>
                اكتشف كيف يمكن لـ Naz Autoreply أن يضاعف مبيعاتك
              </h3>
              <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>
                دع الذكاء الاصطناعي يرد على عملائك تلقائياً على جميع المنصات
              </p>
              <Link href="/register" className="inline-block px-6 py-3 rounded-lg font-bold text-sm"
                style={{ background: '#C6FF00', color: '#050505' }}>
                جرّب مجاناً
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="p-6 rounded-2xl" style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 className="font-bold mb-4" style={{ color: '#F5F5F5' }}>أدوات مجانية قد تعجبك</h3>
                <div className="space-y-3">
                  {tools.slice(0, 3).map((tool) => (
                    <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                      <div className="p-3 rounded-xl transition-all hover:scale-105"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div className="font-bold text-sm mb-1" style={{ color: '#C6FF00' }}>{tool.nameAr}</div>
                        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{tool.nameEn}</div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/tools" className="block text-center text-sm mt-4" style={{ color: '#C6FF00' }}>
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
