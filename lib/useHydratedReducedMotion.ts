'use client'

import { useSyncExternalStore } from 'react'
import { useReducedMotion } from 'framer-motion'

/**
 * Keep server and first client render consistent; Framer Motion reads the
 * browser preference only after hydration to avoid markup/style mismatches.
 */
export function useHydratedReducedMotion(): boolean {
  const preference = useReducedMotion()
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  )

  return hydrated && preference === true
}
