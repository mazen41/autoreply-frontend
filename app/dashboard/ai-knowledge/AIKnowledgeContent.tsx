'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'
import toast from 'react-hot-toast'
import { PlusIcon, XIcon, LightningIcon } from '../../../components/ui/DashboardIcons'

interface KnowledgeFile {
  id: number
  filename: string
  file_type: string
  uploaded_at: string
  status?: string
  chunks_count?: number
}

export default function AIKnowledgeContent() {
  const { isRTL, t } = useLang()
  const [files, setFiles] = useState<KnowledgeFile[]>([])
  const [aiInstructions, setAiInstructions] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [savingInstructions, setSavingInstructions] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testQuestion, setTestQuestion] = useState('')
  const [testResponse, setTestResponse] = useState('')
  const [reindexing, setReindexing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  const [profile, setProfile] = useState({
    business_name: '',
    business_type: '',
    phone: '',
    city: '',
    country: '',
    working_days: [] as string[],
    working_from: '',
    working_to: '',
    services: '',
    reply_style: '',
  })
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([])
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    fetchKnowledge()
  }, [])

  const getToken = () =>
    document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const fetchKnowledge = async () => {
    try {
      const token = getToken()
      if (!token) return
      const res = await fetch(`${API}/api/knowledge`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        setFiles(data.files || [])
        setAiInstructions(data.ai_instructions || '')
        if (data.profile) {
          setProfile({
            business_name: data.profile.business_name || '',
            business_type: data.profile.business_type || '',
            phone: data.profile.phone || '',
            city: data.profile.city || '',
            country: data.profile.country || '',
            working_days: data.profile.working_days || [],
            working_from: data.profile.working_from || '',
            working_to: data.profile.working_to || '',
            services: data.profile.services || '',
            reply_style: data.profile.reply_style || '',
          })
          setFaqs(data.profile.faqs || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch knowledge:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|xlsx|xls)$/i)) {
      toast.error(t.aiKnowledge.extractError)
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t.aiKnowledge.maxSize)
      return
    }
    setUploading(true)
    const token = getToken()
    if (!token) { setUploading(false); return }
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch(`${API}/api/knowledge/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(t.aiKnowledge.uploadSuccess)
        fetchKnowledge()
      } else {
        toast.error(data.error || 'Upload failed')
      }
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFile = async (id: number) => {
    if (!confirm('Delete this file?')) return
    const token = getToken()
    if (!token) return
    try {
      const res = await fetch(`${API}/api/knowledge/files/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      if (res.ok) {
        toast.success(t.aiKnowledge.fileDeleted)
        fetchKnowledge()
      } else {
        toast.error('Delete failed')
      }
    } catch {
      toast.error('Delete failed')
    }
  }

  const handleSaveInstructions = async () => {
    setSavingInstructions(true)
    try {
      const token = getToken()
      if (!token) return
      const res = await fetch(`${API}/api/knowledge/instructions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ai_instructions: aiInstructions }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(t.aiKnowledge.instructionsSaved)
      } else {
        toast.error(data.error || 'Failed to save instructions')
      }
    } catch {
      toast.error('Failed to save instructions')
    } finally {
      setSavingInstructions(false)
    }
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      const token = getToken()
      if (!token) return
      const res = await fetch(`${API}/api/knowledge/profile`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...profile, faqs }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Business profile saved successfully')
      } else {
        toast.error(data.error || 'Failed to save profile')
      }
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleTestResponse = async () => {
    if (!testQuestion.trim()) return
    setTesting(true)
    setTestResponse('')
    try {
      const token = getToken()
      if (!token) return
      const res = await fetch(`${API}/api/knowledge/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ test_question: testQuestion }),
      })
      const data = await res.json()
      if (res.ok) {
        setTestResponse(data.test_response)
      } else {
        toast.error(data.error || 'AI simulation failed')
      }
    } catch {
      toast.error('Simulation failed')
    } finally {
      setTesting(false)
    }
  }

  const handleReindex = async () => {
    setReindexing(true)
    try {
      const token = getToken()
      if (!token) return
      const res = await fetch(`${API}/api/knowledge/reindex`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      if (res.ok) {
        toast.success('Knowledge base reindexed successfully')
        fetchKnowledge()
      } else {
        toast.error('Reindexing failed')
      }
    } catch {
      toast.error('Reindexing failed')
    } finally {
      setReindexing(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchResults([])
    try {
      const token = getToken()
      if (!token) return
      const res = await fetch(`${API}/api/knowledge/search`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query: searchQuery, limit: 5 }),
      })
      const data = await res.json()
      if (res.ok) {
        setSearchResults(data.results || [])
      } else {
        toast.error('Search failed')
      }
    } catch {
      toast.error('Search failed')
    } finally {
      setSearching(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const cardClass = "rounded-2xl p-6 space-y-5"
  const cardStyle = { background: 'var(--surface)', border: '1px solid var(--border)' }
  const inputStyle = { background: 'var(--surface-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }
  const inputClass = "w-full rounded-xl px-3 py-2 text-xs placeholder-text-secondary focus:outline-none"
  const labelClass = "block text-[10px] font-black uppercase tracking-wider mb-1.5"
  const cardAnim = { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 } }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="space-y-1">
        <h2 className="text-xl font-black tracking-tight" style={{color:'var(--text-primary)'}}>{t.aiKnowledge.title}</h2>
        <p className="text-sm text-text-secondary">{t.aiKnowledge.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Profile */}
          <motion.div {...cardAnim} className={cardClass} style={cardStyle}>
            <div className="space-y-1">
              <h3 className="text-sm font-bold tracking-tight" style={{color:'var(--text-primary)'}}>Business Details</h3>
              <p className="text-[11px] text-text-secondary">Configure business facts used by the AI brain.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Business Name</label>
                <input type="text" value={profile.business_name} onChange={e => setProfile({ ...profile, business_name: e.target.value })} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className={labelClass}>Business Type</label>
                <input type="text" value={profile.business_type} onChange={e => setProfile({ ...profile, business_type: e.target.value })} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className={labelClass}>Phone Number</label>
                <input type="text" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className={labelClass}>City & Country</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="City" value={profile.city} onChange={e => setProfile({ ...profile, city: e.target.value })} className="w-1/2 rounded-xl px-3 py-2 text-xs placeholder-text-secondary focus:outline-none" style={inputStyle} />
                  <input type="text" placeholder="Country" value={profile.country} onChange={e => setProfile({ ...profile, country: e.target.value })} className="w-1/2 rounded-xl px-3 py-2 text-xs placeholder-text-secondary focus:outline-none" style={inputStyle} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Working Hours</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="From (09:00)" value={profile.working_from} onChange={e => setProfile({ ...profile, working_from: e.target.value })} className="w-1/2 rounded-xl px-3 py-2 text-xs placeholder-text-secondary focus:outline-none" style={inputStyle} />
                  <input type="text" placeholder="To (18:00)" value={profile.working_to} onChange={e => setProfile({ ...profile, working_to: e.target.value })} className="w-1/2 rounded-xl px-3 py-2 text-xs placeholder-text-secondary focus:outline-none" style={inputStyle} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Reply Tone / Style</label>
                <input type="text" value={profile.reply_style} onChange={e => setProfile({ ...profile, reply_style: e.target.value })} placeholder="Friendly, formal..." className={inputClass} style={inputStyle} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Services & Products Overview</label>
              <textarea value={profile.services} onChange={e => setProfile({ ...profile, services: e.target.value })} rows={3} className="w-full rounded-xl px-3 py-2 text-xs placeholder-text-secondary focus:outline-none resize-none" style={inputStyle} />
            </div>
            <div className="space-y-3">
              <label className={labelClass}>Custom Q&A / FAQs</label>
              <div className="space-y-2">
                {faqs.map((faq, index) => (
                  <div key={index} className="flex gap-2">
                    <input type="text" placeholder="Question" value={faq.question} onChange={e => { const n = [...faqs]; n[index].question = e.target.value; setFaqs(n) }} className="w-1/3 rounded-xl px-3 py-2 text-xs placeholder-text-secondary focus:outline-none" style={inputStyle} />
                    <input type="text" placeholder="Answer" value={faq.answer} onChange={e => { const n = [...faqs]; n[index].answer = e.target.value; setFaqs(n) }} className="flex-1 rounded-xl px-3 py-2 text-xs placeholder-text-secondary focus:outline-none" style={inputStyle} />
                <button onClick={() => setFaqs(faqs.filter((_, i) => i !== index))} className="p-2 rounded-xl text-red-400 hover:bg-red-500/10" style={{background:'var(--surface-elevated)'}}>✕</button>
                  </div>
                ))}
                <button onClick={() => setFaqs([...faqs, { question: '', answer: '' }])} className="text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-xl transition-all" style={{background:'var(--surface-elevated)',border:'1px solid var(--border)',color:'var(--text-secondary)'}}>
                  + Add FAQ Item
                </button>
              </div>
            </div>
              <div className="flex justify-end pt-2" style={{borderTop:'1px solid var(--border)'}}>
              <button onClick={handleSaveProfile} disabled={savingProfile} className="px-6 py-2.5 rounded-xl text-xs font-bold bg-accent text-white hover:brightness-110 disabled:opacity-50">
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </motion.div>

          {/* Custom Instructions */}
          <motion.div {...cardAnim} className="rounded-2xl p-6 space-y-4" style={cardStyle}>
            <div className="space-y-1">
              <h3 className="text-sm font-bold tracking-tight" style={{color:'var(--text-primary)'}}>{t.aiKnowledge.customInstructions}</h3>
              <p className="text-[11px] text-text-secondary">{t.aiKnowledge.customInstructionsDesc}</p>
            </div>
              <textarea value={aiInstructions} onChange={e => setAiInstructions(e.target.value)} placeholder={t.aiKnowledge.instructionsPlaceholder} rows={5} className="w-full rounded-xl px-3.5 py-3.5 text-xs placeholder-text-tertiary focus:outline-none resize-none font-mono" style={inputStyle} />
              <div className="flex justify-end pt-2" style={{borderTop:'1px solid var(--border)'}}>
              <button onClick={handleSaveInstructions} disabled={savingInstructions} className="px-6 py-2.5 rounded-xl text-xs font-bold bg-accent text-white hover:brightness-110 disabled:opacity-50">
                {savingInstructions ? 'Saving...' : t.aiKnowledge.saveInstructions}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* File Upload */}
          <motion.div {...cardAnim} className="rounded-2xl p-6 space-y-4" style={cardStyle}>
            <div className="space-y-1">
              <h3 className="text-sm font-bold tracking-tight" style={{color:'var(--text-primary)'}}>{t.aiKnowledge.knowledgeBase}</h3>
              <p className="text-[11px] text-text-secondary">Upload business PDFs, sheets, or manuals.</p>
            </div>
            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all text-center group" style={{borderColor:'var(--border)',background:'var(--surface-elevated)'}}>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-text-secondary group-hover:text-accent transition-all mb-3">☁️</div>
              <span className="text-xs font-bold" style={{color:'var(--text-primary)'}}>{t.aiKnowledge.uploadFile}</span>
              <span className="text-[9px] text-text-tertiary mt-1">PDF or Excel (Max 10MB)</span>
              <input type="file" accept=".pdf,.xlsx,.xls" onChange={handleFileUpload} disabled={uploading} className="hidden" />
              {uploading && <div className="mt-3 w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />}
            </label>
            <button onClick={handleReindex} disabled={reindexing} className="w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5" style={{background:'var(--surface-elevated)',border:'1px solid var(--border)',color:'var(--text-primary)'}}>
              {reindexing ? 'Reindexing...' : 'Reindex Files'}
            </button>
          </motion.div>

          {/* Files List */}
          <motion.div {...cardAnim} className="rounded-2xl p-6 space-y-3" style={cardStyle}>
            <div className="text-xs font-bold" style={{color:'var(--text-primary)'}}>Files list</div>
            {files.length === 0 ? (
              <div className="text-center py-6 text-[10px] text-text-tertiary">{t.aiKnowledge.noFiles}</div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-none">
                {files.map(file => (
                  <div className="flex items-center justify-between p-2.5 rounded-xl" style={{background:'var(--surface-elevated)',border:'1px solid var(--border)'}}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base">{file.file_type === 'pdf' ? '📄' : '📊'}</span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold truncate max-w-[140px]" style={{color:'var(--text-primary)'}}>{file.filename}</p>
                        <p className="text-[9px] text-text-tertiary">{file.chunks_count || 0} chunks</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteFile(file.id)} className="p-1 rounded-lg text-text-secondary hover:text-red-400">✕</button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* AI Simulator */}
          <motion.div {...cardAnim} className="rounded-2xl p-6 space-y-4" style={cardStyle}>
            <div className="space-y-1">
              <h3 className="text-sm font-bold tracking-tight" style={{color:'var(--text-primary)'}}>{t.aiKnowledge.testAi || 'Simulate Chatbot'}</h3>
              <p className="text-[11px] text-text-secondary">Simulate a chat query to test the response logic.</p>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input type="text" value={testQuestion} onChange={e => setTestQuestion(e.target.value)} placeholder={t.aiKnowledge.testQuestionPlaceholder || 'Ask a simulated query...'} className="flex-1 rounded-xl px-3 py-2 text-xs placeholder-text-secondary focus:outline-none" style={inputStyle} onKeyPress={e => { if (e.key === 'Enter') handleTestResponse() }} />
                <button onClick={handleTestResponse} disabled={testing} className="px-4 rounded-xl bg-accent text-white text-xs font-bold hover:brightness-110 disabled:opacity-50">
                  {testing ? '...' : 'Send'}
                </button>
              </div>
              {testResponse && (
                <div className="p-3.5 rounded-xl bg-accent/10 border border-accent/15 space-y-1">
                  <div className="text-[9px] font-black uppercase tracking-wider text-accent">Simulation Response:</div>
                  <p className="text-[11px] leading-relaxed" style={{color:'var(--text-primary)'}}>{testResponse}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* RAG Search */}
          <motion.div {...cardAnim} className="rounded-2xl p-6 space-y-4" style={cardStyle}>
            <div className="space-y-1">
              <h3 className="text-sm font-bold tracking-tight" style={{color:'var(--text-primary)'}}>RAG Search</h3>
              <p className="text-[11px] text-text-secondary">Search knowledge snippets semantically.</p>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Query semantic search..." className="flex-1 rounded-xl px-3 py-2 text-xs placeholder-text-secondary focus:outline-none" style={inputStyle} onKeyPress={e => { if (e.key === 'Enter') handleSearch() }} />
                <button onClick={handleSearch} disabled={searching} className="px-4 rounded-xl bg-accent text-white text-xs font-bold hover:brightness-110 disabled:opacity-50">
                  {searching ? '...' : 'Find'}
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-none">
                  {searchResults.map((result, index) => (
                      <div className="p-2.5 rounded-lg space-y-1 text-[11px]" style={{background:'var(--surface-elevated)',border:'1px solid var(--border)'}}>
                      <div className="flex justify-between text-[9px] text-accent">
                        <span>Source: {result.source}</span>
                        <span>Score: {Math.round(result.score * 100)}%</span>
                      </div>
                      <p className="text-text-secondary leading-normal">{result.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
