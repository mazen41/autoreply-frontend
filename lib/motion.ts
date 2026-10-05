/**
 * NazBiz Motion System
 * Spring presets and animation variants — use these everywhere.
 * Never invent custom durations or easings in components.
 */
import type { Transition, Variants } from 'framer-motion'

// ─── Spring Presets ───────────────────────────────────────────────────────────

export const springs = {
  /** Fast snap — toggles, checkboxes, active states */
  snap: { type: 'spring', stiffness: 400, damping: 35, mass: 0.8 } as Transition,

  /** Standard — menus, dropdowns, most UI transitions */
  standard: { type: 'spring', stiffness: 300, damping: 28, mass: 1 } as Transition,

  /** Gentle — modals, drawers, large panels */
  gentle: { type: 'spring', stiffness: 200, damping: 25, mass: 1.2 } as Transition,

  /** Bouncy — notifications, badges, success states ONLY */
  bouncy: { type: 'spring', stiffness: 400, damping: 15, mass: 0.8 } as Transition,

  /** Smooth — opacity / color fades */
  smooth: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } as Transition,
} as const

// ─── Animation Variants ───────────────────────────────────────────────────────

export const variants = {
  /** Fade + rise — standard entrance for most elements */
  fadeUp: {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
  } as Variants,

  /** Fade only — content that doesn't need directional motion */
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  } as Variants,

  /** Scale in — modals, popovers, tooltips */
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  } as Variants,

  /** Slide in from right — drawers, context panels */
  slideRight: {
    hidden: { opacity: 0, x: 24 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 24 },
  } as Variants,

  /** Slide in from left — reverse drawers */
  slideLeft: {
    hidden: { opacity: 0, x: -24 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
  } as Variants,

  /** Stagger container — wraps staggered list children */
  staggerContainer: {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
  } as Variants,

  /** Dropdown menu */
  dropdown: {
    hidden: { opacity: 0, scale: 0.96, y: -8 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.96, y: -8 },
  } as Variants,

  /** Toast notification */
  toast: {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.9, x: 20 },
  } as Variants,

  /** Modal */
  modal: {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.97, y: 10 },
  } as Variants,

  /** Drawer from right */
  drawerRight: {
    hidden: { x: '100%' },
    visible: { x: 0 },
    exit: { x: '100%' },
  } as Variants,

  /** Page route transition */
  page: {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  } as Variants,
} as const

// ─── Validation shake (for form errors) ──────────────────────────────────────
export const shakeX = {
  x: [0, -5, 5, -5, 5, -3, 3, 0],
  transition: { duration: 0.45, ease: 'easeInOut' },
}

// ─── Icon hover animations ────────────────────────────────────────────────────
export const iconHover = {
  /** Nav icons — subtle lift */
  nav: { scale: 1.1, y: -1, transition: springs.snap },

  /** Settings gear — rotate */
  gear: { rotate: 45, transition: springs.standard },

  /** Trash — shake + scale */
  trash: { x: [0, -2, 2, -2, 2, 0], scale: 1.05, transition: { duration: 0.3 } },

  /** Plus — rotate to X feel */
  plus: { rotate: 45, transition: springs.snap },

  /** Refresh — spin */
  refresh: (isLoading: boolean) => ({
    rotate: isLoading ? 360 : 0,
    transition: isLoading
      ? { duration: 0.8, repeat: Infinity, ease: 'linear' }
      : springs.snap,
  }),
}

// ─── AI Thinking Dot Config ───────────────────────────────────────────────────
export const aiDotAnimation = (index: number) => ({
  animate: { y: [0, -4, 0] },
  transition: {
    duration: 0.6,
    repeat: Infinity,
    delay: index * 0.15,
    ease: 'easeInOut',
  },
})

// ─── Legacy / Compat exports (used by blog pages) ────────────────────────────
/** @deprecated use variants.fadeUp */
export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}
/** @deprecated use variants.fade */
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}
/** @deprecated use variants.staggerContainer */
export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}
/** @deprecated use springs.standard */
export const defaultTransition = { type: 'spring' as const, stiffness: 300, damping: 28, mass: 1 }
