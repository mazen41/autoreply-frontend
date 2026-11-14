'use client'

import React, { useMemo } from 'react'
import { Sparkles, Check, ExternalLink, Store, MessageCircle, AlertCircle, Radio } from 'lucide-react'
import { useLang } from '../../../lib/LangContext'
import { ChannelRecord } from './types'
import ChannelIcon from '../../ui/ChannelIcon'
import { isCommunicationChannel, getCommunicationChannels } from '../botWizardUtils'

interface Step02ChannelsProps {
  channels: ChannelRecord[]
  loadingChannels: boolean
  selectedChannelIds: number[]
  setSelectedChannelIds: React.Dispatch<React.SetStateAction<number[]>>
  primaryChannelIds: number[]
  setPrimaryChannelIds: React.Dispatch<React.SetStateAction<number[]>>
  ecommerceConnectionIds: number[]
  setEcommerceConnectionIds: React.Dispatch<React.SetStateAction<number[]>>
  defaultEcommerceConnectionId: number | null
  setDefaultEcommerceConnectionId: (id: number | null) => void
  channelCommerceDefaults: Record<number, number | null>
  setChannelCommerceDefaults: React.Dispatch<React.SetStateAction<Record<number, number | null>>>
}

export default function Step02Channels({
  channels,
  loadingChannels,
  selectedChannelIds,
  setSelectedChannelIds,
  primaryChannelIds,
  setPrimaryChannelIds,
  ecommerceConnectionIds,
  setEcommerceConnectionIds,
  defaultEcommerceConnectionId,
  setDefaultEcommerceConnectionId,
  channelCommerceDefaults,
  setChannelCommerceDefaults,
}: Step02ChannelsProps) {
  const { isRTL, t } = useLang()
  const copy = t.botCreationWizard || {}

  const communicationChannels = useMemo(() => getCommunicationChannels(channels), [channels])
  const connectedCommerceStores = useMemo(
    () => channels.filter((ch) => !isCommunicationChannel(ch) && ch.status === 'connected'),
    [channels]
  )

  const toggleChannel = (id: number) => {
    setSelectedChannelIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    )
    setPrimaryChannelIds((current) => current.filter((item) => item !== id))
  }

  const togglePrimary = (id: number) => {
    setPrimaryChannelIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    )
  }

  const toggleStore = (storeId: number) => {
    const selected = ecommerceConnectionIds.includes(storeId)
    const next = selected
      ? ecommerceConnectionIds.filter((id) => id !== storeId)
      : [...ecommerceConnectionIds, storeId]
    setEcommerceConnectionIds(next)

    if (selected && defaultEcommerceConnectionId === storeId) {
      setDefaultEcommerceConnectionId(next[0] ?? null)
    } else if (!selected && defaultEcommerceConnectionId === null) {
      setDefaultEcommerceConnectionId(storeId)
    }
  }

  const changeStoreRoute = (channelId: number, storeId: number | null) => {
    setChannelCommerceDefaults((current) => ({ ...current, [channelId]: storeId }))
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Step Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 mb-3">
          <Sparkles size={13} />
          <span>{isRTL ? 'الخطوة 02 · القنوات والمتاجر' : 'Step 02 · Channels & Stores'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          {copy.step2Title || (isRTL ? 'أين تريد لمساعدك أن يتواصل؟' : 'Where should your assistant communicate?')}
        </h1>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed max-w-xl">
          {copy.step2Subtitle ||
            (isRTL
              ? 'اربط الوكيل بحسابات التواصل الاجتماعي والمتاجر الإلكترونية النشطة لخدمة عملائك.'
              : 'Connect your assistant to your live messaging channels and e-commerce stores.')}
        </p>
      </div>

      {/* ── Communication Channels Section ────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-brand" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              {copy.messagingSection || (isRTL ? 'قنوات المحادثة والتواصل' : 'Messaging Channels')}
            </h2>
          </div>
          <span className="text-xs font-semibold text-text-tertiary">
            {selectedChannelIds.length} {isRTL ? 'محددة' : 'selected'}
          </span>
        </div>

        {loadingChannels ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl border border-white/5 bg-surface-elevated/40 animate-pulse" />
            ))}
          </div>
        ) : communicationChannels.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-surface-elevated/30 p-6 text-center">
            <p className="text-sm text-text-secondary mb-3">
              {isRTL ? 'لا توجد قنوات تواصل متصلة حالياً.' : 'No communication channels connected yet.'}
            </p>
            <a
              href="/dashboard/channels"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white shadow-md hover:brightness-110"
            >
              <span>{copy.connectAction || (isRTL ? 'ربط قناة جديدة' : 'Connect New Channel')}</span>
              <ExternalLink size={13} />
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {communicationChannels.map((channel) => {
              const isSelected = selectedChannelIds.includes(channel.id)
              const isPrimary = primaryChannelIds.includes(channel.id)
              const assignedStoreId = channelCommerceDefaults[channel.id] ?? defaultEcommerceConnectionId

              return (
                <div
                  key={channel.id}
                  className={`relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 ${
                    isSelected
                      ? 'border-brand bg-brand/10 shadow-lg shadow-brand/10 ring-1 ring-brand/30'
                      : 'border-white/[0.08] bg-surface-elevated/50 hover:border-white/20 hover:bg-surface-elevated/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface border border-white/10 shadow-inner">
                        <ChannelIcon type={channel.type as any} size={22} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-white">
                          {channel.page_name || channel.page_id || channel.type}
                        </h3>
                        <p className="text-xs text-text-tertiary capitalize">
                          {channel.type} · {channel.page_id || channel.id}
                        </p>
                      </div>
                    </div>

                    {/* Toggle Checkbox Button */}
                    <button
                      type="button"
                      onClick={() => toggleChannel(channel.id)}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all ${
                        isSelected
                          ? 'border-brand bg-brand text-white shadow-sm'
                          : 'border-white/20 bg-white/5 hover:border-white/40'
                      }`}
                    >
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </button>
                  </div>

                  {/* Config Drawer when selected */}
                  {isSelected && (
                    <div className="mt-4 pt-3 border-t border-white/[0.08] space-y-3">
                      {/* Primary Agent Toggle */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-secondary">
                          {copy.primaryBadge || (isRTL ? 'المجيب الأساسي' : 'Primary Responder')}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePrimary(channel.id)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border transition-all ${
                            isPrimary
                              ? 'border-brand/40 bg-brand/20 text-brand'
                              : 'border-white/10 bg-white/5 text-text-tertiary hover:text-white'
                          }`}
                        >
                          {isPrimary ? (isRTL ? 'مفعّل كاستجابة أولى' : 'Active Primary') : (isRTL ? 'تعيين كأساسي' : 'Set as Primary')}
                        </button>
                      </div>

                      {/* Store Route Selector if stores exist */}
                      {connectedCommerceStores.length > 0 && (
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-text-tertiary">
                            {copy.storeRouteLabel || (isRTL ? 'المتجر المرتبط' : 'Store Route')}
                          </label>
                          <select
                            value={channelCommerceDefaults[channel.id] ?? ''}
                            onChange={(e) =>
                              changeStoreRoute(channel.id, e.target.value ? Number(e.target.value) : null)
                            }
                            className="w-full rounded-xl border border-white/10 bg-surface px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand"
                          >
                            <option value="">
                              {copy.autoStore || (isRTL ? 'استخدام متجر الوكيل الافتراضي' : 'Use Bot Default Store')}
                            </option>
                            {connectedCommerceStores.map((store) => (
                              <option key={store.id} value={store.id}>
                                {store.type.toUpperCase()} — {store.page_name || store.page_id || `Store #${store.id}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── E-Commerce Stores Section ─────────────────────────── */}
      <div className="space-y-4 pt-2 border-t border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store size={18} className="text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              {copy.commerceSection || (isRTL ? 'المتاجر الإلكترونية المتصلة' : 'Connected Commerce Stores')}
            </h2>
          </div>
          <span className="text-xs font-semibold text-text-tertiary">
            {ecommerceConnectionIds.length} {isRTL ? 'مفعلة' : 'enabled'}
          </span>
        </div>

        {connectedCommerceStores.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-surface-elevated/20 p-5 text-center">
            <p className="text-xs text-text-tertiary">
              {isRTL
                ? 'لا توجد متاجر إلكترونية مربوطة (سلة، شوبيفاي، ووكومرس). يمكنك ربط متجرك من صفحة القنوات في أي وقت.'
                : 'No store connected (Salla, Shopify, WooCommerce). You can connect one anytime in Channels.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {connectedCommerceStores.map((store) => {
              const isSelected = ecommerceConnectionIds.includes(store.id)
              const isDefault = defaultEcommerceConnectionId === store.id

              return (
                <div
                  key={store.id}
                  className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition-all ${
                    isSelected
                      ? 'border-cyan-500/40 bg-cyan-500/10'
                      : 'border-white/[0.08] bg-surface-elevated/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleStore(store.id)}
                      className={`flex h-5 w-5 items-center justify-center rounded-lg border transition-all ${
                        isSelected ? 'border-cyan-400 bg-cyan-500 text-black' : 'border-white/20 bg-white/5'
                      }`}
                    >
                      {isSelected && <Check size={13} strokeWidth={3} />}
                    </button>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase">
                        {store.type} — {store.page_name || store.page_id || `Store #${store.id}`}
                      </h4>
                      <p className="text-[11px] text-text-tertiary">
                        {store.status === 'connected' ? (isRTL ? 'متصل وجاهز للاستعلام' : 'Connected & Active') : store.status}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <button
                      type="button"
                      onClick={() => setDefaultEcommerceConnectionId(store.id)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border transition-all ${
                        isDefault
                          ? 'border-cyan-400/50 bg-cyan-400/20 text-cyan-300'
                          : 'border-white/10 text-text-tertiary hover:text-white'
                      }`}
                    >
                      {isDefault ? (isRTL ? 'المتجر الافتراضي' : 'Default Store') : (isRTL ? 'تعيين كافتراضي' : 'Make Default')}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
