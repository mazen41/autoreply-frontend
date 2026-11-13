'use client'

import React, { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLang } from '../../lib/LangContext'
import { useHydratedReducedMotion } from '../../lib/useHydratedReducedMotion'
import HeroSection from './HeroSection'
import IntegrationEcosystem from './IntegrationEcosystem'
import HowItWorksSection from './HowItWorksSection'
import FeaturesSection from './FeaturesSection'
import ProductDemoSection from './ProductDemoSection'
import UseCasesSection from './UseCasesSection'
import AiIntelligenceSection from './AiIntelligenceSection'
import Pricing from './Pricing'
import FAQ from './FAQ'
import FinalCtaSection from './FinalCtaSection'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function CinematicLanding() {
  const { isRTL } = useLang()
  const pageRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useHydratedReducedMotion()

  useEffect(() => {
    if (reducedMotion || !pageRef.current) return

    // Subtle page-level scroll-triggered ambient transitions
    const ctx = gsap.context(() => {
      // Refresh ScrollTrigger once DOM is settled
      ScrollTrigger.refresh()
    }, pageRef)

    return () => ctx.revert()
  }, [reducedMotion])

  return (
    <div ref={pageRef} className="relative isolate overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* 1. Hero Section with dynamic Three.js AI Node */}
      <HeroSection />

      {/* 2. Real Integration Ecosystem */}
      <IntegrationEcosystem />

      {/* 3. How It Works (4 Clear Steps) */}
      <HowItWorksSection />

      {/* 4. Core Features */}
      <FeaturesSection />

      {/* 5. Interactive Product Demonstration */}
      <ProductDemoSection />

      {/* 6. Business Use Cases */}
      <UseCasesSection />

      {/* 7. AI Intelligence & Safety Safeguards */}
      <AiIntelligenceSection />

      {/* 8. Dynamic Pricing Connected to Backend */}
      <Pricing />

      {/* 9. Comprehensive FAQ (10 Key Questions) */}
      <FAQ />

      {/* 10. High-Converting Final Conversion CTA */}
      <FinalCtaSection />
    </div>
  )
}
