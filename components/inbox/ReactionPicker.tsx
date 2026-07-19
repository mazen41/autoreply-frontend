'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SmilePlus } from 'lucide-react'

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏']
const MORE_EMOJIS = ['🔥', '🎉', '👏', '💯', '✅', '⭐', '😍', '🤔', '😎', '🙌', '💪', '👌']

interface ReactionPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
  position: { x: number; y: number }
}

export default function ReactionPicker({ onSelect, onClose, position }: ReactionPickerProps) {
  const [expanded, setExpanded] = useState(false)
  const emojis = expanded ? [...QUICK_EMOJIS, ...MORE_EMOJIS] : QUICK_EMOJIS

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.94 }}
        transition={{ duration: 0.14 }}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 1000,
        }}
      >
        <div
          style={{
            background: 'rgba(18, 22, 24, 0.98)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 999,
            padding: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(12px)',
            maxWidth: 'calc(100vw - 24px)',
            flexWrap: expanded ? 'wrap' : 'nowrap',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onSelect(emoji)
                onClose()
              }}
              style={{
                fontSize: 20,
                width: 34,
                height: 34,
                borderRadius: 999,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'transform 0.1s, background 0.1s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.18)'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              {emoji}
            </button>
          ))}
          <button
            onClick={() => setExpanded(v => !v)}
            title={expanded ? 'Quick reactions' : 'More reactions'}
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              background: expanded ? 'rgba(37,211,102,0.16)' : 'rgba(255,255,255,0.06)',
              border: 'none',
              color: 'rgba(255,255,255,0.82)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <SmilePlus size={17} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
