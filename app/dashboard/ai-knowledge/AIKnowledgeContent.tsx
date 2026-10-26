'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import MetricCard from '../../../components/ui/MetricCard'
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import Tabs from '../../../components/ui/Tabs'
import toast from 'react-hot-toast'
import { getBusinessHeaders } from '../../../lib/businessContext'
import { useLang } from '../../../lib/LangContext'
import {
  Brain,
  UploadCloud,
  FileText,
  Search,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck,
  Send,
  HelpCircle,
  Building2,
  RefreshCw,
  ExternalLink,
  X,
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface KnowledgeFile {
  id: number
  filename: string
  file_type: string
  uploaded_at: string
  status?: string
  retryable?: boolean
  chunks_count?: number
  error_message?: string | null
}

export default function AIKnowledgeContent() {
  const { isRTL } = useLang()
  const [activeTab, setActiveTab] = useState('documents')
  const [files, setFiles] = useState<KnowledgeFile[]>([])
  const [fileSearch, setFileSearch] = useState('')
  const [fileStatusFilter, setFileStatusFilter] = useState('all')
  const [isDragging, setIsDragging] = useState(false)
  const [aiInstructions, setAiInstructions] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [retryingFileId, setRetryingFileId] = useState<number | null>(null)
  const [savingInstructions, setSavingInstructions] = useState(false)

  // Testing AI Sandbox
  const [testQuestion, setTestQuestion] = useState('')
  const [testResponse, setTestResponse] = useState('')
  const [testing, setTesting] = useState(false)

  // Business profile
  const [profile, setProfile] = useState({ business_name: '', business_type: '', phone: '', city: '', country: '', services: '', reply_style: '' })
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([])
  const [newFaqQ, setNewFaqQ] = useState('')
  const [newFaqA, setNewFaqA] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getToken = () =>
    typeof document !== 'undefined'
      ? document.cookie.split(';').find((c) => c.trim().startsWith('naz_token='))?.split('=')[1]
      : ''

  const fetchKnowledge = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const token = getToken()
      if (!token) throw new Error('Your session expired. Sign in again to load the knowledge base.')

      const res = await fetch(`${API}/api/knowledge`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Could not load knowledge data.')
      setFiles(data.files || [])
      setAiInstructions(data.ai_instructions || '')
      const actualProfile = data.profile || {}
      setProfile({ business_name: actualProfile.business_name || '', business_type: actualProfile.business_type || '', phone: actualProfile.phone || '', city: actualProfile.city || '', country: actualProfile.country || '', services: actualProfile.services || '', reply_style: actualProfile.reply_style || '' })
      setFaqs(Array.isArray(actualProfile.faqs) ? actualProfile.faqs : [])
    } catch (e) {
      console.warn('Knowledge fetch failed:', e)
      setLoadError(e instanceof Error ? e.message : 'Could not load the knowledge base.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => { void fetchKnowledge() })
  }, [fetchKnowledge])

  const uploadFile = async (file: File) => {
    setUploading(true)
    try {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
      const extensionAllowed = /\.(pdf|xlsx|xls)$/i.test(file.name)
      if (!extensionAllowed || (file.type && !allowedTypes.includes(file.type))) {
        throw new Error(isRTL ? 'الملفات المدعومة هي PDF وXLSX وXLS فقط.' : 'Only PDF, XLSX, and XLS files are supported.')
      }
      if (file.size > 10 * 1024 * 1024) throw new Error(isRTL ? 'يجب ألا يتجاوز حجم الملف 10 ميجابايت.' : 'The file must be 10 MB or smaller.')
      const token = getToken()
      if (!token) throw new Error('Your session expired. Sign in again.')
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch(`${API}/api/knowledge/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() },
          body: formData,
        })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Upload failed.')
      if (result.duplicate) {
        toast(isRTL ? 'هذا الملف موجود بالفعل في قاعدة معرفة النشاط.' : 'This document is already in this business knowledge base.')
      } else {
        toast.success(isRTL ? 'تم رفع الملف وإضافته إلى قائمة الفهرسة' : 'Document uploaded and queued for indexing')
      }
      await fetchKnowledge()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (isRTL ? 'فشل رفع الملف' : 'Upload failed'))
    } finally {
      setUploading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) await uploadFile(file)
  }

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) void uploadFile(file)
  }

  const handleDeleteFile = async (id: number) => {
    if (!confirm(isRTL ? 'هل تريد إزالة هذا المستند من قاعدة المعرفة؟' : 'Remove this document from the knowledge base?')) return
    try {
      const token = getToken()
      if (!token) throw new Error('Your session expired. Sign in again.')
      const response = await fetch(`${API}/api/knowledge/files/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() } })
      if (!response.ok) throw new Error('File could not be deleted.')
      setFiles((prev) => prev.filter((f) => f.id !== id))
      toast.success('File deleted from knowledge index')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'File deletion failed.') }
  }

  const handleRetryFile = async (id: number) => {
    setRetryingFileId(id)
    try {
      const token = getToken()
      if (!token) throw new Error('Your session expired. Sign in again.')
      const response = await fetch(`${API}/api/knowledge/files/${id}/retry`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() } })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || 'Could not retry document indexing.')
      toast.success(result.message || 'Document indexing queued')
      await fetchKnowledge()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not retry document indexing.')
    } finally {
      setRetryingFileId(null)
    }
  }

  const handleSaveInstructions = async () => {
    setSavingInstructions(true)
    try {
      const token = getToken()
      if (!token) throw new Error('Your session expired. Sign in again.')
      const response = await fetch(`${API}/api/knowledge/instructions`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json', ...getBusinessHeaders() }, body: JSON.stringify({ ai_instructions: aiInstructions }) })
      if (!response.ok) throw new Error('Could not save AI instructions.')
      const profileResponse = await fetch(`${API}/api/knowledge/profile`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json', ...getBusinessHeaders() }, body: JSON.stringify({ ...profile, faqs }) })
      if (!profileResponse.ok) throw new Error('Instructions saved, but profile changes could not be saved.')
      toast.success('AI instructions saved')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not save AI instructions.') }
    finally {
      setSavingInstructions(false)
    }
  }

  const handleReindex = async () => {
    try {
      const token = getToken()
      if (!token) throw new Error('Your session expired. Sign in again.')
      const response = await fetch(`${API}/api/knowledge/reindex`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...getBusinessHeaders() } })
      if (!response.ok) throw new Error('Could not queue knowledge reindexing.')
      toast.success('Knowledge reindexing queued')
      await fetchKnowledge()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not reindex knowledge.') }
  }

  const handleDeleteFaq = async (index: number) => {
    const updated = faqs.filter((_, faqIndex) => faqIndex !== index)
    try {
      const token = getToken()
      if (!token) throw new Error('Your session expired. Sign in again.')
      const response = await fetch(`${API}/api/knowledge/profile`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json', ...getBusinessHeaders() }, body: JSON.stringify({ faqs: updated }) })
      if (!response.ok) throw new Error('Could not remove the FAQ.')
      setFaqs(updated)
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not remove the FAQ.') }
  }

  const handleAddFaq = async () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) return
    const updated = [...faqs, { question: newFaqQ.trim(), answer: newFaqA.trim() }]
    try {
      const token = getToken()
      if (!token) throw new Error('Your session expired. Sign in again.')
      const response = await fetch(`${API}/api/knowledge/profile`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json', ...getBusinessHeaders() }, body: JSON.stringify({ faqs: updated }) })
      if (!response.ok) throw new Error('Could not save the FAQ.')
      setFaqs(updated)
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not save the FAQ.'); return }
    setNewFaqQ('')
    setNewFaqA('')
    toast.success('FAQ entry added')
  }

  const handleTestQuestion = async () => {
    if (!testQuestion.trim()) return
    setTesting(true)
    setTestResponse('')

    try {
      const token = getToken()
      if (!token) throw new Error('Your session expired. Sign in again.')
      const response = await fetch(`${API}/api/knowledge/test`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json', ...getBusinessHeaders() }, body: JSON.stringify({ test_question: testQuestion.trim() }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not generate a test response.')
      setTestResponse(data.test_response || '')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not test the knowledge base.') }
    finally { setTesting(false) }
  }

  const totalChunks = files.reduce((acc, f) => acc + (f.chunks_count || 0), 0)
  const filteredFiles = useMemo(() => files.filter(file => {
    const matchesQuery = !fileSearch.trim() || file.filename.toLocaleLowerCase().includes(fileSearch.trim().toLocaleLowerCase())
    return matchesQuery && (fileStatusFilter === 'all' || (file.status || 'pending') === fileStatusFilter)
  }), [files, fileSearch, fileStatusFilter])

  return (
    <main className="mx-auto max-w-[1520px] space-y-6 p-4 md:p-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ─── Page Header ─────────────────────────────────────────────────── */}
      <PageHeader
        title={isRTL ? 'قاعدة المعرفة' : 'AI Knowledge'}
        description={isRTL
          ? 'أضف مستندات النشاط والأسئلة الشائعة والتعليمات لمساعدة الوكلاء على تقديم إجابات دقيقة.'
          : 'Add business documents, FAQs, and instructions so agents can give accurate, grounded answers.'}
        breadcrumbs={[
          { label: 'NazBiz', href: '/dashboard' },
          { label: isRTL ? 'المعرفة' : 'AI Knowledge' },
        ]}
        primaryAction={
          <Button variant="primary" size="md" icon={<UploadCloud size={16} />} loading={uploading} onClick={() => fileInputRef.current?.click()}>
            {isRTL ? 'رفع مستند' : 'Upload document'}
          </Button>
        }
        secondaryActions={
          <Button
            variant="secondary"
            size="md"
            icon={<RefreshCw size={14} />}
            onClick={() => void handleReindex()}
          >
            {isRTL ? 'إعادة فهرسة المعرفة' : 'Re-index knowledge'}
          </Button>
        }
      />

      {loadError && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error"><span>{loadError}</span><Button variant="outline" size="sm" onClick={() => void fetchKnowledge()}>{isRTL ? 'إعادة المحاولة' : 'Retry'}</Button></div>}

      {/* ─── Metric Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label={isRTL ? 'المستندات المرفوعة' : 'Documents'}
          value={files.length}
          subValue={isRTL ? 'في قاعدة معرفة النشاط' : 'In this business knowledge base'}
          icon={<FileText size={18} />}
        />
        <MetricCard
          label={isRTL ? 'مقاطع المعرفة' : 'Knowledge chunks'}
          value={totalChunks}
          subValue={isRTL ? 'المقاطع المستخرجة من الملفات' : 'Extracted from indexed files'}
          icon={<Layers size={18} />}
        />
        <MetricCard
          label={isRTL ? 'الأسئلة الشائعة' : 'FAQs'}
          value={faqs.length}
          subValue={isRTL ? 'أسئلة وأجوبة النشاط المحفوظة' : 'Saved business question and answer pairs'}
          icon={<Clock size={18} />}
        />
      </div>

      {/* ─── Tabs ────────────────────────────────────────────────────────── */}
      <Tabs
        tabs={[
          { id: 'documents', label: isRTL ? 'المستندات' : 'Documents', icon: <FileText size={14} />, count: files.length },
          { id: 'faqs', label: isRTL ? 'الأسئلة الشائعة' : 'FAQs', icon: <HelpCircle size={14} />, count: faqs.length },
          { id: 'instructions', label: isRTL ? 'تعليمات الوكيل' : 'Agent instructions', icon: <Building2 size={14} /> },
          { id: 'tester', label: isRTL ? 'اختبار الإجابات' : 'Test answers', icon: <Sparkles size={14} /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* ─── Tab 1: Documents ────────────────────────────────────────────── */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          {/* Upload Dropzone */}
          <div
            onDragEnter={(event) => { event.preventDefault(); setIsDragging(true) }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false)
            }}
            onDrop={handleFileDrop}
            className={`p-8 border-2 border-dashed rounded-2xl text-center space-y-3 transition-colors ${isDragging ? 'border-brand bg-brand/10' : 'border-border hover:border-brand/50 bg-surface-elevated/30'}`}
          >
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.xlsx,.xls" />
            <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto">
              <UploadCloud size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">{isRTL ? 'اسحب ملفات المعرفة وأفلتها هنا' : 'Drag and drop your knowledge files'}</h4>
              <p className="text-xs text-text-tertiary mt-1">
                {isRTL ? 'يدعم PDF وXLSX وXLS حتى 10 ميجابايت. الحد الأقصى لكل ملف 500 مقطع مفهرس.' : 'Supports PDF, XLSX, and XLS files (up to 10 MB). Each file is limited to 500 indexed chunks.'}
              </p>
            </div>
            <Button variant="secondary" size="sm" loading={uploading} onClick={() => fileInputRef.current?.click()}>{isRTL ? 'اختيار ملف' : 'Browse files'}</Button>
          </div>

          {/* Files List */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{isRTL ? 'مصادر المعرفة' : 'Knowledge sources'}</CardTitle>
              <CardDescription>
                {isRTL ? 'تُفهرس هذه الملفات وتُستخدم تلقائيًا عند طرح العملاء للأسئلة.' : 'These files are indexed and used automatically when a customer asks a question.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              <div className="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search size={15} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input aria-label={isRTL ? 'البحث في المستندات' : 'Search documents'} value={fileSearch} onChange={(event) => setFileSearch(event.target.value)} placeholder={isRTL ? 'ابحث باسم الملف' : 'Search by filename'} className="w-full rounded-lg border border-border bg-surface-elevated py-2 ps-9 pe-9 text-sm text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-brand" />
                  {fileSearch && <button type="button" onClick={() => setFileSearch('')} aria-label={isRTL ? 'مسح البحث' : 'Clear search'} className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1 text-text-tertiary hover:bg-surface-overlay hover:text-text-primary"><X size={14} /></button>}
                </div>
                <Select
                  dir={isRTL ? 'rtl' : 'ltr'}
                  ariaLabel={isRTL ? 'تصفية حسب حالة الفهرسة' : 'Filter by indexing status'}
                  value={fileStatusFilter}
                  onValueChange={setFileStatusFilter}
                  className="w-full sm:w-48"
                  options={[
                    { value: 'all', label: isRTL ? 'كل الحالات' : 'All statuses' },
                    { value: 'active', label: isRTL ? 'مفهرس' : 'Indexed' },
                    { value: 'pending', label: isRTL ? 'قيد الانتظار' : 'Pending' },
                    { value: 'processing', label: isRTL ? 'قيد المعالجة' : 'Processing' },
                    { value: 'failed', label: isRTL ? 'فشل الفهرسة' : 'Indexing failed' },
                  ]}
                />
              </div>
              <div className="divide-y divide-border/60">
                {loading ? <div className="p-8 text-center text-sm text-text-tertiary">{isRTL ? 'جارٍ تحميل المستندات…' : 'Loading documents…'}</div>
                  : filteredFiles.length === 0 ? <div className="p-8 text-center text-sm text-text-tertiary">{files.length ? (isRTL ? 'لا توجد مستندات تطابق عوامل التصفية.' : 'No documents match these filters.') : (isRTL ? 'لم تُرفع مستندات بعد. ارفع ملفًا للبدء.' : 'No documents yet. Upload a file to get started.')}</div>
                  : filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-surface-elevated/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="p-2.5 rounded-xl bg-brand/10 text-brand border border-brand/20 shrink-0">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-text-primary truncate">
                          {file.filename}
                        </div>
                        <div className="text-[11px] text-text-tertiary mt-0.5">
                          {file.chunks_count ?? 0} {isRTL ? 'مقطع معرفة' : 'knowledge chunks'} • {isRTL ? 'رُفع' : 'Uploaded'} {file.uploaded_at}
                          {file.error_message && <span className="block text-error">{file.error_message}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={file.status === 'active' ? 'success' : file.status === 'failed' ? 'error' : 'warning'} dot size="xs">
                        {file.status === 'active' ? (isRTL ? 'مفهرس' : 'Indexed') : file.status === 'failed' ? (isRTL ? 'فشل الفهرسة' : 'Indexing failed') : file.status || (isRTL ? 'قيد الانتظار' : 'Pending')}
                      </Badge>
                      {file.retryable && <Button variant="outline" size="sm" loading={retryingFileId === file.id} disabled={retryingFileId !== null} onClick={() => void handleRetryFile(file.id)}>{isRTL ? 'إعادة المحاولة' : 'Retry indexing'}</Button>}
                      <button
                        type="button"
                        onClick={() => handleDeleteFile(file.id)}
                        className="p-1.5 rounded-lg text-text-tertiary hover:text-error hover:bg-error/10 transition-colors"
                        title={isRTL ? 'حذف الملف' : 'Delete file'}
                        aria-label={isRTL ? `حذف ${file.filename}` : `Delete ${file.filename}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Tab 2: FAQs ─────────────────────────────────────────────────── */}
      {activeTab === 'faqs' && (
        <div className="space-y-5">
          {/* Add New FAQ */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">+ {isRTL ? 'إضافة سؤال وجواب إلى المعرفة' : 'Add Q&A Knowledge Pair'}</CardTitle>
              <CardDescription>
                {isRTL ? 'تساعد أزواج الأسئلة والأجوبة المباشرة الذكاء الاصطناعي على التعامل مع الحالات الخاصة.' : 'Direct question-and-answer pairs teach your AI how to resolve specific edge cases.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <Input
                label={isRTL ? 'سؤال العميل' : 'Customer Question'}
                value={newFaqQ}
                onChange={(e) => setNewFaqQ(e.target.value)}
                placeholder={isRTL ? 'مثال: هل توصلون إلى الإمارات أو الكويت؟' : 'e.g. Do you ship to UAE or Kuwait?'}
              />
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">
                  {isRTL ? 'الإجابة المعتمدة' : 'Approved Answer'}
                </label>
                <textarea
                  value={newFaqA}
                  onChange={(e) => setNewFaqA(e.target.value)}
                  placeholder={isRTL ? 'مثال: نعم، نوصل إلى الإمارات خلال 3 إلى 4 أيام عبر DHL Express...' : 'e.g. Yes, we deliver to UAE within 3-4 days via DHL Express...'}
                  className="w-full min-h-[80px] p-3 text-xs bg-surface-elevated text-text-primary border border-border rounded-xl focus:outline-none focus:border-brand"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="primary" size="sm" onClick={handleAddFaq}>
                {isRTL ? 'إضافة السؤال والجواب' : 'Add FAQ Pair'}
              </Button>
            </CardFooter>
          </Card>

          {/* Existing FAQs */}
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <Card key={idx} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-text-primary flex items-center gap-2">
                      <span className="text-brand font-mono">Q:</span>
                      <span>{faq.question}</span>
                    </div>
                    <div className="text-xs text-text-secondary leading-relaxed pl-5">
                      {faq.answer}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDeleteFaq(idx)}
                    className="p-1 rounded text-text-tertiary hover:text-error transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─── Tab 3: Instructions & Persona ───────────────────────────────── */}
      {activeTab === 'instructions' && (
        <Card>
          <CardHeader>
            <CardTitle>{isRTL ? 'شخصية النظام وإرشادات السلوك' : 'System Persona & Behavioral Guidelines'}</CardTitle>
            <CardDescription>
              {isRTL ? 'تحدد هذه التعليمات الأساسية طريقة صياغة جميع الردود الآلية للذكاء الاصطناعي وتنسيقها.' : 'These master instructions govern how all AI auto-replies are composed and formatted.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">
                {isRTL ? 'التعليمات الأساسية' : 'Master Instructions'}
              </label>
              <textarea
                value={aiInstructions}
                onChange={(e) => setAiInstructions(e.target.value)}
                className="w-full min-h-[160px] p-4 text-xs font-mono bg-surface-elevated text-text-primary border border-border rounded-xl focus:outline-none focus:border-brand leading-relaxed"
                placeholder={isRTL ? 'اكتب تعليمات النظام للذكاء الاصطناعي...' : 'Write system instructions for the AI...'}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={isRTL ? 'اسم العلامة التجارية' : 'Brand Name'}
                value={profile.business_name}
                onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
              />
              <Input
                label={isRTL ? 'أسلوب الرد' : 'Reply Tone'}
                value={profile.reply_style}
                onChange={(e) => setProfile({ ...profile, reply_style: e.target.value })}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              variant="primary"
              size="md"
              loading={savingInstructions}
              onClick={handleSaveInstructions}
            >
              {isRTL ? 'حفظ التعليمات وإعادة نشرها' : 'Save & Redeploy Instructions'}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ─── Tab 4: Tester ───────────────────────────────────────────────── */}
      {activeTab === 'tester' && (
        <Card>
          <CardHeader>
            <CardTitle>{isRTL ? 'استرجاع المعرفة والبحث الدلالي' : 'Knowledge Retrieval & Semantic Search Sandbox'}</CardTitle>
            <CardDescription>
              {isRTL ? 'تحقق من المعلومات التي يستخرجها الذكاء الاصطناعي عند طرح العميل لسؤال.' : 'Verify what information your AI extracts when a customer asks a question'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <Input
                value={testQuestion}
                onChange={(e) => setTestQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTestQuestion()}
                placeholder={isRTL ? 'اكتب سؤالًا من العملاء لاختبار استرجاع المعرفة...' : 'Ask a customer question to test knowledge retrieval...'}
                className="flex-1"
              />
              <Button
                variant="primary"
                size="md"
                loading={testing}
                onClick={handleTestQuestion}
                icon={<Search size={14} />}
              >
                {isRTL ? 'فحص الإجابة' : 'Inspect Answer'}
              </Button>
            </div>

            {testResponse && (
              <div className="p-5 rounded-2xl bg-surface-elevated border border-border space-y-3 animate-in fade-in">
                <div className="text-xs font-bold text-text-primary flex items-center gap-2">
                  <Sparkles size={16} className="text-brand" />
                  <span>Synthesized AI Answer:</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed bg-surface-card p-3 rounded-xl border border-border">
                  {testResponse}
                </p>

              </div>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  )
}
