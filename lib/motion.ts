import type { Transition, Variants } from 'framer-motion'

/** Shared motion timing — fast, premium, consistent */
export const motionEase = [0.22, 1, 0.36, 1] as const

export const motionDuration = {
  fast: 0.18,
  normal: 0.28,
  slow: 0.45,
} as const

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
}

export const slideInFromBottom: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
}

export const defaultTransition: Transition = {
  duration: motionDuration.normal,
  ease: motionEase,
}

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 32,
}

export const shakeVariants: Variants = {
  shake: {
    x: [0, -6, 6, -4, 4, 0],
    transition: { duration: 0.35, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
  },
}
