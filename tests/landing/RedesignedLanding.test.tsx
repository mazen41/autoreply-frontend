import React from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

beforeAll(() => {
  global.IntersectionObserver = class {
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
  } as unknown as typeof IntersectionObserver
})
import HeroSection from '../../components/landing/HeroSection'
import IntegrationEcosystem from '../../components/landing/IntegrationEcosystem'
import HowItWorksSection from '../../components/landing/HowItWorksSection'
import FeaturesSection from '../../components/landing/FeaturesSection'
import ProductDemoSection from '../../components/landing/ProductDemoSection'
import UseCasesSection from '../../components/landing/UseCasesSection'
import AiIntelligenceSection from '../../components/landing/AiIntelligenceSection'
import FAQ from '../../components/landing/FAQ'
import FinalCtaSection from '../../components/landing/FinalCtaSection'
import { LangProvider } from '../../lib/LangContext'

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('../../lib/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}))

vi.mock('../../components/landing/Hero3DCanvas', () => ({
  default: () => <div data-testid="mock-3d-canvas">Three.js Canvas</div>,
}))

describe('Redesigned Landing Page Sections', () => {
  it('renders Hero Section with headline, CTAs and 3D canvas placeholder', () => {
    render(
      <LangProvider>
        <HeroSection />
      </LangProvider>
    )

    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
    expect(screen.getByText(/One Intelligent AI|ذكاء اصطناعي واحد/i)).toBeTruthy()
    expect(screen.getByText(/Start Automating|ابدأ الأتمتة الآن/i)).toBeTruthy()
    expect(screen.getByText(/Explore the Platform|استكشف المنصة/i)).toBeTruthy()
  })

  it('renders Integration Ecosystem with real channels and category tabs', () => {
    render(
      <LangProvider>
        <IntegrationEcosystem />
      </LangProvider>
    )

    expect(screen.getByText(/WhatsApp/i)).toBeTruthy()
    expect(screen.getByText(/Instagram/i)).toBeTruthy()
    expect(screen.getByText(/Shopify/i)).toBeTruthy()
    expect(screen.getByText(/Salla/i)).toBeTruthy()
    expect(screen.getByText(/WooCommerce/i)).toBeTruthy()
    expect(screen.getByText(/Telegram/i)).toBeTruthy()
  })

  it('renders How It Works with all 4 steps', () => {
    render(
      <LangProvider>
        <HowItWorksSection />
      </LangProvider>
    )

    expect(screen.getByText('01')).toBeTruthy()
    expect(screen.getByText('02')).toBeTruthy()
    expect(screen.getByText('03')).toBeTruthy()
    expect(screen.getByText('04')).toBeTruthy()
    expect(screen.getByText(/Connect Your Channels|اربط قنواتك/i)).toBeTruthy()
  })

  it('renders Features Section with core capabilities', () => {
    render(
      <LangProvider>
        <FeaturesSection />
      </LangProvider>
    )

    expect(screen.getAllByText(/Omnichannel Inbox|صندوق وارد موحد/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Dynamic Knowledge Base|قاعدة معرفة ديناميكية/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Live Order Management|استعلام ومتابعة الطلبات/i).length).toBeGreaterThan(0)
  })

  it('renders Interactive Product Demo with scenario buttons and chat simulation', () => {
    render(
      <LangProvider>
        <ProductDemoSection />
      </LangProvider>
    )

    expect(screen.getAllByText(/Live Order Tracking|تتبع الطلب لحظياً/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Store Policy & Returns|سياسة الاستبدال والاسترجاع/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Appointment Booking|حجز المواعيد والاستشارات/i).length).toBeGreaterThan(0)
  })

  it('renders Business Use Cases for eCommerce, Social, Clinics, and Support', () => {
    render(
      <LangProvider>
        <UseCasesSection />
      </LangProvider>
    )

    expect(screen.getAllByText(/E-Commerce & Online Stores|المتاجر الإلكترونية/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/High-Volume Social Brands|العلامات التجارية عبر السوشيال ميديا/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Clinics & Appointment Services|العيادات والخدمات بالحجز المسبق/i).length).toBeGreaterThan(0)
  })

  it('renders AI Intelligence Section with multi-model explanation', () => {
    render(
      <LangProvider>
        <AiIntelligenceSection />
      </LangProvider>
    )

    expect(screen.getByText(/Grounding in Real Business Data|تأصيل الردود في بياناتك/i)).toBeTruthy()
    expect(screen.getByText(/Multi-Model Fallback Architecture|بنية تشغيل سحابية/i)).toBeTruthy()
  })

  it('renders FAQ with expandable accordion items', () => {
    render(
      <LangProvider>
        <FAQ />
      </LangProvider>
    )

    const firstQuestion = screen.getByText(/What is Naz AutoReply|ما هي منصة نذير/i)
    expect(firstQuestion).toBeTruthy()
    fireEvent.click(firstQuestion)
    expect(screen.getByText(/autonomous conversational AI|منصة ذكاء اصطناعي محادثية/i)).toBeTruthy()
  })

  it('renders Final CTA with high-converting headline', () => {
    render(
      <LangProvider>
        <FinalCtaSection />
      </LangProvider>
    )

    expect(screen.getByText(/Stop Managing Conversations Manually|توقف عن إدارة محادثاتك يدوياً/i)).toBeTruthy()
    expect(screen.getByText(/Get Started Today|ابدأ تجربتك المجانية اليوم/i)).toBeTruthy()
  })
})
