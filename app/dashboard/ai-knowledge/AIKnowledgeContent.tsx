'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../../../lib/LangContext'
import toast from 'react-hot-toast'

interface KnowledgeFile {
  id: number
  filename: string
  file_type: string
  uploaded_at: string
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
  const [faqs, setFaqs] = useState<{question: string, answer: string}[]>([])
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    fetchKnowledge()
  }, [])

  const fetchKnowledge = async () => {
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/knowledge`, {
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

    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|xlsx|xls)$/i)) {
      toast.error(t.aiKnowledge.extractError)
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t.aiKnowledge.maxSize)
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/knowledge/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      
      if (res.ok) {
        toast.success(t.aiKnowledge.uploadSuccess)
        fetchKnowledge()
      } else {
        toast.error(data.error || t.aiKnowledge.uploadError)
      }
    } catch (error) {
      toast.error(t.aiKnowledge.uploadError)
    } finally {
      setUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleDeleteFile = async (id: number) => {
    if (!confirm(t.aiKnowledge.deleteConfirm)) return

    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/knowledge/files/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      
      if (res.ok) {
        toast.success(t.aiKnowledge.fileDeleted)
        fetchKnowledge()
      } else {
        toast.error(t.aiKnowledge.uploadError)
      }
    } catch (error) {
      toast.error(t.aiKnowledge.uploadError)
    }
  }

  const handleSaveInstructions = async () => {
    setSavingInstructions(true)
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/knowledge/instructions`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ ai_instructions: aiInstructions }),
      })
      const data = await res.json()
      
      if (res.ok) {
        toast.success(t.aiKnowledge.instructionsSaved)
      } else {
        toast.error(data.error || t.aiKnowledge.instructionsError)
      }
    } catch (error) {
      toast.error(t.aiKnowledge.instructionsError)
    } finally {
      setSavingInstructions(false)
    }
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/knowledge/profile`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ ...profile, faqs }),
      })
      const data = await res.json()
      
      if (res.ok) {
        toast.success(t.aiKnowledge?.profileSaved || 'Business profile saved successfully')
      } else {
        toast.error(data.error || 'Failed to save profile')
      }
    } catch (error) {
      toast.error('Failed to save profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleTestResponse = async () => {
    if (!testQuestion.trim()) {
      toast.error(t.aiKnowledge.testQuestion)
      return
    }

    setTesting(true)
    setTestResponse('')
    
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('naz_token='))?.split('=')[1]
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/knowledge/test`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ test_question: testQuestion }),
      })
      const data = await res.json()
      
      if (res.ok) {
        setTestResponse(data.test_response)
      } else {
        toast.error(data.error || t.aiKnowledge.testError)
      }
    } catch (error) {
      toast.error(t.aiKnowledge.testError)
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 rounded-full border-2 border-gray-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-black mb-2" style={{ fontSize: 'clamp(1.8rem,3vw,2.4rem)', color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
          {t.aiKnowledge.title}
        </h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          {t.aiKnowledge.subtitle}
        </p>
      </motion.div>

      {/* Business Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
          {t.onboarding?.businessDetails || 'Business Details'}
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          {t.aiKnowledge?.profileDesc || 'Update your core business information that the AI uses to answer customer questions.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Business Name</label>
            <input type="text" value={profile.business_name} onChange={e => setProfile({...profile, business_name: e.target.value})} className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all duration-200" style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Business Type</label>
            <input type="text" value={profile.business_type} onChange={e => setProfile({...profile, business_type: e.target.value})} className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all duration-200" style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Phone</label>
            <input type="text" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all duration-200" style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>City & Country</label>
            <div className="flex gap-2">
              <input type="text" placeholder="City" value={profile.city} onChange={e => setProfile({...profile, city: e.target.value})} className="w-1/2 px-3 py-2 rounded-lg text-sm outline-none transition-all duration-200" style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-primary)' }} />
              <input type="text" placeholder="Country" value={profile.country} onChange={e => setProfile({...profile, country: e.target.value})} className="w-1/2 px-3 py-2 rounded-lg text-sm outline-none transition-all duration-200" style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-primary)' }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Working Hours</label>
            <div className="flex gap-2">
              <input type="text" placeholder="From (e.g. 09:00)" value={profile.working_from} onChange={e => setProfile({...profile, working_from: e.target.value})} className="w-1/2 px-3 py-2 rounded-lg text-sm outline-none transition-all duration-200" style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-primary)' }} />
              <input type="text" placeholder="To (e.g. 18:00)" value={profile.working_to} onChange={e => setProfile({...profile, working_to: e.target.value})} className="w-1/2 px-3 py-2 rounded-lg text-sm outline-none transition-all duration-200" style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-primary)' }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Reply Style</label>
            <input type="text" value={profile.reply_style} onChange={e => setProfile({...profile, reply_style: e.target.value})} className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all duration-200" style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-primary)' }} />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Services & Products</label>
          <textarea value={profile.services} onChange={e => setProfile({...profile, services: e.target.value})} rows={3} className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all duration-200 resize-none" style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-primary)' }} />
        </div>

        <div className="mb-6">
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Frequently Asked Questions</label>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="flex gap-2 relative">
                <input type="text" placeholder="Question" value={faq.question} onChange={e => { const newFaqs = [...faqs]; newFaqs[index].question = e.target.value; setFaqs(newFaqs) }} className="w-1/3 px-3 py-2 rounded-lg text-sm outline-none transition-all duration-200" style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-primary)' }} />
                <input type="text" placeholder="Answer" value={faq.answer} onChange={e => { const newFaqs = [...faqs]; newFaqs[index].answer = e.target.value; setFaqs(newFaqs) }} className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all duration-200" style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-primary)' }} />
                <button onClick={() => setFaqs(faqs.filter((_, i) => i !== index))} className="p-2 rounded-lg hover:bg-red-500/10" style={{ color: 'var(--error)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            ))}
            <button onClick={() => setFaqs([...faqs, { question: '', answer: '' }])} className="text-xs font-medium mt-2 px-3 py-1.5 rounded-lg transition-colors" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent)' }}>
              + Add FAQ
            </button>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2"
            style={{
              background: savingProfile ? 'rgba(59,130,246,0.5)' : 'var(--accent)',
              color: '#ffffff',
            }}
          >
            {savingProfile && (
              <div className="animate-spin w-4 h-4 rounded-full border-2 border-current border-t-transparent"></div>
            )}
            {t.aiKnowledge?.saveProfile || 'Save Profile'}
          </button>
        </div>
      </motion.div>

      {/* Knowledge Base Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
          {t.aiKnowledge.knowledgeBase}
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          {t.aiKnowledge.knowledgeBaseDesc}
        </p>

        {/* Upload Button */}
        <div className="mb-6">
          <label className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all hover:opacity-80"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: 'var(--accent)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span className="font-semibold">{t.aiKnowledge.uploadFile}</span>
            <input
              type="file"
              accept=".pdf,.xlsx,.xls"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            {uploading && (
              <div className="animate-spin w-4 h-4 rounded-full border-2 border-current border-t-transparent"></div>
            )}
          </label>
          <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
            {t.aiKnowledge.supportedFormats} • {t.aiKnowledge.maxSize}
          </p>
        </div>

        {/* Files List */}
        {files.length === 0 ? (
          <div className="text-center py-8 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p style={{ color: 'var(--text-tertiary)' }}>{t.aiKnowledge.noFiles}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent)' }}>
                    {file.file_type === 'pdf' ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="8" y1="13" x2="16" y2="13"></line>
                        <line x1="8" y1="17" x2="16" y2="17"></line>
                        <line x1="8" y1="9" x2="8" y2="9"></line>
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{file.filename}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {t.aiKnowledge.uploadedAt}: {new Date(file.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteFile(file.id)}
                  className="p-2 rounded-lg transition-colors hover:bg-red-500/10"
                  style={{ color: 'var(--error)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Custom Instructions Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
          {t.aiKnowledge.customInstructions}
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          {t.aiKnowledge.customInstructionsDesc}
        </p>

        <textarea
          value={aiInstructions}
          onChange={(e) => setAiInstructions(e.target.value)}
          placeholder={t.aiKnowledge.instructionsPlaceholder}
          rows={8}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 resize-none"
          style={{
            background: 'rgba(17,17,17,0.9)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(59,130,246,0.45)'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />

        <div className="flex justify-end mt-4">
          <button
            onClick={handleSaveInstructions}
            disabled={savingInstructions}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2"
            style={{
              background: savingInstructions ? 'rgba(59,130,246,0.5)' : 'var(--accent)',
              color: '#ffffff',
            }}
          >
            {savingInstructions && (
              <div className="animate-spin w-4 h-4 rounded-full border-2 border-current border-t-transparent"></div>
            )}
            {t.aiKnowledge.saveInstructions}
          </button>
        </div>
      </motion.div>

      {/* Test AI Response Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
          {t.aiKnowledge.testAi}
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          {t.aiKnowledge.testAiDesc}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              {t.aiKnowledge.testQuestion}
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={testQuestion}
                onChange={(e) => setTestQuestion(e.target.value)}
                placeholder={t.aiKnowledge.testQuestionPlaceholder}
                className="flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  background: 'rgba(17,17,17,0.9)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(59,130,246,0.45)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
              <button
                onClick={handleTestResponse}
                disabled={testing}
                className="px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2"
                style={{
                  background: testing ? 'rgba(59,130,246,0.5)' : 'var(--accent)',
                  color: '#ffffff',
                }}
              >
                {testing && (
                  <div className="animate-spin w-4 h-4 rounded-full border-2 border-current border-t-transparent"></div>
                )}
                {t.aiKnowledge.testButton}
              </button>
            </div>
          </div>

          {testResponse && (
            <div className="p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--accent)' }}>
                {t.aiKnowledge.testResponse}
              </label>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {testResponse}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
