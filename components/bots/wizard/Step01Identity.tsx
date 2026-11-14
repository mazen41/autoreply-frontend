'use client'

import React from 'react'
import Image from 'next/image'
import { Sparkles, Check, HelpCircle, Bot, Activity } from 'lucide-react'
import { useLang } from '../../../lib/LangContext'
import { BOT_AVATARS, BotAvatarOption } from './types'

interface Step01IdentityProps {
  name: string
  setName: (name: string) => void
  description: string
  setDescription: (desc: string) => void
  avatarId: string
  setAvatarId: (id: string) => void
  status: 'active' | 'inactive' | 'draft'
  setStatus: (status: 'active' | 'inactive' | 'draft') => void
  errors?: Record<string, string>
}

export default function Step01Identity({
  name,
  setName,
  description,
  setDescription,
  avatarId,
  setAvatarId,
  status,
  setStatus,
  errors = {},
}: Step01IdentityProps) {
  const { isRTL, t } = useLang()
  const copy = t.botCreationWizard || {}

  const activeAvatar = BOT_AVATARS.find((a) => a.id === avatarId) || BOT_AVATARS[0]

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Step Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand mb-3">
          <Sparkles size={13} />
          <span>{isRTL ? 'الخطوة 01 · هوية الوكيل' : 'Step 01 · Bot Identity'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          {copy.step1Title || (isRTL ? 'لنمنح مساعدك الذكي الحياة' : "Let's bring your AI assistant to life")}
        </h1>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed max-w-xl">
          {copy.step1Subtitle ||
            (isRTL
              ? 'حدد هوية الوكيل، اسمه، وشخصيته البصرية المميزة لتمثيل نشاطك التجاري.'
              : 'Define your assistant’s identity, name, and visual persona representing your business.')}
        </p>
      </div>

      {/* Bot Name Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="bot-name" className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            {copy.botName || (isRTL ? 'اسم الوكيل' : 'Bot Name')}{' '}
            <span className="text-rose-400">*</span>
          </label>
          <span className="text-[11px] text-text-tertiary">
            {name.length}/40
          </span>
        </div>
        <div className="relative">
          <input
            id="bot-name"
            type="text"
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={copy.botNamePlaceholder || (isRTL ? 'مثال: مساعد المبيعات الذكي، سارة للدعم' : 'e.g. Sales Concierge, Support Specialist')}
            className={`w-full rounded-2xl border bg-surface-elevated/70 px-4 py-3.5 text-sm text-white placeholder:text-text-tertiary focus:outline-none focus:ring-2 transition-all ${
              errors.name
                ? 'border-rose-500/80 focus:ring-rose-500/30'
                : 'border-white/10 focus:border-brand focus:ring-brand/30'
            }`}
          />
        </div>
        {errors.name && (
          <p className="text-xs text-rose-400 font-medium">{errors.name}</p>
        )}
      </div>

      {/* Visual Avatar Selection (Mandatory 4 PNG bots) */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">
          {copy.chooseAvatar || (isRTL ? 'اختر الشخصية البصرية للمساعد' : 'Choose Visual Personality')}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {BOT_AVATARS.map((bot) => {
            const isSelected = bot.id === avatarId
            return (
              <button
                key={bot.id}
                type="button"
                onClick={() => setAvatarId(bot.id)}
                className={`group relative flex items-start gap-3.5 rounded-2xl border p-3.5 text-start transition-all duration-200 focus:outline-none ${
                  isSelected
                    ? 'border-brand bg-brand/10 shadow-lg shadow-brand/15'
                    : 'border-white/[0.08] bg-surface-elevated/40 hover:border-white/20 hover:bg-surface-elevated/80'
                }`}
              >
                {/* Bot Thumbnail with Transparent PNG */}
                <div
                  className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden p-1 flex items-center justify-center transition-transform group-hover:scale-105"
                  style={{
                    background: `radial-gradient(circle, ${bot.glowColor} 0%, rgba(15,23,42,0.8) 100%)`,
                  }}
                >
                  <Image
                    src={bot.image}
                    alt={isRTL ? bot.nameAr : bot.nameEn}
                    width={56}
                    height={56}
                    className="object-contain"
                  />
                </div>

                {/* Bot Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-bold text-white truncate">
                      {isRTL ? bot.nameAr : bot.nameEn}
                    </span>
                    {isSelected && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-brand truncate mt-0.5">
                    {isRTL ? bot.titleAr : bot.titleEn}
                  </p>
                  <p className="text-[11px] text-text-secondary line-clamp-2 mt-1 leading-relaxed">
                    {isRTL ? bot.descAr : bot.descEn}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Bot Description (Optional) */}
      <div className="space-y-2">
        <label htmlFor="bot-desc" className="text-xs font-bold uppercase tracking-wider text-text-secondary">
          {copy.botDesc || (isRTL ? 'نبذة عن الوكيل (اختياري)' : 'Short Description (Optional)')}
        </label>
        <textarea
          id="bot-desc"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={copy.botDescPlaceholder || (isRTL ? 'اكتب دور هذا الوكيل في نشاطك التجاري...' : 'Describe the assistant’s role and purpose in your business...')}
          className="w-full rounded-2xl border border-white/10 bg-surface-elevated/70 px-4 py-3 text-sm text-white placeholder:text-text-tertiary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all resize-none"
        />
      </div>

      {/* Initial Status Selector */}
      <div className="space-y-2.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">
          {copy.botStatus || (isRTL ? 'حالة الوكيل عند الإنشاء' : 'Initial Bot Status')}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: 'active',
              labelEn: 'Active',
              labelAr: 'نشط',
              descEn: 'Replies immediately',
              descAr: 'يرد فوراً على العملاء',
              color: 'border-emerald-500/40 text-emerald-400',
            },
            {
              id: 'inactive',
              labelEn: 'Paused',
              labelAr: 'متوقف مؤقتاً',
              descEn: 'Saved, won’t reply',
              descAr: 'محفوظ بدون إرسال ردود',
              color: 'border-amber-500/40 text-amber-400',
            },
            {
              id: 'draft',
              labelEn: 'Draft',
              labelAr: 'مسودة',
              descEn: 'Setup in progress',
              descAr: 'قيد التجهيز',
              color: 'border-blue-500/40 text-blue-400',
            },
          ].map((item) => {
            const isSelected = status === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setStatus(item.id as any)}
                className={`rounded-xl border p-3 text-start transition-all ${
                  isSelected
                    ? 'border-brand bg-brand/10 ring-1 ring-brand/40'
                    : 'border-white/[0.08] bg-surface-elevated/40 hover:bg-surface-elevated/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    {isRTL ? item.labelAr : item.labelEn}
                  </span>
                  {isSelected && <Check size={14} className="text-brand" />}
                </div>
                <p className="mt-1 text-[11px] text-text-tertiary truncate">
                  {isRTL ? item.descAr : item.descEn}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
