'use client'

import React, { memo, useState, useEffect } from 'react'
import { Download, ImageIcon, Loader2, AlertCircle, Maximize2 } from 'lucide-react'
import { ApiMessage } from '../../hooks/useInbox'
import { absoluteMediaUrl, useAuthenticatedBlob, formatFileSize } from '../../lib/mediaUrls'

interface MediaAlbumGridProps {
  messages: ApiMessage[]
  onOpenMedia?: (messageId: number) => void
  isRTL?: boolean
  caption?: string | null
  timeStr?: string
  statusIndicator?: React.ReactNode
}

interface MediaAlbumTileProps {
  msg: ApiMessage
  isOverlay?: boolean
  overlayCount?: number
  aspectRatioClass?: string
  colSpanClass?: string
  onOpenMedia?: (messageId: number) => void
  isRTL?: boolean
}

const MediaAlbumTile = memo(function MediaAlbumTile({
  msg,
  isOverlay = false,
  overlayCount = 0,
  aspectRatioClass = 'aspect-square',
  colSpanClass = 'col-span-1',
  onOpenMedia,
  isRTL = false,
}: MediaAlbumTileProps) {
  const directUrl = absoluteMediaUrl(msg.media_url)
  const isRemoteImage = /^https?:\/\//i.test(msg.media_url || '')
  const {
    url: authenticatedUrl,
    loading,
    error: fetchError,
  } = useAuthenticatedBlob(msg.id, directUrl, isRemoteImage)

  const [imgError, setImgError] = useState(false)
  useEffect(() => {
    setImgError(fetchError)
  }, [fetchError])

  const inlineUrl = msg.id > 0 && !isRemoteImage ? authenticatedUrl : directUrl
  const name = msg.file_name || `Photo #${msg.id}`

  return (
    <div
      className={`group/tile relative overflow-hidden rounded-lg bg-black/20 ${aspectRatioClass} ${colSpanClass}`}
    >
      {/* Loading state */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-elevated/40 text-text-tertiary">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      {/* Error state */}
      {imgError && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-surface-elevated text-text-tertiary">
          <AlertCircle className="h-5 w-5 text-warning mb-1" />
          <span className="text-[10px] leading-tight">
            {isRTL ? 'تعذرت المعاينة' : 'Failed to load'}
          </span>
        </div>
      )}

      {/* Actual image */}
      {!imgError && (
        <button
          type="button"
          onClick={() => onOpenMedia?.(msg.id)}
          disabled={loading}
          className="relative h-full w-full block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
          title={isRTL ? `عرض ${name}` : `View ${name}`}
          aria-label={isRTL ? `عرض ${name}` : `View ${name}`}
        >
          <img
            src={inlineUrl}
            alt={name}
            loading="lazy"
            onError={() => setImgError(true)}
            className={`h-full w-full object-cover transition-transform duration-300 ${
              loading ? 'opacity-0' : 'opacity-100 group-hover/tile:scale-[1.03]'
            }`}
          />

          {/* Hover highlight overlay */}
          {!loading && !isOverlay && (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover/tile:bg-black/20 group-hover/tile:opacity-100">
              <span className="rounded-full bg-black/60 p-2 text-white backdrop-blur-sm shadow-md">
                <Maximize2 size={14} />
              </span>
            </span>
          )}

          {/* +N Overlay for the last tile if there are 5+ items */}
          {isOverlay && overlayCount > 0 && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/65 backdrop-blur-[2px] transition-colors group-hover/tile:bg-black/75">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-md">
                +{overlayCount}
              </span>
            </span>
          )}
        </button>
      )}

      {/* Direct download button on hover (accessible via mouse or keyboard focus) */}
      {!loading && !imgError && inlineUrl && (
        <a
          href={inlineUrl}
          download={name}
          title={isRTL ? 'تنزيل الصورة الأصلية' : 'Download original image'}
          aria-label={isRTL ? `تنزيل ${name}` : `Download ${name}`}
          onClick={e => e.stopPropagation()}
          className="absolute end-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white/90 opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/85 hover:text-white group-hover/tile:opacity-100 focus-visible:opacity-100"
        >
          <Download size={13} />
        </a>
      )}
    </div>
  )
})

export default function MediaAlbumGrid({
  messages,
  onOpenMedia,
  isRTL = false,
  caption,
  timeStr,
  statusIndicator,
}: MediaAlbumGridProps) {
  if (!messages || messages.length === 0) return null

  const count = messages.length

  return (
    <div className="space-y-2">
      {/* 1 Image: Standard single layout */}
      {count === 1 && (
        <div className="max-w-[min(22rem,78vw)]">
          <MediaAlbumTile
            msg={messages[0]}
            aspectRatioClass="aspect-[4/3] max-h-80"
            colSpanClass="col-span-1"
            onOpenMedia={onOpenMedia}
            isRTL={isRTL}
          />
        </div>
      )}

      {/* 2 Images: 2 columns side-by-side */}
      {count === 2 && (
        <div className="grid grid-cols-2 gap-1.5 w-[min(24rem,80vw)]">
          <MediaAlbumTile
            msg={messages[0]}
            aspectRatioClass="aspect-square"
            onOpenMedia={onOpenMedia}
            isRTL={isRTL}
          />
          <MediaAlbumTile
            msg={messages[1]}
            aspectRatioClass="aspect-square"
            onOpenMedia={onOpenMedia}
            isRTL={isRTL}
          />
        </div>
      )}

      {/* 3 Images: 1 large top banner, 2 side-by-side below */}
      {count === 3 && (
        <div className="grid grid-cols-2 gap-1.5 w-[min(26rem,82vw)]">
          <MediaAlbumTile
            msg={messages[0]}
            aspectRatioClass="aspect-[16/9]"
            colSpanClass="col-span-2"
            onOpenMedia={onOpenMedia}
            isRTL={isRTL}
          />
          <MediaAlbumTile
            msg={messages[1]}
            aspectRatioClass="aspect-square"
            colSpanClass="col-span-1"
            onOpenMedia={onOpenMedia}
            isRTL={isRTL}
          />
          <MediaAlbumTile
            msg={messages[2]}
            aspectRatioClass="aspect-square"
            colSpanClass="col-span-1"
            onOpenMedia={onOpenMedia}
            isRTL={isRTL}
          />
        </div>
      )}

      {/* 4 Images: 2x2 grid */}
      {count === 4 && (
        <div className="grid grid-cols-2 gap-1.5 w-[min(26rem,82vw)]">
          {messages.slice(0, 4).map(msg => (
            <MediaAlbumTile
              key={msg.id}
              msg={msg}
              aspectRatioClass="aspect-square"
              onOpenMedia={onOpenMedia}
              isRTL={isRTL}
            />
          ))}
        </div>
      )}

      {/* 5+ Images: 2x2 grid showing 4 tiles with +N overlay on the 4th */}
      {count >= 5 && (
        <div className="grid grid-cols-2 gap-1.5 w-[min(26rem,82vw)]">
          <MediaAlbumTile
            msg={messages[0]}
            aspectRatioClass="aspect-square"
            onOpenMedia={onOpenMedia}
            isRTL={isRTL}
          />
          <MediaAlbumTile
            msg={messages[1]}
            aspectRatioClass="aspect-square"
            onOpenMedia={onOpenMedia}
            isRTL={isRTL}
          />
          <MediaAlbumTile
            msg={messages[2]}
            aspectRatioClass="aspect-square"
            onOpenMedia={onOpenMedia}
            isRTL={isRTL}
          />
          <MediaAlbumTile
            msg={messages[3]}
            aspectRatioClass="aspect-square"
            isOverlay={true}
            overlayCount={count - 3}
            onOpenMedia={onOpenMedia}
            isRTL={isRTL}
          />
        </div>
      )}

      {/* Optional Album Caption */}
      {caption && (
        <div className="mt-2 text-start text-[14px] leading-relaxed text-text-primary whitespace-pre-wrap [overflow-wrap:anywhere]">
          {caption}
        </div>
      )}
    </div>
  )
}
