'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../lib/LangContext'

const CAPABILITIES = [
  { id: 'lead',    x: 20,  y: 15,  labelAr: 'تأهيل العملاء',      labelEn: 'Lead Qualification',  icon: '🎯', delay: 0.2 },
  { id: 'support', x: 75,  y: 10,  labelAr: 'دعم العملاء',         labelEn: 'Customer Support',    icon: '💬', delay: 0.4 },
  { id: 'review',  x: 85,  y: 50,  labelAr: 'استرداد التقييمات',   labelEn: 'Review Recovery',     icon: '⭐', delay: 0.6 },
  { id: 'content', x: 70,  y: 85,  labelAr: 'توليد المحتوى',       labelEn: 'Content Generation',  icon: '✍️', delay: 0.8 },
  { id: 'sales',   x: 25,  y: 80,  labelAr: 'أتمتة المبيعات',      labelEn: 'Sales Automation',    icon: '💰', delay: 1.0 },
  { id: 'inbox',   x: 10,  y: 45,  labelAr: 'الوارد الموحد',        labelEn: 'Unified Inbox',       icon: '📥', delay: 1.2 },
]

const CONNECTIONS = [
  ['lead', 'support'], ['support', 'review'], ['review', 'content'],
  ['content', 'sales'], ['sales', 'inbox'], ['inbox', 'lead'],
  ['lead', 'review'], ['support', 'sales'], ['content', 'inbox'],
]

export default function AIBrain() {
  const { isRTL } = useLang()
  const sectionRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [activeNodes, setActiveNodes] = useState<Set<string>>(new Set())
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.2 })
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  // Activate nodes sequentially on scroll
  useEffect(() => {
    if (!visible) return
    CAPABILITIES.forEach((cap) => {
      setTimeout(() => {
        setActiveNodes(prev => new Set([...prev, cap.id]))
      }, cap.delay * 1000)
    })
  }, [visible])

  // Pulse animation — random node highlight
  useEffect(() => {
    if (!visible) return
    const ids = CAPABILITIES.map(c => c.id)
    const interval = setInterval(() => {
      const pick = ids[Math.floor(Math.random() * ids.length)]
      setHoveredNode(pick)
      setTimeout(() => setHoveredNode(null), 800)
    }, 1800)
    return () => clearInterval(interval)
  }, [visible])

  const getPos = (id: string) => CAPABILITIES.find(c => c.id === id) || CAPABILITIES[0]

  return (
    <section
      id="ai-brain"
      ref={sectionRef}
      className={`py-28 relative overflow-hidden os-section ${visible ? 'visible' : ''}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full glass"
            style={{ border: '1px solid rgba(198,255,0,0.15)' }}>
            <span style={{ color: '#C6FF00' }}>⬡</span>
            <span className="text-xs font-semibold tracking-widest" style={{ color: '#C6FF00' }}>
              {isRTL ? 'شبكة الذكاء الاصطناعي' : 'NEURAL CAPABILITY NETWORK'}
            </span>
          </div>
          <h2
            className="text-4xl sm:text-5xl font-black mb-4"
            style={{ color: '#F5F5F5', letterSpacing: '-0.04em' }}
          >
            {isRTL ? 'عقل متصل بكل شيء.' : 'A brain connected to everything.'}
          </h2>
          <p className="text-lg max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {isRTL
              ? 'قدرات تتفعل أثناء التمرير. كل عقدة تمثل قوة حقيقية.'
              : 'Capabilities activate as you scroll. Every node is real power.'}
          </p>
        </div>

        {/* Neural network SVG + nodes */}
        <div className="relative" style={{ height: 500 }}>
          {/* SVG connections */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#C6FF00" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#C6FF00" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#7DF9FF" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            {CONNECTIONS.map(([a, b], i) => {
              const pa = getPos(a), pb = getPos(b)
              const isActive = activeNodes.has(a) && activeNodes.has(b)
              const isHighlighted = hoveredNode === a || hoveredNode === b
              return (
                <line
                  key={i}
                  x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                  stroke={isHighlighted ? '#C6FF00' : 'url(#lineGrad)'}
                  strokeWidth={isHighlighted ? 0.5 : 0.25}
                  strokeOpacity={isActive ? (isHighlighted ? 0.8 : 0.35) : 0}
                  style={{ transition: 'stroke-opacity 0.5s ease, stroke-width 0.3s ease' }}
                />
              )
            })}
          </svg>

          {/* Nodes */}
          {CAPABILITIES.map((cap) => {
            const isActive = activeNodes.has(cap.id)
            const isHighlighted = hoveredNode === cap.id
            return (
              <motion.div
                key={cap.id}
                className="absolute"
                style={{
                  left: `${cap.x}%`,
                  top: `${cap.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={isActive ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as any }}
                onMouseEnter={() => setHoveredNode(cap.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Node circle */}
                <div
                  className="relative flex flex-col items-center gap-2 cursor-pointer"
                  style={{ zIndex: 10 }}
                >
                  {/* Glow ring on highlight */}
                  {isHighlighted && (
                    <motion.div
                      className="absolute rounded-full"
                      style={{
                        width: 60, height: 60,
                        border: '2px solid rgba(198,255,0,0.5)',
                        boxShadow: '0 0 30px rgba(198,255,0,0.3)',
                        top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                      }}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1.3, opacity: 0 }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    />
                  )}

                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-300"
                    style={{
                      background: isHighlighted
                        ? 'rgba(198,255,0,0.15)'
                        : 'rgba(17,17,17,0.9)',
                      border: `2px solid ${isHighlighted ? 'rgba(198,255,0,0.5)' : 'rgba(198,255,0,0.15)'}`,
                      backdropFilter: 'blur(10px)',
                      boxShadow: isHighlighted ? '0 0 30px rgba(198,255,0,0.25)' : '0 0 20px rgba(198,255,0,0.05)',
                    }}
                  >
                    {cap.icon}
                  </div>
                  <div
                    className="text-xs font-bold text-center whitespace-nowrap px-2 py-1 rounded-lg"
                    style={{
                      background: 'rgba(5,5,5,0.9)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      color: isHighlighted ? '#C6FF00' : 'rgba(255,255,255,0.6)',
                      backdropFilter: 'blur(8px)',
                      maxWidth: 120,
                    }}
                  >
                    {isRTL ? cap.labelAr : cap.labelEn}
                  </div>
                </div>
              </motion.div>
            )
          })}

          {/* Center AI Core */}
          <div
            className="absolute"
            style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={visible ? { scale: 1, opacity: 1 } : {}}
              transition={{ duration: 1, delay: 0.1 }}
              className="relative flex items-center justify-center"
              style={{ width: 80, height: 80 }}
            >
              <div className="absolute inset-0 rounded-full core-glow" style={{ borderRadius: '50%' }} />
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center core-glow"
                style={{
                  background: 'radial-gradient(circle, rgba(198,255,0,0.2) 0%, rgba(198,255,0,0.05) 60%, transparent 80%)',
                  border: '2px solid rgba(198,255,0,0.4)',
                }}
              >
                <span className="text-2xl font-black text-lime">✦</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Capability list below */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-12">
          {CAPABILITIES.map((cap, i) => (
            <motion.div
              key={cap.id}
              initial={{ opacity: 0, y: 30 }}
              animate={visible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.5 + i * 0.1 }}
              className="flex items-center gap-3 p-4 rounded-xl card-os glass"
              style={{ background: 'rgba(17,17,17,0.6)' }}
            >
              <span className="text-2xl">{cap.icon}</span>
              <span className="text-sm font-semibold" style={{ color: '#F5F5F5' }}>
                {isRTL ? cap.labelAr : cap.labelEn}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
