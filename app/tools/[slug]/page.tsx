import Link from 'next/link'
import { notFound } from 'next/navigation'

const toolComponents: Record<string, any> = {
  'sales-script': () => import('@/components/tools/SalesScriptGenerator'),
  'copy-enhancer': () => import('@/components/tools/CopywritingEnhancer'),
  'complaint-analyzer': () => import('@/components/tools/ComplaintAnalyzer'),
  'campaign-ideator': () => import('@/components/tools/CampaignIdeator'),
  'policy-generator': () => import('@/components/tools/PolicyGenerator'),
  'tone-transformer': () => import('@/components/tools/ToneTransformer'),
  'seo-keywords': () => import('@/components/tools/SEOKeywords'),
  'pricing-calc': () => import('@/components/tools/PricingCalculator'),
  'title-generator': () => import('@/components/tools/TitleGenerator'),
  'persona-builder': () => import('@/components/tools/PersonaBuilder'),
}

const toolNames: Record<string, { ar: string; en: string }> = {
  'sales-script': { ar: 'مولد نصوص البيع', en: 'Sales Script Generator' },
  'copy-enhancer': { ar: 'محسن النصوص الإعلانية', en: 'Copywriting Enhancer' },
  'complaint-analyzer': { ar: 'محلل الشكاوى', en: 'Review & Complaint Analyzer' },
  'campaign-ideator': { ar: 'مولد أفكار الحملات', en: 'Ad Campaign Ideator' },
  'policy-generator': { ar: 'مولد سياسات المتجر', en: 'Store Policy Generator' },
  'tone-transformer': { ar: 'محول النبرة', en: 'Tone Transformer' },
  'seo-keywords': { ar: 'مستخرج كلمات SEO', en: 'SEO Keyword Extractor' },
  'pricing-calc': { ar: 'حاسبة التسعير الذكية', en: 'Smart Pricing Calculator' },
  'title-generator': { ar: 'مولد العناوين الجذابة', en: 'Click-Worthy Title Generator' },
  'persona-builder': { ar: 'مولد شخصيات العملاء', en: 'User Persona Builder' },
}

export default function ToolPage({ params }: { params: { slug: string } }) {
  const slug = params.slug
  const toolComponent = toolComponents[slug]
  const toolName = toolNames[slug]

  if (!toolComponent || !toolName) {
    notFound()
  }

  const ToolComponent = toolComponent

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span style={{ color: '#C6FF00', fontSize: 20, filter: 'drop-shadow(0 0 8px rgba(198,255,0,0.7))' }}>✦</span>
            <span className="text-xl font-black" style={{ color: '#F5F5F5', letterSpacing: '-0.04em' }}>Naz</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/tools" className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
              All Tools
            </Link>
            <Link href="/register" className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
              style={{ background: 'rgba(198,255,0,0.1)', color: '#C6FF00', border: '1px solid rgba(198,255,0,0.3)' }}>
              Sign Up Free
            </Link>
          </div>
        </div>
      </div>

      {/* Tool Header */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link href="/tools" className="inline-flex items-center gap-2 text-sm mb-6"
          style={{ color: 'rgba(255,255,255,0.5)' }}>
          ← Back to Tools
        </Link>
        <h1 className="font-black mb-2" style={{ fontSize: 'clamp(1.8rem,3vw,2.5rem)', color: '#F5F5F5', letterSpacing: '-0.04em' }}>
          {toolName.ar}
        </h1>
        <p className="text-lg" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {toolName.en}
        </p>
      </div>

      {/* Tool Content */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <ToolComponent />
      </div>
    </div>
  )
}
