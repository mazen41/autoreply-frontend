import { ApiMessage } from '../hooks/useInbox'

export const CLUSTER_WINDOW_SECONDS = 15
export const CLUSTER_MAX_SPAN_SECONDS = 60
export const CLUSTER_MAX_ITEMS = 12

export interface TimelineClusterItem {
  type: 'cluster'
  id: string
  conversation_id: number
  messages: ApiMessage[]
  primaryMessage: ApiMessage
  caption?: string | null
  created_at: string
}

export interface TimelineSingleItem {
  type: 'single'
  message: ApiMessage
}

export type TimelineItem = TimelineSingleItem | TimelineClusterItem

/**
 * Returns true if the message is an inbound image/photo message that can be
 * part of a clustered visual album.
 */
export function isClusterableImageMessage(msg: ApiMessage): boolean {
  if (!msg) return false

  // 1. Only group inbound messages
  if (msg.direction !== 'inbound') return false

  // 2. Never group deleted messages
  if (msg.metadata?.deleted_for_everyone === true) return false

  // 3. Must have an image media type or image MIME
  const mime = (msg.mime_type || '').toLowerCase()
  const isImage =
    msg.media_type === 'image' ||
    mime.startsWith('image/') ||
    (msg.media_type === 'sticker' && mime.startsWith('image/'))

  if (!isImage || !msg.media_url) return false

  // 4. Must not be audio, video, document, archive, or pdf
  if (
    msg.media_type === 'audio' ||
    msg.media_type === 'video' ||
    msg.media_type === 'document' ||
    mime.startsWith('audio/') ||
    mime.startsWith('video/') ||
    mime === 'application/pdf'
  ) {
    return false
  }

  return true
}

/**
 * Checks if two consecutive messages can be clustered together.
 */
export function canClusterPair(
  prev: ApiMessage,
  next: ApiMessage,
  windowSeconds = CLUSTER_WINDOW_SECONDS
): boolean {
  if (!isClusterableImageMessage(prev) || !isClusterableImageMessage(next)) {
    return false
  }

  // Must belong to the exact same conversation
  if (prev.conversation_id !== next.conversation_id) return false

  // Timestamps must be valid
  const t1 = new Date(prev.created_at).getTime()
  const t2 = new Date(next.created_at).getTime()
  if (isNaN(t1) || isNaN(t2)) return false

  // Consecutive messages must arrive within the allowed window
  const diffSec = Math.abs(t2 - t1) / 1000
  if (diffSec > windowSeconds) return false

  return true
}

/**
 * Clusters a chronological list of messages into timeline items.
 * Consecutive inbound image messages within the time window become an album cluster.
 * Preserves all original ApiMessage records, IDs, and ordering.
 * Resolves ambiguity conservatively: if multiple messages carry different text captions,
 * they are kept separate to prevent misattributing text.
 */
export function clusterMessages(
  messages: ApiMessage[],
  windowSeconds = CLUSTER_WINDOW_SECONDS,
  maxSpanSeconds = CLUSTER_MAX_SPAN_SECONDS
): TimelineItem[] {
  if (!messages || messages.length === 0) return []

  const items: TimelineItem[] = []
  let currentCluster: ApiMessage[] = []

  const flushCluster = () => {
    if (currentCluster.length === 0) return

    if (currentCluster.length === 1) {
      items.push({ type: 'single', message: currentCluster[0] })
      currentCluster = []
      return
    }

    // Cluster has >= 2 messages.
    // Check ambiguity: if more than 1 message has text content, keep them separate.
    const messagesWithText = currentCluster.filter(
      m => m.content && m.content.trim().length > 0
    )

    if (messagesWithText.length > 1) {
      // Ambiguous captions: display individually
      for (const msg of currentCluster) {
        items.push({ type: 'single', message: msg })
      }
      currentCluster = []
      return
    }

    // Check total span
    const firstTime = new Date(currentCluster[0].created_at).getTime()
    const lastTime = new Date(
      currentCluster[currentCluster.length - 1].created_at
    ).getTime()
    if (
      !isNaN(firstTime) &&
      !isNaN(lastTime) &&
      (lastTime - firstTime) / 1000 > maxSpanSeconds
    ) {
      // Span exceeded: display individually
      for (const msg of currentCluster) {
        items.push({ type: 'single', message: msg })
      }
      currentCluster = []
      return
    }

    // Valid cluster! The primary message is the one with caption (if any), otherwise the last one
    const captionMsg = messagesWithText[0]
    const primary = captionMsg || currentCluster[currentCluster.length - 1]

    items.push({
      type: 'cluster',
      id: `cluster-${currentCluster[0].id}-${currentCluster[currentCluster.length - 1].id}`,
      conversation_id: primary.conversation_id,
      messages: [...currentCluster],
      primaryMessage: primary,
      caption: captionMsg ? captionMsg.content.trim() : null,
      created_at: primary.created_at,
    })

    currentCluster = []
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]

    if (!isClusterableImageMessage(msg)) {
      // Non-clusterable message (text, outbound, video, system, etc.)
      flushCluster()
      items.push({ type: 'single', message: msg })
      continue
    }

    if (currentCluster.length === 0) {
      currentCluster.push(msg)
    } else {
      const prev = currentCluster[currentCluster.length - 1]
      const canCluster =
        currentCluster.length < CLUSTER_MAX_ITEMS &&
        canClusterPair(prev, msg, windowSeconds)

      if (canCluster) {
        currentCluster.push(msg)
      } else {
        flushCluster()
        currentCluster.push(msg)
      }
    }
  }

  flushCluster()
  return items
}
