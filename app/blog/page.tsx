import Link from 'next/link'

const categories = [
  { value: 'all', labelAr: 'الكل', labelEn: 'All' },
  { value: 'التجارة الإلكترونية', labelAr: 'التجارة الإلكترونية', labelEn: 'E-commerce' },
  { value: 'أتمتة المبيعات', labelAr: 'أتمتة المبيعات', labelEn: 'Sales Automation' },
  { value: 'ريادة الأعمال', labelAr: 'ريادة الأعمال', labelEn: 'Entrepreneurship' },
]

async function getPosts(category: string = 'all') {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts${category !== 'all' ? `?category=${category}` : ''}`, {
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

export default async function BlogPage({ searchParams }: { searchParams: { category?: string } }) {
  const category = searchParams.category || 'all'
  const { data: posts, meta } = await getPosts(category)

  const estimateReadTime = (excerpt: string) => {
    const wordsPerMinute = 200
    const wordCount = excerpt.split(/\s+/).length
    return Math.ceil(wordCount / wordsPerMinute)
  }

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
      <div className="border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span style={{ color: '#3B82F6', fontSize: 20 }}>✦</span>
            <span className="text-xl font-black" style={{ color: '#F5F5F5', letterSpacing: '-0.04em' }}>Naz</span>
          </Link>
          <Link href="/register" className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
            style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.3)' }}>
            Sign Up Free
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 py-16 text-center">
        <div>
          <h1 className="font-black mb-4" style={{ fontSize: 'clamp(2rem,4vw,3rem)', color: '#F5F5F5', letterSpacing: '-0.04em' }}>
            المدونة
          </h1>
          <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Blog - Tips & insights for e-commerce success
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.value}
              href={`/blog?category=${cat.value}`}
              className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
              style={{
                background: category === cat.value ? 'rgba(59,130,246,0.15)' : 'rgba(17,17,17,0.9)',
                color: category === cat.value ? '#3B82F6' : 'rgba(255,255,255,0.6)',
                border: category === cat.value ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {cat.labelAr}
            </Link>
          ))}
        </div>
      </div>

      {/* Posts Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg" style={{ color: 'rgba(255,255,255,0.5)' }}>
              لا توجد مقالات حالياً / No articles yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post: any, i: number) => (
              <div
                key={post.id}
              >
                <Link href={`/blog/${post.slug}`}>
                  <div className="h-full p-6 rounded-2xl transition-all duration-300 hover:scale-105"
                    style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {/* Featured Image */}
                    {post.featured_image_url && (
                      <div className="mb-4 aspect-video rounded-lg overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <img
                          src={post.featured_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Category Badge */}
                    {post.category && (
                      <div className="inline-block px-3 py-1 rounded-lg text-xs font-bold mb-3"
                        style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.3)' }}>
                        {post.category}
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="font-bold mb-3 line-clamp-2" style={{ color: '#F5F5F5', fontSize: '1.1rem' }}>
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-sm mb-4 line-clamp-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {post.excerpt}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      <span>{formatDate(post.published_at)}</span>
                      <span>•</span>
                      <span>{estimateReadTime(post.excerpt || '')} min read</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
