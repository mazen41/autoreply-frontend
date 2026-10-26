'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, Loader2, Pause, Play } from 'lucide-react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** Deterministic pseudo-random waveform bars from a seed string */
function generateWaveform(seed: string, bars = 36): number[] {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  }
  const result: number[] = []
  for (let i = 0; i < bars; i++) {
    h = (Math.imul(1664525, h) + 1013904223) | 0
    const raw = ((h >>> 0) % 100) / 100 // 0..1
    const shaped = 0.2 + raw * 0.8 // 0.2..1 (avoid tiny bars)
    result.push(shaped)
  }
  return result
}

// ---------------------------------------------------------------------------
// Global singleton registry – ensures only one voice message plays at a time
// ---------------------------------------------------------------------------
type StopFn = () => void
const registry = new Set<StopFn>()
function registerPlayer(stop: StopFn): () => void {
  registry.add(stop)
  return () => { registry.delete(stop) }
}
function pauseOthers(self: StopFn) {
  registry.forEach((fn) => fn !== self && fn())
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface VoiceMessagePlayerProps {
  /** Authenticated blob URL or playable audio URL */
  src: string
  /** Hint duration from message metadata (seconds) */
  hintDuration?: number | null
  /** Whether displayed on a solid brand outgoing bubble (adjusts contrast) */
  isOutgoing?: boolean
  isRTL?: boolean
  /** Seed for deterministic waveform bars (e.g. message id or url) */
  seed?: string
  onError?: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function VoiceMessagePlayer({
  src,
  hintDuration,
  isOutgoing = false,
  isRTL = false,
  seed = src,
  onError,
}: VoiceMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const waveformRef = useRef<HTMLDivElement>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0) // 0..1
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState<number>(hintDuration ?? 0)
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [isDragging, setIsDragging] = useState(false)

  const bars = React.useMemo(() => generateWaveform(seed || 'voice'), [seed])

  const stopSelf = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    setIsPlaying(false)
  }, [])

  // Register in global registry so playing one pauses others
  useEffect(() => {
    return registerPlayer(stopSelf)
  }, [stopSelf])

  // Sync hintDuration if provided or changed later
  useEffect(() => {
    if (typeof hintDuration === 'number' && isFinite(hintDuration) && hintDuration > 0) {
      setDuration((prev) => (prev > 0 ? prev : hintDuration))
    }
  }, [hintDuration])

  // Create audio element and lifecycle
  useEffect(() => {
    if (!src) {
      setLoadState('idle')
      return
    }

    const audio = new Audio()
    audio.preload = 'metadata'
    audioRef.current = audio

    const onLoadStart = () => setLoadState('loading')

    const onLoadedMeta = () => {
      setLoadState('ready')
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration)
      } else if (audio.duration === Infinity) {
        // Chromium/Safari WebM duration workaround
        const onTimeFix = () => {
          audio.removeEventListener('timeupdate', onTimeFix)
          audio.currentTime = 0
          if (isFinite(audio.duration) && audio.duration > 0) {
            setDuration(audio.duration)
          }
        }
        audio.addEventListener('timeupdate', onTimeFix)
        audio.currentTime = 1e7
      }
    }

    const onDurationChange = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration)
      }
    }

    const onTimeUpdate = () => {
      if (isDragging) return
      setCurrentTime(audio.currentTime)
      const effectiveDuration =
        isFinite(audio.duration) && audio.duration > 0
          ? audio.duration
          : duration > 0
          ? duration
          : 0

      if (effectiveDuration > 0) {
        setProgress(Math.min(1, Math.max(0, audio.currentTime / effectiveDuration)))
      }
      if (!isFinite(audio.duration) && audio.currentTime > duration) {
        setDuration(audio.currentTime)
      }
    }

    const onPlaying = () => {
      setIsPlaying(true)
      setLoadState('ready')
    }

    const onPause = () => {
      setIsPlaying(false)
    }

    const onWaiting = () => {
      setLoadState('loading')
    }

    const onCanPlay = () => {
      setLoadState((prev) => (prev === 'loading' ? 'ready' : prev))
    }

    const onEnded = () => {
      setIsPlaying(false)
      setProgress(0)
      setCurrentTime(0)
    }

    const onErrorEvt = () => {
      setLoadState('error')
      setIsPlaying(false)
      onError?.()
    }

    audio.addEventListener('loadstart', onLoadStart)
    audio.addEventListener('loadedmetadata', onLoadedMeta)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onErrorEvt)

    audio.src = src

    return () => {
      audio.pause()
      audio.src = ''
      audio.removeEventListener('loadstart', onLoadStart)
      audio.removeEventListener('loadedmetadata', onLoadedMeta)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onErrorEvt)
    }
  }, [src, isDragging, duration, onError])

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio || loadState === 'error') return
    if (isPlaying) {
      audio.pause()
    } else {
      pauseOthers(stopSelf)
      try {
        setLoadState((prev) => (prev === 'idle' ? 'loading' : prev))
        await audio.play()
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          setLoadState('error')
          onError?.()
        }
      }
    }
  }, [isPlaying, loadState, stopSelf, onError])

  // Seek helpers
  const seekTo = useCallback(
    (ratio: number) => {
      const audio = audioRef.current
      const effectiveDuration =
        isFinite(audio?.duration ?? NaN) && (audio?.duration ?? 0) > 0
          ? audio!.duration
          : duration > 0
          ? duration
          : 0

      const clamped = Math.max(0, Math.min(1, ratio))
      if (audio && effectiveDuration > 0) {
        audio.currentTime = clamped * effectiveDuration
      }
      setProgress(clamped)
      setCurrentTime(clamped * effectiveDuration)
    },
    [duration]
  )

  const getRatioFromEvent = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const el = waveformRef.current
    if (!el) return 0
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0) return 0
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX
    return (clientX - rect.left) / rect.width
  }, [])

  const handleWaveformPointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      setIsDragging(true)
      seekTo(getRatioFromEvent(e))
    },
    [seekTo, getRatioFromEvent]
  )

  useEffect(() => {
    if (!isDragging) return
    const onMove = (e: MouseEvent | TouchEvent) => {
      const el = waveformRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      if (rect.width <= 0) return
      const clientX =
        'touches' in e
          ? (e as TouchEvent).touches[0]?.clientX ?? 0
          : (e as MouseEvent).clientX
      seekTo((clientX - rect.left) / rect.width)
    }
    const onUp = () => setIsDragging(false)

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove)
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [isDragging, seekTo])

  // ---------------------------------------------------------------------------
  // Colour tokens (respects theme; adjusts for solid brand bubble vs soft/incoming)
  // ---------------------------------------------------------------------------
  const playBtnBase = isOutgoing
    ? 'bg-brand-text/15 hover:bg-brand-text/25 text-brand-text border-brand-text/25'
    : 'bg-brand/15 hover:bg-brand/25 text-brand border-brand/30'

  const barPlayed = isOutgoing ? 'var(--brand-text)' : 'var(--brand)'
  const barUnplayed = isOutgoing
    ? 'color-mix(in srgb, var(--brand-text) 35%, transparent)'
    : 'var(--border-strong)'
  const timeColor = isOutgoing ? 'text-brand-text/75' : 'text-text-tertiary'

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (loadState === 'error') {
    return (
      <div
        className={`flex w-[min(17rem,68vw)] items-center gap-2 rounded-xl border px-3 py-2 text-[12px] ${
          isOutgoing
            ? 'border-brand-text/20 text-brand-text/75'
            : 'border-border text-text-secondary'
        }`}
      >
        <AlertCircle size={14} className="shrink-0 text-error" />
        <span>{isRTL ? 'الصوت غير متاح' : 'Audio unavailable'}</span>
      </div>
    )
  }

  return (
    <div className="flex w-[min(17rem,68vw)] items-center gap-2.5 select-none">
      {/* Play / Pause button */}
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? (isRTL ? 'إيقاف مؤقت' : 'Pause') : (isRTL ? 'تشغيل' : 'Play')}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${playBtnBase}`}
      >
        {loadState === 'loading' ? (
          <Loader2 size={14} className="animate-spin" />
        ) : isPlaying ? (
          <Pause size={14} />
        ) : (
          <Play size={14} className="translate-x-[1px]" />
        )}
      </button>

      {/* Waveform + time */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Waveform */}
        <div
          ref={waveformRef}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label={isRTL ? 'التقدم في الصوت' : 'Seek audio'}
          tabIndex={0}
          className="flex h-7 cursor-pointer items-center gap-[2px] touch-none"
          onMouseDown={handleWaveformPointerDown}
          onTouchStart={handleWaveformPointerDown}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') {
              e.preventDefault()
              seekTo(Math.min(1, progress + 0.05))
            } else if (e.key === 'ArrowLeft') {
              e.preventDefault()
              seekTo(Math.max(0, progress - 0.05))
            } else if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault()
              void togglePlay()
            }
          }}
        >
          {bars.map((height, i) => {
            const barProgress = i / bars.length
            const played = barProgress < progress
            return (
              <div
                key={i}
                className="flex-1 rounded-full transition-colors duration-75"
                style={{
                  height: `${Math.round(height * 100)}%`,
                  minHeight: 3,
                  background: played ? barPlayed : barUnplayed,
                }}
              />
            )
          })}
        </div>

        {/* Time */}
        <div
          className={`flex justify-between text-[10px] font-medium leading-none tabular-nums ${timeColor}`}
        >
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>
    </div>
  )
}
