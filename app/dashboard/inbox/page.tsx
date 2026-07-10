'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInbox, ApiConversation, ApiMessage } from '../../../hooks/useInbox'
import { useLang } from '../../../lib/LangContext'
import { useTheme } from '../../../lib/ThemeContext'
import ChannelIcon from '../../../components/ui/ChannelIcon'

function channelMeta(type: string) {
  if (type === 'facebook')  return { label: 'FB',  color: '#1877F2', glow: 'rgba(24,119,242,0.35)' }
  if (type === 'instagram') return { label: 'IG',  color: '#E1306C', glow: 'rgba(225,48,108,0.35)' }
  if (type === 'gmail')     return { label: 'GM',  color: '#EA4335', glow: 'rgba(234,67,53,0.35)'  }
  if (type === 'whatsapp') return { label: 'WA',  color: '#25D366', glow: 'rgba(37,211,102,0.35)' }
  return { label: '??', color: '#888', glow: 'rgba(136,136,136,0.2)' }
}

function senderLabel(conv: ApiConversation) {
  if (conv.sender_name && conv.sender_name.trim()) return conv.sender_name.trim()
  if (conv.sender_email) return conv.sender_email
  return `···${conv.sender_id.slice(-4)}`
}

function senderInitial(conv: ApiConversation) {
  return senderLabel(conv).charAt(0).toUpperCase()
}

function formatTimestamp(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH   = Math.floor(diffMs / 3600000)
  const diffD   = Math.floor(diffMs / 86400000)
  if (diffMin < 1)  return 'just now'
  if (diffMin < 60) return `${diffMin}m`
  if (diffH < 24)   return `${diffH}h`
  if (diffD < 7)    return `${diffD}d`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatMsgTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function groupMessagesByDate(msgs: ApiMessage[]) {
  const groups: { date: string; messages: ApiMessage[] }[] = []
  msgs.forEach(msg => {
    const d = new Date(msg.created_at)
    const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    const last = groups[groups.length - 1]
    if (last && last.date === label) last.messages.push(msg)
    else groups.push({ date: label, messages: [msg] })
  })
  return groups
}

function ConvSkeleton() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px' }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 11, borderRadius: 6, background: 'rgba(255,255,255,0.06)', width: '55%', marginBottom: 6 }} />
        <div style={{ height: 9, borderRadius: 6, background: 'rgba(255,255,255,0.04)', width: '80%' }} />
      </div>
    </div>
  )
}

function ConvRow({ conv, active, onClick }: { conv: ApiConversation; active: boolean; onClick: () => void }) {
  const ch = channelMeta(conv.channel?.type)
  const preview = conv.latest_message?.content ?? conv.subject ?? '—'
  const isAI = conv.latest_message?.is_ai
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 2 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
        padding: '11px 16px', textAlign: 'left',
        background: active ? 'rgba(108,99,255,0.06)' : 'transparent',
        cursor: 'pointer', transition: 'background 0.15s', border: 'none',
        borderLeftWidth: 3, borderLeftStyle: 'solid',
        borderLeftColor: active ? 'var(--primary)' : 'transparent',
        borderBottomWidth: 1, borderBottomStyle: 'solid',
        borderBottomColor: 'var(--border)',
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <ChannelIcon type={(conv.channel?.type || 'facebook') as any} size={40} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: active ? 'var(--text-primary)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
            {senderLabel(conv)}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', flexShrink: 0 }}>
            {formatTimestamp(conv.last_message_at)}
          </span>
        </div>
        {conv.subject && conv.channel?.type === 'gmail' && (
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
            {conv.subject}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {isAI && <span style={{ fontSize: 9, color: 'var(--primary)', opacity: 0.7 }}>⚡</span>}
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {preview.slice(0, 60)}
          </span>
        </div>
      </div>
      {conv.is_active && (
        <div className="w-2 h-2 rounded-full status-live" style={{ background: 'var(--success)' }} />
      )}
    </motion.button>
  )
}

function MsgBubble({ msg }: { msg: ApiMessage }) {
  const isIn = msg.direction === 'inbound'
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.16 }}
      style={{ display: 'flex', justifyContent: isIn ? 'flex-start' : 'flex-end' }}
    >
      <div style={{ maxWidth: '68%' }}>
        <div style={{
          padding: '10px 14px',
          borderRadius: isIn ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
          background: isIn ? 'var(--surface)' : msg.is_ai ? 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(108,99,255,0.04))' : 'rgba(100,180,255,0.09)',
          border: `1px solid ${isIn ? 'var(--border)' : msg.is_ai ? 'rgba(108,99,255,0.18)' : 'rgba(100,180,255,0.18)'}`,
          fontSize: 13, lineHeight: 1.55,
          color: isIn ? 'var(--text-primary)' : 'var(--text-primary)',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {msg.content}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, paddingInline: 4, justifyContent: isIn ? 'flex-start' : 'flex-end' }}>
          {!isIn && msg.is_ai && <span style={{ fontSize: 9, color: 'var(--primary)', opacity: 0.6 }}>⚡ AI</span>}
          {!isIn && !msg.is_ai && <span style={{ fontSize: 9, color: 'rgba(100,180,255,0.6)' }}>↩ manual</span>}
          <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{formatMsgTime(msg.created_at)}</span>
        </div>
      </div>
    </motion.div>
  )
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'gmail', label: 'Gmail' },
  { id: 'facebook', label: 'FB' },
  { id: 'instagram', label: 'IG' },
]

export default function InboxPage() {
  const { isRTL, t } = useLang()
  const { theme } = useTheme()
  const {
    conversations, messages, selectedId, selectedConv,
    loadingConvs, loadingMsgs, sending, error,
    fetchConversations, selectConversation, sendReply,
  } = useInbox()

  const [filter, setFilter]         = useState('all')
  const [search, setSearch]         = useState('')
  const [reply, setReply]           = useState('')
  const [optimistic, setOptimistic] = useState<ApiMessage[]>([])
  const [mobilePane, setMobilePane] = useState<'list' | 'chat'>('list')
  const [toast, setToast]           = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, optimistic])
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t) } }, [toast])

  const allMessages = [...messages, ...optimistic]
  const grouped = groupMessagesByDate(allMessages)
  const filtered = conversations.filter(c => {
    const matchType = filter === 'all' || c.channel?.type === filter
    const q = search.toLowerCase()
    return matchType && (!q || senderLabel(c).toLowerCase().includes(q) || (c.subject ?? '').toLowerCase().includes(q) || (c.latest_message?.content ?? '').toLowerCase().includes(q))
  })

  function handleSelect(id: number) {
    setOptimistic([])
    selectConversation(id)
    setMobilePane('chat')
  }

  async function handleSend() {
    if (!reply.trim() || !selectedId) return
    const text = reply.trim()
    setReply('')
    const temp: ApiMessage = { id: Date.now(), conversation_id: selectedId, content: text, direction: 'outbound', is_ai: false, status: 'manual', created_at: new Date().toISOString() }
    setOptimistic(p => [...p, temp])
    const ok = await sendReply(selectedId, text)
    if (!ok) { setOptimistic(p => p.filter(m => m.id !== temp.id)); setReply(text); setToast('Failed to send. Try again.') }
    else setOptimistic([])
  }

  const ch = selectedConv ? channelMeta(selectedConv.channel?.type) : null

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', background: 'var(--background)', overflow: 'hidden', fontFamily: 'inherit' }}>

      {/* LEFT: conversation list */}
      <div style={{
        width: 300, flexShrink: 0, display: mobilePane === 'chat' ? 'none' : 'flex',
        flexDirection: 'column', borderRight: '1px solid var(--border)',
        background: 'var(--surface)',
      }} className="md-inbox-list">

        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t.inbox.title}</span>
            <button onClick={() => fetchConversations()} title="Refresh" style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↻</button>
          </div>
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-secondary)' }}>⌕</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.common.search} style={{ width: '100%', padding: '8px 10px 8px 28px', borderRadius: 10, background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: filter === f.id ? 'rgba(108,99,255,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${filter === f.id ? 'rgba(108,99,255,0.3)' : 'var(--border)'}`, color: filter === f.id ? 'var(--primary)' : 'var(--text-secondary)' }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {error ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <p style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 12 }}>{error}</p>
              <button onClick={() => fetchConversations()} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 11, cursor: 'pointer', background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.2)', color: 'var(--danger)' }}>{t.common.retry}</button>
            </div>
          ) : loadingConvs ? (
            Array.from({ length: 6 }).map((_, i) => <ConvSkeleton key={i} />)
          ) : filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{search ? 'No results' : t.inbox.noConversations}</p>
            </div>
          ) : filtered.map(conv => (
            <ConvRow key={conv.id} conv={conv} active={selectedId === conv.id} onClick={() => handleSelect(conv.id)} />
          ))}
        </div>

        {!loadingConvs && filtered.length > 0 && (
          <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--text-secondary)', textAlign: 'center' }}>
            {filtered.length} conversation{filtered.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* RIGHT: chat */}
      <div style={{ flex: 1, display: mobilePane === 'list' ? 'none' : 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--background)' }} className="md-inbox-chat">
        {!selectedConv ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(108,99,255,0.05)', border: '1px solid rgba(108,99,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📥</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t.inbox.selectConversation}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{conversations.length} total · pick from the left</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => setMobilePane('list')} className="mobile-back-btn" style={{ width: 32, height: 32, borderRadius: 8, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                <ChannelIcon type={(selectedConv.channel?.type || 'facebook') as any} size={36} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{senderLabel(selectedConv)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: 'rgba(108,99,255,0.12)', color: 'var(--primary)', border: '1px solid rgba(108,99,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{selectedConv.channel?.type}</span>
                    {selectedConv.subject && <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{selectedConv.subject}</span>}
                  </div>
                </div>
              </div>
              <button style={{ padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{t.common.close}</button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {loadingMsgs ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[false, true, false].map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: r ? 'flex-end' : 'flex-start' }}>
                      <div style={{ height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.05)', width: '45%' }} />
                    </div>
                  ))}
                </div>
              ) : allMessages.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 28 }}>💬</span>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{t.inbox.noConversations}</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {grouped.map(group => (
                    <div key={group.date} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0' }}>
                        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                        <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{group.date}</span>
                        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                      </div>
                      {group.messages.map(msg => <MsgBubble key={msg.id} msg={msg} />)}
                    </div>
                  ))}
                </AnimatePresence>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Reply box */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface)', backdropFilter: 'blur(12px)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', background: 'var(--background)', border: `1px solid ${reply ? 'rgba(108,99,255,0.2)' : 'var(--border)'}`, borderRadius: 14, padding: '10px 14px', transition: 'border-color 0.2s' }}>
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSend() } }}
                  rows={2}
                  placeholder={t.inbox.typeMessage}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 13, resize: 'none', lineHeight: 1.5, fontFamily: 'inherit' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!reply.trim() || sending}
                  style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: !reply.trim() || sending ? 'rgba(108,99,255,0.15)' : 'var(--primary)', border: 'none', cursor: !reply.trim() || sending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: theme === 'dark' ? '#0A0A0F' : '#F4F4FF', fontWeight: 900, opacity: !reply.trim() || sending ? 0.4 : 1, transition: 'all 0.15s' }}
                >
                  {sending ? <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> : '↑'}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingInline: 2 }}>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Ctrl+Enter to send</span>
                <button onClick={() => setToast('AI suggest reply — coming soon ⚡')} style={{ fontSize: 10, color: 'var(--primary)', opacity: 0.6, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>⚡ Suggest reply</button>
              </div>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 18px', fontSize: 12, color: 'var(--text-primary)', zIndex: 100, backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-track { background: 'transparent' }
        ::-webkit-scrollbar-thumb { background: 'var(--border)'; border-radius: 4px }
        @media (min-width: 768px) {
          .md-inbox-list { display: flex !important }
          .md-inbox-chat { display: flex !important }
          .mobile-back-btn { display: none !important }
        }
      `}</style>
    </div>
  )
}
