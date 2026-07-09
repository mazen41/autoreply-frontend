'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

const CHANNELS_DEFS = [
  { id: 'facebook',  icon: '🔵', name: 'Facebook',       nameAr: 'فيسبوك ماسنجر',    color: '#1877F2', plan: 'free',     locked: false },
  { id: 'instagram', icon: '📸', name: 'Instagram',      nameAr: 'انستقرام',          color: '#E1306C', plan: 'free',     locked: false },
  { id: 'gmail',     icon: '📧', name: 'Gmail',          nameAr: 'البريد الإلكتروني', color: '#EA4335', plan: 'free',     locked: false },
  { id: 'reviews',   icon: '⭐', name: 'Google Reviews', nameAr: 'تقييمات جوجل',      color: '#FBBC05', plan: 'free',     locked: false },
  { id: 'whatsapp',  icon: '💬', name: 'WhatsApp',       nameAr: 'واتساب',            color: '#25D366', plan: 'business', locked: true  },
  { id: 'webchat',   icon: '🌐', name: 'Website Chat',   nameAr: 'شات الموقع',        color: '#7DF9FF', plan: 'starter',  locked: true  },
]

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
      className='fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl'
      style={{ background: type === 'success' ? 'rgba(198,255,0,0.1)' : 'rgba(255,59,48,0.1)', border: 1px solid , color: type === 'success' ? '#C6FF00' : '#FF6B6B', backdropFilter: 'blur(12px)', whiteSpace: 'nowrap' }}>
      {msg}
    </motion.div>
  )
}
