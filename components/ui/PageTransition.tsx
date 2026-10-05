'use client'
import { motion } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import { variants, springs } from '../../lib/motion'

export default function PageTransition({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const shouldReduceMotion = useReducedMotion()
  return (
    <motion.div
      className={`w-full ${className}`}
      initial={shouldReduceMotion ? false : 'hidden'}
      animate="visible"
      variants={variants.page}
      transition={springs.smooth}
    >
      {children}
    </motion.div>
  )
}
