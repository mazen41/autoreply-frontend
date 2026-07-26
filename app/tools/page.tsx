'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const tools = [
  {
    slug: 'sales-script',
    nameAr: 'مولد نصوص البيع',
    nameEn: 'Sales Script Generator',
    descriptionAr: 'أنشئ نصوص بيع مقنعة للواتساب والمكالمات',
    descriptionEn: 'Generate persuasive sales scripts for WhatsApp and calls',
  },
  {
    slug: 'copy-enhancer',
    nameAr: 'محسن النصوص الإعلانية',
    nameEn: 'Copywriting Enhancer',
    descriptionAr: 'حول نصوصك الإعلانية إلى نصوص أكثر تأثيراً',
    descriptionEn: 'Transform your ad copy into more persuasive content',
  },
  {
    slug: 'complaint-analyzer',
    nameAr: 'محلل الشكاوى',
    nameEn: 'Review & Complaint Analyzer',
    descriptionAr: 'حلل شكاوى العملاء واقترح ردود احترافية',
    descriptionEn: 'Analyze customer complaints and suggest professional responses',
  },
  {
    slug: 'campaign-ideator',
    nameAr: 'مولد أفكار الحملات',
    nameEn: 'Ad Campaign Ideator',
    descriptionAr: 'احصل على 5 أفكار إبداعية لحملاتك التسويقية',
    descriptionEn: 'Get 5 creative ideas for your marketing campaigns',
  },
  {
    slug: 'policy-generator',
    nameAr: 'مولد سياسات المتجر',
    nameEn: 'Store Policy Generator',
    descriptionAr: 'أنشئ سياسات احترافية لمتجرك الإلكتروني',
    descriptionEn: 'Create professional policies for your e-commerce store',
  },
  {
    slug: 'tone-transformer',
    nameAr: 'محول النبرة',
    nameEn: 'Tone Transformer',
    descriptionAr: 'حوّل النصوص بين اللهجات واللغات',
    descriptionEn: 'Transform text between dialects and languages',
  },
  {
    slug: 'seo-keywords',
    nameAr: 'مستخرج كلمات SEO',
    nameEn: 'SEO Keyword Extractor',
    descriptionAr: 'استخرج أفضل كلمات المفتاحية من وصف المنتج',
    descriptionEn: 'Extract top SEO keywords from product descriptions',
  },
  {
    slug: 'pricing-calc',
    nameAr: 'حاسبة التسعير الذكية',
    nameEn: 'Smart Pricing Calculator',
    descriptionAr: 'احسب السعر المثالي لمنتجاتك',
    descriptionEn: 'Calculate the optimal price for your products',
  },
  {
    slug: 'title-generator',
    nameAr: 'مولد العناوين الجذابة',
    nameEn: 'Click-Worthy Title Generator',
    descriptionAr: 'أنشئ عناوين تجذب الانتباه',
    descriptionEn: 'Generate attention-grabbing titles',
  },
  {
    slug: 'persona-builder',
    nameAr: 'مولد شخصيات العملاء',
    nameEn: 'User Persona Builder',
    descriptionAr: 'ابنِ شخصيات مفصلة لعملائك المستهدفين',
    descriptionEn: 'Build detailed personas for your target customers',
  },
]

export default function ToolsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span style={{ color: 'var(--accent)', fontSize: 20 }}>✦</span>
            <span className="text-xl font-black" style={{ color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>Naz</span>
          </Link>
          <Link href="/register" className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-focus)' }}>
            Sign Up Free
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 py-16 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full"
            style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-focus)' }}>
            <span style={{ color: 'var(--accent)', fontSize: 12 }}>✦</span>
            <span className="text-xs font-bold tracking-[0.1em]" style={{ color: 'var(--accent)' }}>
              10 FREE AI TOOLS
            </span>
          </div>
          <h1 className="font-black mb-4" style={{ fontSize: 'clamp(2rem,4vw,3rem)', color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
            أدوات تسويقية مجانية
          </h1>
          <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
            Free AI marketing tools to grow your business
          </p>
        </motion.div>
      </div>

      {/* Tools Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            >
              <Link href={`/tools/${tool.slug}`}>
                <div className="p-6 rounded-2xl h-full transition-all duration-300 hover:scale-105"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="mb-4">
                    <span style={{ color: 'var(--accent)', fontSize: 24 }}>⚡</span>
                  </div>
                  <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                    {tool.nameAr}
                  </h3>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
                    {tool.nameEn}
                  </p>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    {tool.descriptionAr}
                  </p>
                  <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
                    {tool.descriptionEn}
                  </p>
                  <div className="px-4 py-2 rounded-lg text-sm font-bold text-center"
                    style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                    جرّبها مجاناً
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
