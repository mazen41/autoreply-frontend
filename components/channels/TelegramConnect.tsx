'use client'

import React, { useState } from 'react'
import { useLang } from '../../lib/LangContext'
import { Send, ExternalLink, Bot, QrCode, Search, Link2, Check, X } from 'lucide-react'

interface TelegramConnectProps {
  isConnected: boolean
  channel?: any
  onConnect: (data: { bot_token: string }) => Promise<void>
  onDisconnect: () => Promise<void>
}

export default function TelegramConnect({ isConnected, channel, onConnect, onDisconnect }: TelegramConnectProps) {
  const { t, isRTL } = useLang()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showInstructions, setShowInstructions] = useState(false)
  
  const [botToken, setBotToken] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await onConnect({ bot_token: botToken })
    } catch (err: any) {
      setError(err.message || 'Connection failed')
    } finally {
      setLoading(false)
    }
  }

  if (isConnected && channel) {
    const botUsername = channel.metadata?.bot_username || channel.page_id
    const botLink = channel.metadata?.bot_link || `https://t.me/${botUsername}`

    return (
      <div
        className="p-6 rounded-xl"
        style={{
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-subtle)', color: '#0088cc' }}>
              <Send size={24} />
            </div>
            <div>
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                Telegram
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                @{botUsername}
              </p>
            </div>
          </div>
          <div
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: 'var(--success-subtle)', color: 'var(--success)' }}
          >
            Connected
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <a
            href={botLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {isRTL ? 'رابط البوت:' : 'Bot link:'} {botLink}
            </span>
            <ExternalLink size={16} />
          </a>

          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {isRTL 
              ? 'شارك هذا الرابط مع عملائك حتى يتمكنوا من مراسلتك عبر تيليجرام'
              : 'Share this link with your customers so they can message you on Telegram'}
          </p>
        </div>

        <button
          onClick={onDisconnect}
          disabled={loading}
          className="w-full px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          {loading ? 'Disconnecting...' : 'Disconnect'}
        </button>
      </div>
    )
  }

  return (
    <div
      className="p-6 rounded-xl"
      style={{
        background: 'var(--surface-elevated)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-subtle)', color: '#0088cc' }}>
          <Send size={24} />
        </div>
        <div>
          <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            Telegram
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {isRTL ? 'اتصل ببوت تيليجرام للرد الآلي على العملاء' : 'Connect your Telegram bot to auto-reply to customers'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            {isRTL ? 'رمز البوت' : 'Bot Token'}
          </label>
          <input
            type="text"
            placeholder="7123456789:AAFxxx..."
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-focus)'
              e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-subtle)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => setShowInstructions(true)}
          className="text-sm font-semibold transition-colors"
          style={{ color: 'var(--accent)' }}
        >
          {isRTL ? 'ليس لديك بوت؟ أنشئ واحداً مجاناً →' : "Don't have a bot? Create one for free →"}
        </button>

        {error && (
          <div
            className="p-3 rounded-xl text-sm"
            style={{ background: 'var(--error-subtle)', color: 'var(--error)' }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
          style={{
            background: loading ? 'var(--accent-focus)' : 'var(--accent)',
            border: '1px solid var(--accent-focus)',
            color: 'white',
          }}
        >
          {loading ? (isRTL ? 'جاري الاتصال...' : 'Connecting...') : (isRTL ? 'اتصال' : 'Connect')}
        </button>
      </form>

      {showInstructions && (
        <TelegramInstructions onClose={() => setShowInstructions(false)} />
      )}
    </div>
  )
}

function TelegramInstructions({ onClose }: { onClose: () => void }) {
  const { t, isRTL } = useLang()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          {isRTL ? 'كيفية توصيل تيليجرام بـ NazBiz' : 'How to connect Telegram to NazBiz'}
        </h2>

        {/* SECTION 1 - Setup */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--accent)' }}>
            {isRTL ? 'إعداد بوت تيليجرام الخاص بك' : 'Setting up your Telegram bot'}
          </h3>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                1
              </div>
              <div>
                <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {isRTL ? 'افتح تيليجرام وابحث عن BotFather' : 'Open Telegram and find BotFather'}
                </h4>
                <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {isRTL ? 'ابحث عن @BotFather في تيليجرام (علامة التوثيق الزرقاء).' : 'Search for @BotFather in Telegram (blue verified checkmark).'}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {isRTL ? 'أو افتح مباشرة:' : 'Or open directly:'} <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>t.me/BotFather</a>
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {isRTL ? 'اضغط "ابدأ" إذا لم تستخدمه من قبل.' : 'Tap "Start" if you haven\'t used it before.'}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                2
              </div>
              <div>
                <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {isRTL ? 'أنشئ بوتاً جديداً' : 'Create a new bot'}
                </h4>
                <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {isRTL ? 'أرسل هذا الأمر:' : 'Send this command:'} <code style={{ background: 'var(--surface)', padding: '2px 6px', borderRadius: '4px' }}>/newbot</code>
                </p>
                <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {isRTL ? 'سيطلب منك BotFather شيئين:' : 'BotFather will ask for two things:'}
                </p>
                <ul className="text-sm space-y-1 ml-4" style={{ color: 'var(--text-secondary)' }}>
                  <li>• {isRTL ? 'اسم العرض (مثلاً: "دعم متجر أحمد")' : 'A display name (e.g. "Ahmed Store Support")'}</li>
                  <li>• {isRTL ? 'اسم مستخدم ينتهي بـ "bot" (مثلاً: "AhmedStoreSupportBot")' : 'A username ending in "bot" (e.g. "AhmedStoreSupportBot")'}</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                3
              </div>
              <div>
                <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {isRTL ? 'انسخ رمز البوت الخاص بك' : 'Copy your bot token'}
                </h4>
                <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {isRTL ? 'سيرد BotFather برمز البوت الخاص بك — سلسلة طويلة مثل:' : 'BotFather will reply with your bot token — a long string like:'}
                </p>
                <code style={{ display: 'block', background: 'var(--surface)', padding: '8px', borderRadius: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  7123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
                </code>
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                  {isRTL ? 'انسخ هذا الرمز بعناية — ستحتاجه في الخطوة التالية.' : 'Copy this token carefully — you\'ll need it in the next step.'}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                4
              </div>
              <div>
                <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {isRTL ? 'الصق الرمز في NazBiz' : 'Paste the token in NazBiz'}
                </h4>
                <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {isRTL ? 'عد هنا، الصق رمزك في الحقل أعلاه واضغط اتصال.' : 'Come back here, paste your token in the field above and click Connect.'}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {isRTL ? 'سيقوم NazBiz تلقائياً بإعداد كل شيء آخر.' : 'NazBiz will automatically configure everything else.'}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                5
              </div>
              <div>
                <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {isRTL ? 'شارك البوت مع عملائك' : 'Share your bot with customers'}
                </h4>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {isRTL ? 'بعد الاتصال، سترى رابط البوت (t.me/YourBotName).' : 'After connecting, you\'ll see your bot link (t.me/YourBotName).'}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {isRTL ? 'شارك هذا الرابط في كل مكان يمكن لعملائك رؤيته.' : 'Share this link everywhere your customers can see it.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2 - Customer instructions */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--accent)' }}>
            {isRTL ? 'كيف يمكن لعملائك مراسلتك' : 'How your customers can message you'}
          </h3>

          <div className="space-y-4">
            <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                  <Link2 size={16} />
                </div>
                <div>
                  <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {isRTL ? 'الخيار أ — الرابط المباشر (الأسهل)' : 'Option A — Direct Link (easiest)'}
                  </h4>
                  <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {isRTL ? 'شارك الرابط t.me/YourBotName في أي مكان:' : 'Share the link t.me/YourBotName anywhere:'}
                  </p>
                  <ul className="text-sm space-y-1 ml-4" style={{ color: 'var(--text-secondary)' }}>
                    <li>• {isRTL ? 'السيرة الشخصية على إنستغرام' : 'Instagram bio'}</li>
                    <li>• {isRTL ? 'حالة واتساب' : 'WhatsApp status'}</li>
                    <li>• {isRTL ? 'موقعك الإلكتروني' : 'Your website'}</li>
                    <li>• {isRTL ? 'بطاقة العمل QR' : 'Business card QR code'}</li>
                  </ul>
                  <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                    {isRTL ? 'العملاء يضغطون الرابط → يفتح تيليجرام → يضغطون ابدأ → يبدأون المحادثة' : 'Customers click the link → opens Telegram → tap Start → start chatting'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                  <QrCode size={16} />
                </div>
                <div>
                  <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {isRTL ? 'الخيار ب — رمز QR' : 'Option B — QR Code'}
                  </h4>
                  <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {isRTL ? 'بعد الاتصال، قم بإنشاء رمز QR لرابط البوت الخاص بك.' : 'After connecting, generate a QR code for your bot link.'}
                  </p>
                  <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {isRTL ? 'اطبعه على:' : 'Print it on:'}
                  </p>
                  <ul className="text-sm space-y-1 ml-4" style={{ color: 'var(--text-secondary)' }}>
                    <li>• {isRTL ? 'إيصالات المتجر' : 'Store receipts'}</li>
                    <li>• {isRTL ? 'تغليف المنتجات' : 'Product packaging'}</li>
                    <li>• {isRTL ? 'النشرات والقوائم' : 'Flyers and menus'}</li>
                  </ul>
                  <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                    {isRTL ? 'العملاء يمسحون → يفتح البوت → يبدأون المحادثة' : 'Customers scan → opens bot → start chatting'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                  <Search size={16} />
                </div>
                <div>
                  <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {isRTL ? 'الخيار ج — البحث في تيليجرام' : 'Option C — Telegram Username Search'}
                  </h4>
                  <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {isRTL ? 'يمكن للعملاء البحث عن اسم مستخدم البوت الخاص بك مباشرة في بحث تيليجرام.' : 'Customers can search your bot username directly in Telegram search.'}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {isRTL ? 'يجدون البوت → يضغطون ابدأ → يرد الذكاء الاصطناعي فوراً' : 'They find your bot → tap Start → AI replies instantly'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tip box */}
        <div className="p-4 rounded-xl mb-6" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-focus)' }}>
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
            💡 {isRTL 
              ? 'نصيحة: ضع رابط بوت تيليجرام في سيرتك الشخصية على إنستغرام بجانب رابط واتساب. العملاء الذين يفضلون تيليجرام سيستخدمونه، مما يمنحك قنوات أكثر تغطية بدون عمل إضافي.'
              : 'Tip: Put your Telegram bot link in your Instagram bio alongside your WhatsApp link. Customers who prefer Telegram will use it, giving you more covered channels with zero extra work.'}
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          {isRTL ? 'إغلاق' : 'Close'}
        </button>
      </div>
    </div>
  )
}