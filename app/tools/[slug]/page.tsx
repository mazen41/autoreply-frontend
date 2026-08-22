'use client'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useAuth } from '@/lib/AuthContext'
import { use } from 'react'
import { Bot } from 'lucide-react'

const toolComponents: Record<string, React.ComponentType> = {
  'sales-script': dynamic(() => import('@/components/tools/SalesScriptGenerator'), { ssr: false }),
  'copy-enhancer': dynamic(() => import('@/components/tools/CopywritingEnhancer'), { ssr: false }),
  'complaint-analyzer': dynamic(() => import('@/components/tools/ComplaintAnalyzer'), { ssr: false }),
  'campaign-ideator': dynamic(() => import('@/components/tools/CampaignIdeator'), { ssr: false }),
  'policy-generator': dynamic(() => import('@/components/tools/PolicyGenerator'), { ssr: false }),
  'tone-transformer': dynamic(() => import('@/components/tools/ToneTransformer'), { ssr: false }),
  'seo-keywords': dynamic(() => import('@/components/tools/SEOKeywords'), { ssr: false }),
  'pricing-calc': dynamic(() => import('@/components/tools/PricingCalculator'), { ssr: false }),
  'title-generator': dynamic(() => import('@/components/tools/TitleGenerator'), { ssr: false }),
  'persona-builder': dynamic(() => import('@/components/tools/PersonaBuilder'), { ssr: false }),
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

export default function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const ToolComponent = toolComponents[slug]
  const toolName = toolNames[slug]

  if (!ToolComponent || !toolName) {
    notFound()
  }

  const { user, loading } = useAuth()

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Bot size={35} className="text-accent" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/tools" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              All Tools
            </Link>
            {!loading && (
              user ? (
                <Link href="/dashboard" className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
                  style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-focus)' }}>
                  Dashboard
                </Link>
              ) : (
                <Link href="/register" className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
                  style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-focus)' }}>
                  Sign Up Free
                </Link>
              )
            )}
          </div>
        </div>
      </div>

      {/* Tool Header */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link href="/tools" className="inline-flex items-center gap-2 text-sm mb-6"
          style={{ color: 'var(--text-secondary)' }}>
          ← Back to Tools
        </Link>
        <h1 className="font-black mb-2" style={{ fontSize: 'clamp(1.8rem,3vw,2.5rem)', color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
          {toolName.ar}
        </h1>
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
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
