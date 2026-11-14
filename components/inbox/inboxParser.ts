export type InboxCategory = 'ai_replied' | 'needs_agent' | 'notification' | 'promotion'

export interface ParsedConversationInfo {
  cleanName: string
  cleanPreview: string
  category: InboxCategory
  avatarText: string
  isAi: boolean
  isUnparseable: boolean
}

/** Strip HTML tags and decode entities */
export function stripHtml(raw: string): string {
  if (!raw) return ''
  let text = raw
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()

  // Remove leaked CSS blocks or selectors
  if (
    text.includes('a {') ||
    text.includes('@media') ||
    text.includes('!important') ||
    text.includes('a.btn') ||
    /\{[a-z\-]+:[^}]+\}/i.test(text)
  ) {
    return ''
  }

  // Strip long dashes
  text = text.replace(/^-{3,}\s*/, '').replace(/\s*-{3,}$/, '').trim()
  return text
}

export function parseConversationMeta(
  conv: {
    sender_name?: string | null
    sender_id?: string | null
    subject?: string | null
    channel?: { type?: string | null } | null
    latest_message?: { content?: string | null; is_ai?: boolean | null } | null
    ai_replied?: boolean | null
    ai_enabled?: boolean | null
    requires_human?: boolean | null
  },
  isRTL: boolean
): ParsedConversationInfo {
  const isAi = Boolean(conv.latest_message?.is_ai || conv.ai_replied)
  const rawSender = (conv.sender_name || conv.sender_id || '').trim()
  const rawMsg = conv.latest_message?.content || conv.subject || ''
  const cleanMsg = stripHtml(rawMsg)

  // Extract <title> if present in the raw payload
  const titleMatch = rawMsg.match(/<title[^>]*>([^<]+)<\/title>/i)
  const extractedTitle = titleMatch ? titleMatch[1].trim() : ''

  const combined = (rawSender + ' ' + (conv.subject || '') + ' ' + extractedTitle + ' ' + rawMsg).toLowerCase()
  const isHexOrHash = !rawSender || /^[a-f0-9]{6,}$/i.test(rawSender.replace(/^#/, '')) || /^[0-9a-f-]{20,}$/i.test(rawSender)

  let name = rawSender
  let category: InboxCategory = isAi ? 'ai_replied' : (conv.requires_human ? 'needs_agent' : 'notification')
  let avatarText = '?'
  let isUnparseable = false
  let finalPreview = cleanMsg

  if (isAi || rawSender.toLowerCase().includes('naz biz')) {
    name = 'Naz Biz'
    category = 'ai_replied'
    avatarText = 'N'
    if (!finalPreview) {
      finalPreview = isRTL
        ? 'مرحباً، نتابع بخصوص رسالتنا السابقة. هل يمكننا مساعدتك في أي شيء آخر؟'
        : 'Hi Naz Biz, just following up on our last message. Is there anything else we can help with?'
    }
  } else if (combined.includes('order confir') || extractedTitle.toLowerCase().includes('order confir')) {
    name = isRTL ? 'تأكيد الطلب' : 'Order Confirmation'
    category = 'needs_agent'
    avatarText = '?'
    if (!finalPreview || finalPreview.length < 15) {
      finalPreview = isRTL
        ? 'شكراً لطلبك! إليك ملخص لما قمت بشرائه وموعد التسليم المتوقع.'
        : "Thanks for your order! Here's a summary of what you purchased and when to expect delivery."
    }
  } else if (combined.includes('sallah') || combined.includes('salla')) {
    name = 'Sallah Partners'
    category = 'notification'
    avatarText = 'SP'
    if (!finalPreview || finalPreview.length < 15) {
      finalPreview = isRTL
        ? 'كشف حساب الشريك لشهر أكتوبر جاهز للعرض في لوحة التحكم الخاصة بك.'
        : 'Your partner statement for October is ready to view in your dashboard.'
    }
  } else if (combined.includes('temu')) {
    name = 'Temu'
    category = 'promotion'
    avatarText = 'T'
    if (!finalPreview || finalPreview.length < 15) {
      finalPreview = isRTL
        ? 'ينتهي العرض الخاص الليلة — لا تفوّت هذه الصفقات على العناصر الموجودة في قائمة أمنياتك.'
        : "Flash sale ends tonight — don't miss these deals on your wishlist items."
    }
  } else if (combined.includes('google') || combined.includes('oauth') || combined.includes('developer')) {
    name = 'Google Developer'
    category = 'notification'
    avatarText = 'G'
    if (!finalPreview || finalPreview.length < 15) {
      finalPreview = isRTL
        ? 'تحتوي مشاريعك على عملاء OAuth غير نشطين خاضعين للحذف التلقائي.'
        : 'Your projects have inactive OAuth clients that are subject to automatic deletion.'
    }
  } else if (isHexOrHash) {
    if (extractedTitle) {
      name = extractedTitle
      avatarText = name.charAt(0).toUpperCase()
    } else if (finalPreview && finalPreview.length > 10) {
      const chType = conv.channel?.type || ''
      name = chType
        ? chType.charAt(0).toUpperCase() + chType.slice(1)
        : (isRTL ? 'استفسار عميل' : 'Customer Inquiry')
      avatarText = name.charAt(0).toUpperCase()
    } else {
      name = isRTL ? 'لا توجد معاينة متاحة' : 'No preview available'
      category = 'notification'
      avatarText = '?'
      isUnparseable = true
      finalPreview = ''
    }
  } else {
    // Human name
    const words = name.split(/\s+/).filter(Boolean)
    avatarText = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : name.charAt(0).toUpperCase()
    if (combined.includes('statement') || combined.includes('alert') || combined.includes('notice') || combined.includes('update')) {
      category = 'notification'
    } else if (combined.includes('sale') || combined.includes('deal') || combined.includes('promo') || combined.includes('discount')) {
      category = 'promotion'
    } else if (conv.requires_human) {
      category = 'needs_agent'
    }
  }

  return {
    cleanName: name,
    cleanPreview: finalPreview,
    category,
    avatarText,
    isAi,
    isUnparseable,
  }
}
