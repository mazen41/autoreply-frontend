'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Download, Loader2, AlertCircle } from 'lucide-react'
import { useAuthenticatedBlob, formatFileSize } from '../../lib/mediaUrls'

export type MediaViewerItem = {
  id: number
  directUrl: string
  isRemote: boolean
  name: string
  fileSize?: number | null
  kind?: 'image' | 'video'
}

type MediaViewerProps = {
  items: MediaViewerItem[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
  isRTL: boolean
}

const MIN_SCALE = 1
const MAX_SCALE = 5

export default function MediaViewer({ items, index, onIndexChange, onClose, isRTL }: MediaViewerProps) {
  const item = items[index]
  const isVideo = item?.kind === 'video'
  const { url, loading, error } = useAuthenticatedBlob(item?.id ?? -1, item?.directUrl ?? '', item?.isRemote ?? false)

  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragState = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const previouslyFocused = useRef<Element | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const resetView = useCallback(() => {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }, [])

  // Reset zoom/pan whenever we move to a different item.
  useEffect(() => { resetView() }, [index, resetView])

  // Lock background scroll, remember and restore focus.
  useEffect(() => {
    previouslyFocused.current = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtnRef.current?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
      if (previouslyFocused.current instanceof HTMLElement) previouslyFocused.current.focus()
    }
  }, [])

  const goPrev = useCallback(() => { if (index > 0) onIndexChange(index - 1) }, [index, onIndexChange])
  const goNext = useCallback(() => { if (index < items.length - 1) onIndexChange(index + 1) }, [index, items.length, onIndexChange])
  const zoomBy = useCallback((delta: number) => {
    if (isVideo) return
    setScale(s => Math.min(MAX_SCALE, Math.max(MIN_SCALE, +(s + delta).toFixed(2))))
  }, [isVideo])

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === (isRTL ? 'ArrowRight' : 'ArrowLeft')) { goPrev(); return }
      if (e.key === (isRTL ? 'ArrowLeft' : 'ArrowRight')) { goNext(); return }
      if (e.key === '+' || e.key === '=') { zoomBy(0.4); return }
      if (e.key === '-' || e.key === '_') { zoomBy(-0.4); return }
      if (e.key === '0') { resetView(); return }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goPrev, goNext, zoomBy, resetView, onClose, isRTL])

  // Wheel to zoom (ctrl/trackpad pinch or plain scroll).
  const onWheel = useCallback((e: React.WheelEvent) => {
    if (isVideo) return
    e.preventDefault()
    zoomBy(e.deltaY < 0 ? 0.25 : -0.25)
  }, [zoomBy, isVideo])

  // Drag to pan once zoomed in.
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (isVideo || scale <= 1) return
    dragState.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [pan, scale])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current) return
    const dx = e.clientX - dragState.current.startX
    const dy = e.clientY - dragState.current.startY
    setPan({ x: dragState.current.panX + dx, y: dragState.current.panY + dy })
  }, [])

  const onPointerUp = useCallback(() => { dragState.current = null }, [])

  if (!item) return null

  const L = (en: string, ar: string) => (isRTL ? ar : en)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={L('Image viewer', 'عارض الصور')}
      className="fixed inset-0 z-[70] flex flex-col bg-black/90 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 text-white/90">
        <div className="min-w-0 truncate text-sm">
          <span className="font-medium">{item.name}</span>
          {item.fileSize ? <span className="ms-2 text-white/50">{formatFileSize(item.fileSize)}</span> : null}
          {items.length > 1 && <span className="ms-2 text-white/40">{index + 1} / {items.length}</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => zoomBy(-0.4)} disabled={isVideo || scale <= MIN_SCALE} className="rounded-lg p-2 text-white/80 hover:bg-white/10 disabled:opacity-30" title={L('Zoom out', 'تصغير')} aria-label={L('Zoom out', 'تصغير')}><ZoomOut size={18} /></button>
          <button type="button" onClick={() => zoomBy(0.4)} disabled={isVideo || scale >= MAX_SCALE} className="rounded-lg p-2 text-white/80 hover:bg-white/10 disabled:opacity-30" title={L('Zoom in', 'تكبير')} aria-label={L('Zoom in', 'تكبير')}><ZoomIn size={18} /></button>
          <button type="button" onClick={resetView} disabled={isVideo} className="rounded-lg p-2 text-white/80 hover:bg-white/10 disabled:opacity-30" title={L('Reset zoom', 'إعادة ضبط التكبير')} aria-label={L('Reset zoom', 'إعادة ضبط التكبير')}><Maximize2 size={18} /></button>
          {url && (
            <a href={url} download={item.name} className="rounded-lg p-2 text-white/80 hover:bg-white/10" title={L('Download original', 'تنزيل الملف الأصلي')} aria-label={L('Download original', 'تنزيل الملف الأصلي')}><Download size={18} /></a>
          )}
          <button ref={closeBtnRef} type="button" onClick={onClose} className="ms-1 rounded-lg p-2 text-white/80 hover:bg-white/10" title={L('Close', 'إغلاق')} aria-label={L('Close', 'إغلاق')}><X size={20} /></button>
        </div>
      </div>

      {/* Stage */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden select-none"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={{ cursor: scale > 1 ? 'grab' : 'default' }}
      >
        {items.length > 1 && (
          <button
            type="button"
            onClick={goPrev}
            disabled={index === 0}
            className="absolute start-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white hover:bg-black/60 disabled:opacity-20"
            title={L('Previous', 'السابق')}
            aria-label={L('Previous image', 'الصورة السابقة')}
          >
            <ChevronLeft size={22} className={isRTL ? 'scale-x-[-1]' : ''} />
          </button>
        )}

        {loading && <Loader2 className="h-8 w-8 animate-spin text-white/70" />}
        {!loading && error && (
          <div className="flex flex-col items-center gap-2 text-white/70">
            <AlertCircle size={28} />
            <span className="text-sm">{isVideo ? L('This video could not be loaded.', 'تعذر تحميل هذا الفيديو.') : L('This image could not be loaded.', 'تعذر تحميل هذه الصورة.')}</span>
          </div>
        )}
        {!loading && !error && url && isVideo && (
          <video
            src={url}
            controls
            autoPlay
            className="max-h-full max-w-full"
          />
        )}
        {!loading && !error && url && !isVideo && (
          <img
            ref={imgRef}
            src={url}
            alt={item.name}
            draggable={false}
            className="max-h-full max-w-full object-contain transition-transform duration-150 ease-out"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
          />
        )}

        {items.length > 1 && (
          <button
            type="button"
            onClick={goNext}
            disabled={index === items.length - 1}
            className="absolute end-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white hover:bg-black/60 disabled:opacity-20"
            title={L('Next', 'التالي')}
            aria-label={L('Next image', 'الصورة التالية')}
          >
            <ChevronRight size={22} className={isRTL ? 'scale-x-[-1]' : ''} />
          </button>
        )}
      </div>
    </div>
  )
}
