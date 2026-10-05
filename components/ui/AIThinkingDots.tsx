'use client'
import { motion } from 'framer-motion'
import { aiDotAnimation } from '../../lib/motion'

export default function AIThinkingDots({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-surface-elevated border border-border ${className}`}>
      <span className="text-[10px] text-text-tertiary font-medium mr-1.5">AI</span>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-brand"
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
