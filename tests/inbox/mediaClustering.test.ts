import { describe, it, expect } from 'vitest'
import {
  isClusterableImageMessage,
  canClusterPair,
  clusterMessages,
} from '../../lib/mediaClustering'
import { ApiMessage } from '../../hooks/useInbox'

function makeMsg(overrides: Partial<ApiMessage>): ApiMessage {
  return {
    id: 1,
    conversation_id: 100,
    content: '',
    direction: 'inbound',
    is_ai: false,
    status: 'delivered',
    created_at: '2026-11-16T10:00:00.000Z',
    media_url: 'https://example.com/photo.jpg',
    media_type: 'image',
    mime_type: 'image/jpeg',
    ...overrides,
  }
}

describe('mediaClustering', () => {
  describe('isClusterableImageMessage', () => {
    it('returns true for inbound image message', () => {
      const msg = makeMsg({})
      expect(isClusterableImageMessage(msg)).toBe(true)
    })

    it('returns false for outbound message', () => {
      const msg = makeMsg({ direction: 'outbound' })
      expect(isClusterableImageMessage(msg)).toBe(false)
    })

    it('returns false for deleted message', () => {
      const msg = makeMsg({ metadata: { deleted_for_everyone: true } })
      expect(isClusterableImageMessage(msg)).toBe(false)
    })

    it('returns false for audio/video/document', () => {
      expect(isClusterableImageMessage(makeMsg({ media_type: 'video', mime_type: 'video/mp4' }))).toBe(false)
      expect(isClusterableImageMessage(makeMsg({ media_type: 'audio', mime_type: 'audio/ogg' }))).toBe(false)
      expect(isClusterableImageMessage(makeMsg({ media_type: 'document', mime_type: 'application/pdf' }))).toBe(false)
    })

    it('returns false for message without media_url', () => {
      expect(isClusterableImageMessage(makeMsg({ media_url: null }))).toBe(false)
    })
  })

  describe('canClusterPair', () => {
    it('returns true for two consecutive inbound images within 15 seconds', () => {
      const m1 = makeMsg({ id: 1, created_at: '2026-11-16T10:00:00.000Z' })
      const m2 = makeMsg({ id: 2, created_at: '2026-11-16T10:00:08.000Z' })
      expect(canClusterPair(m1, m2)).toBe(true)
    })

    it('returns false when time gap exceeds 15 seconds', () => {
      const m1 = makeMsg({ id: 1, created_at: '2026-11-16T10:00:00.000Z' })
      const m2 = makeMsg({ id: 2, created_at: '2026-11-16T10:00:25.000Z' })
      expect(canClusterPair(m1, m2)).toBe(false)
    })

    it('returns false when conversations differ', () => {
      const m1 = makeMsg({ id: 1, conversation_id: 100 })
      const m2 = makeMsg({ id: 2, conversation_id: 101 })
      expect(canClusterPair(m1, m2)).toBe(false)
    })
  })

  describe('clusterMessages', () => {
    it('returns empty array for empty input', () => {
      expect(clusterMessages([])).toEqual([])
    })

    it('leaves a single image as single item', () => {
      const m1 = makeMsg({ id: 1 })
      const result = clusterMessages([m1])
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('single')
      if (result[0].type === 'single') {
        expect(result[0].message.id).toBe(1)
      }
    })

    it('clusters 3 consecutive inbound images arriving within 5 seconds', () => {
      const m1 = makeMsg({ id: 1, created_at: '2026-11-16T10:00:00.000Z' })
      const m2 = makeMsg({ id: 2, created_at: '2026-11-16T10:00:02.000Z' })
      const m3 = makeMsg({ id: 3, created_at: '2026-11-16T10:00:05.000Z' })

      const result = clusterMessages([m1, m2, m3])
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('cluster')
      if (result[0].type === 'cluster') {
        expect(result[0].messages).toHaveLength(3)
        expect(result[0].messages.map(m => m.id)).toEqual([1, 2, 3])
      }
    })

    it('breaks cluster when interrupted by a text message', () => {
      const m1 = makeMsg({ id: 1, created_at: '2026-11-16T10:00:00.000Z' })
      const textMsg = makeMsg({
        id: 2,
        content: 'Hey check these out',
        media_url: null,
        media_type: null,
        created_at: '2026-11-16T10:00:02.000Z',
      })
      const m3 = makeMsg({ id: 3, created_at: '2026-11-16T10:00:04.000Z' })

      const result = clusterMessages([m1, textMsg, m3])
      expect(result).toHaveLength(3)
      expect(result.map(r => r.type)).toEqual(['single', 'single', 'single'])
    })

    it('breaks cluster when interrupted by an outbound agent message', () => {
      const m1 = makeMsg({ id: 1, created_at: '2026-11-16T10:00:00.000Z' })
      const outbound = makeMsg({
        id: 2,
        direction: 'outbound',
        content: 'Thanks for sending',
        media_url: null,
        created_at: '2026-11-16T10:00:03.000Z',
      })
      const m3 = makeMsg({ id: 3, created_at: '2026-11-16T10:00:06.000Z' })

      const result = clusterMessages([m1, outbound, m3])
      expect(result).toHaveLength(3)
      expect(result.map(r => r.type)).toEqual(['single', 'single', 'single'])
    })

    it('preserves single caption on cluster if only one image has text', () => {
      const m1 = makeMsg({ id: 1, created_at: '2026-11-16T10:00:00.000Z' })
      const m2 = makeMsg({
        id: 2,
        content: 'Do you have this in blue?',
        created_at: '2026-11-16T10:00:04.000Z',
      })

      const result = clusterMessages([m1, m2])
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('cluster')
      if (result[0].type === 'cluster') {
        expect(result[0].caption).toBe('Do you have this in blue?')
        expect(result[0].messages).toHaveLength(2)
      }
    })

    it('dissolves cluster if multiple messages have captions (ambiguity protection)', () => {
      const m1 = makeMsg({
        id: 1,
        content: 'First photo caption',
        created_at: '2026-11-16T10:00:00.000Z',
      })
      const m2 = makeMsg({
        id: 2,
        content: 'Second photo caption',
        created_at: '2026-11-16T10:00:04.000Z',
      })

      const result = clusterMessages([m1, m2])
      // Dissolved to 2 singles to preserve caption-to-photo pairing
      expect(result).toHaveLength(2)
      expect(result.map(r => r.type)).toEqual(['single', 'single'])
    })

    it('preserves all message records, IDs, and chronological ordering', () => {
      const m1 = makeMsg({ id: 10, created_at: '2026-11-16T10:00:00.000Z' })
      const m2 = makeMsg({ id: 11, created_at: '2026-11-16T10:00:05.000Z' })
      const m3 = makeMsg({ id: 12, created_at: '2026-11-16T10:00:09.000Z' })
      const m4 = makeMsg({ id: 13, created_at: '2026-11-16T10:00:12.000Z' })
      const m5 = makeMsg({ id: 14, created_at: '2026-11-16T10:00:15.000Z' })

      const result = clusterMessages([m1, m2, m3, m4, m5])
      expect(result).toHaveLength(1)
      if (result[0].type === 'cluster') {
        expect(result[0].messages.map(m => m.id)).toEqual([10, 11, 12, 13, 14])
      }
    })
  })
})
