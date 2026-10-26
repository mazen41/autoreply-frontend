'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import ChannelIcon from '../ui/ChannelIcon'
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, ShieldCheck, Mail } from 'lucide-react'

export interface ChannelOption {
  id: 'instagram' | 'facebook' | 'whatsapp' | 'telegram' | 'gmail' | 'salla' | 'shopify' | 'woocommerce'
  name: string
  description: string
  category: 'messaging' | 'social' | 'ecommerce' | 'email'
  brandColor: string
  icon?: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }> | string
}

type ChannelIconId = Parameters<typeof ChannelIcon>[0]['type']

export const ALL_CHANNELS: ChannelOption[] = [
  { id: 'instagram', name: 'Instagram', description: 'Supported direct messages and comment replies for professional accounts.', category: 'social', brandColor: '#E4405F', icon: '/icons/instagram.svg' },
  { id: 'facebook', name: 'Facebook Messenger', description: 'Supported Page conversations and comment replies.', category: 'social', brandColor: '#1877F2', icon: '/icons/facebook.svg' },
  { id: 'whatsapp', name: 'WhatsApp Business', description: 'Cloud API or compatible instance; available features depend on provider.', category: 'messaging', brandColor: '#25D366' },
  { id: 'telegram', name: 'Telegram', description: 'Customer conversations through a connected Telegram bot.', category: 'messaging', brandColor: '#0088CC' },
  { id: 'gmail', name: 'Gmail & Google Workspace', description: 'Sync email conversations and send supported replies.', category: 'email', brandColor: '#EA4335', icon: Mail },
  { id: 'salla', name: 'Salla', description: 'Sync a store catalog and order data for commerce-aware conversations.', category: 'ecommerce', brandColor: '#00B4D8', icon: '/icons/sllla.svg' },
  { id: 'shopify', name: 'Shopify', description: 'Sync a store catalog, customers and orders.', category: 'ecommerce', brandColor: '#96BF48' },
  { id: 'woocommerce', name: 'WooCommerce', description: 'Sync a store catalog, customers and orders.', category: 'ecommerce', brandColor: '#96588A' },
]

export interface ChannelConnectWizardProps {
  isOpen: boolean
  onClose: () => void
  initialChannel?: ChannelOption | null
  onContinueConnection: (channel: ChannelOption) => Promise<void>
  isRTL?: boolean
}

export default function ChannelConnectWizard({ isOpen, onClose, initialChannel, onContinueConnection, isRTL = false }: ChannelConnectWizardProps) {
  const [step, setStep] = useState<1 | 2>(initialChannel ? 2 : 1)
  const [selectedChannel, setSelectedChannel] = useState<ChannelOption>(initialChannel || ALL_CHANNELS[0])
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchFilter, setSearchFilter] = useState('')
  const t = (en: string, ar: string) => isRTL ? ar : en
  const channelLabel = (channel: ChannelOption) => isRTL ? ({
    instagram: 'إنستغرام', facebook: 'فيسبوك ماسنجر', whatsapp: 'واتساب للأعمال', telegram: 'تيليجرام',
    gmail: 'Gmail وGoogle Workspace', salla: 'سلة', shopify: 'شوبيفاي', woocommerce: 'WooCommerce',
  }[channel.id]) : channel.name
  const channelDescription = (channel: ChannelOption) => isRTL ? ({
    instagram: 'رسائل مباشرة مدعومة وردود على التعليقات للحسابات الاحترافية.',
    facebook: 'محادثات الصفحة المدعومة والرد على التعليقات.',
    whatsapp: 'واجهة Cloud API أو اتصال متوافق؛ تعتمد الميزات المتاحة على المزود.',
    telegram: 'محادثات العملاء عبر بوت تيليجرام متصل.',
    gmail: 'مزامنة محادثات البريد الإلكتروني وإرسال الردود المدعومة.',
    salla: 'مزامنة كتالوج المتجر وبيانات الطلبات لدعم المحادثات.',
    shopify: 'مزامنة كتالوج المتجر والعملاء والطلبات.',
    woocommerce: 'مزامنة كتالوج المتجر والعملاء والطلبات.',
  }[channel.id]) : channel.description

  const handleSelectChannel = (channel: ChannelOption) => {
    setSelectedChannel(channel)
    setAuthError(null)
    setStep(2)
  }

  const handleAuthenticate = async () => {
    setAuthLoading(true)
    setAuthError(null)
    try {
      await onContinueConnection(selectedChannel)
      onClose()
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'This integration could not be started.')
    } finally {
      setAuthLoading(false)
    }
  }

  const filteredChannels = ALL_CHANNELS.filter((channel) => {
    const matchesCategory = activeCategory === 'all' || channel.category === activeCategory
    const query = searchFilter.toLowerCase()
    return matchesCategory && (channel.name.toLowerCase().includes(query) || channel.description.toLowerCase().includes(query) || channelLabel(channel).toLowerCase().includes(query) || channelDescription(channel).toLowerCase().includes(query))
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" className="p-0 overflow-hidden">
      <div dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="px-6 py-4 bg-surface-elevated/40 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-bold text-xs">{step}</div>
          <div>
            <h3 className="text-sm font-bold text-text-primary tracking-tight">
              {step === 1 ? t('Step 1: Choose Integration', 'الخطوة 1: اختر التكامل') : t(`Step 2: Connect ${selectedChannel.name}`, `الخطوة 2: ربط ${channelLabel(selectedChannel)}`)}
            </h3>
            <p className="text-[11px] text-text-tertiary">
              {step === 1 ? t('Select a supported channel or store integration', 'اختر قناة أو تكاملاً مع متجرك') : t('Continue with the secure setup for this integration', 'تابع إعداد الاتصال الآمن لهذا التكامل')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          {[1, 2].map((item) => <div key={item} className={`h-1.5 rounded-full transition-all ${item === step ? 'w-6 bg-brand' : item < step ? 'w-2 bg-success' : 'w-2 bg-border'}`} />)}
        </div>
      </div>

      {step === 1 && (
        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {[
                { id: 'all', label: t('All Channels', 'كل القنوات') },
                { id: 'social', label: t('Social', 'التواصل الاجتماعي') },
                { id: 'messaging', label: t('Direct Messaging', 'المراسلة المباشرة') },
                { id: 'ecommerce', label: t('E-Commerce', 'التجارة الإلكترونية') },
                { id: 'email', label: t('Email', 'البريد الإلكتروني') },
              ].map((category) => (
                <button key={category.id} type="button" onClick={() => setActiveCategory(category.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0 ${activeCategory === category.id ? 'bg-brand/10 border-brand/30 text-brand font-semibold' : 'bg-surface-elevated border-border text-text-secondary hover:text-text-primary'}`}>
                  {category.label}
                </button>
              ))}
            </div>
            <div className="w-full sm:w-56"><Input placeholder={t('Search platforms...', 'ابحث عن منصة...')} value={searchFilter} onChange={(event) => setSearchFilter(event.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[50vh] overflow-y-auto pr-1">
            {filteredChannels.map((channel) => (
              <button key={channel.id} type="button" onClick={() => handleSelectChannel(channel)} className={`p-4 rounded-xl border border-border bg-surface-elevated/40 hover:bg-surface-elevated hover:border-brand/40 ${isRTL ? 'text-right' : 'text-left'} transition-all flex flex-col justify-between group shadow-xs`}>
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center p-2 bg-surface-card border" style={{ borderColor: `color-mix(in srgb, ${channel.brandColor} 30%, var(--border))` }}>
                      {typeof channel.icon === 'string' ? (
                        <Image src={channel.icon} alt={channel.name} width={22} height={22} className="w-[22px] h-[22px] object-contain" unoptimized />
                      ) : channel.icon ? (
                        <channel.icon size={22} className="w-[22px] h-[22px]" style={{ color: channel.brandColor }} />
                      ) : (
                        <ChannelIcon type={channel.id as ChannelIconId} size={22} />
                      )}
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-text-primary group-hover:text-brand transition-colors">{channelLabel(channel)}</h4>
                  <p className="text-[11px] text-text-tertiary mt-1 line-clamp-2 leading-relaxed">{channelDescription(channel)}</p>
                </div>
                <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between text-[11px] font-semibold text-brand"><span>{t('Connect', 'ربط')}</span>{isRTL ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-surface-elevated border border-border">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center p-2.5 bg-surface-card border" style={{ borderColor: `color-mix(in srgb, ${selectedChannel.brandColor} 30%, var(--border))` }}>
              {typeof selectedChannel.icon === 'string' ? (
                <Image src={selectedChannel.icon} alt={selectedChannel.name} width={28} height={28} className="w-7 h-7 object-contain" unoptimized />
              ) : selectedChannel.icon ? (
                <selectedChannel.icon size={28} className="w-7 h-7" style={{ color: selectedChannel.brandColor }} />
              ) : (
                <ChannelIcon type={selectedChannel.id as ChannelIconId} size={28} />
              )}
            </div>
            <div><h4 className="text-sm font-bold text-text-primary">{t(`Connect ${selectedChannel.name} to NazBiz`, `ربط ${channelLabel(selectedChannel)} بـ NazBiz`)}</h4><p className="text-xs text-text-secondary mt-0.5">{t('Review the authorization or connection steps for this integration.', 'راجع خطوات التفويض أو الاتصال لهذا التكامل.')}</p></div>
          </div>
          <div className="p-4 rounded-xl bg-surface-elevated/40 border border-border space-y-3">
            <div className="text-xs font-semibold text-text-primary flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-brand" /><span>{t('Connection permissions', 'أذونات الاتصال')}</span></div>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" /><span>{t('Available messaging and store features depend on this integration.', 'تعتمد ميزات المراسلة والمتجر المتاحة على هذا التكامل.')}</span></li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" /><span>{t('Review provider permissions or connection details before continuing.', 'راجع أذونات المزود أو تفاصيل الاتصال قبل المتابعة.')}</span></li>
            </ul>
          </div>
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-success/10 border border-success/20 text-success text-xs"><Lock className="w-4 h-4 shrink-0" /><span>{t('Only continue if the displayed connection method and requested access are expected.', 'تابع فقط إذا كانت طريقة الاتصال والصلاحيات المطلوبة متوقعة.')}</span></div>
          {authError && <div role="alert" className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-xs text-error">{authError}</div>}
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" size="sm" icon={isRTL ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />} onClick={() => setStep(1)}>{t('Back', 'رجوع')}</Button>
            <Button variant="primary" size="md" loading={authLoading} onClick={handleAuthenticate}>{authLoading ? t('Connecting…', 'جارٍ الاتصال…') : t('Continue setup', 'متابعة الإعداد')}</Button>
          </div>
        </div>
      )}
      </div>
    </Modal>
  )
}
