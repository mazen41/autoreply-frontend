export type CampaignType = 'bulk' | 'email' | 'social' | 'comment' | 'cart' | 'other'

export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'partially_sent'
  | 'failed'
  | 'partially_failed'
  | 'paused'

export interface Channel {
  id: number
  type: string
  page_name: string
  status: string
  metadata?: Record<string, any>
}

export interface UnifiedCampaign {
  id: number
  type: CampaignType
  name: string
  subject?: string
  message?: string
  content?: string
  channel_id?: number
  channel?: Channel
  status: CampaignStatus
  scheduled_at: string | null
  sent_at: string | null
  paused_at?: string | null
  total_recipients: number | null
  sent_count: number | null
  delivered_count: number | null
  opened_count: number | null
  clicked_count: number | null
  failed_count: number | null
  error_message?: string | null
  filters?: {
    tags?: string[]
    last_activity_days?: number
  } | null
  whatsapp_cloud_template_id?: number | null
  created_at: string
  updated_at?: string
}

export interface CampaignLogItem {
  id: number
  campaign_id: number
  conversation_id: number
  status: 'queued' | 'sent' | 'failed'
  provider_message_id: string | null
  error_message: string | null
  sent_at: string | null
  created_at: string
  conversation?: {
    id: number
    sender_name?: string | null
    sender_id?: string | null
    channel_type?: string | null
  } | null
}

export interface MessageAudiencePreview {
  sender: {
    channel_id: number
    channel_type: string
    account_name: string
    connected: boolean
  }
  total_matched: number
  eligible: number
  excluded: Record<string, number>
  excluded_reasons?: Record<string, number>
  campaign_ready: boolean
  configuration_reason: string | null
  rechecked_at_delivery: boolean
}

export interface EmailAudiencePreview {
  count: number
  total_matched: number
  excluded_no_consent: number
  excluded_opted_out: number
  excluded_suppression: number
  excluded_automated_sender: number
  sender: { name: string; address: string; configured: boolean }
}

export interface StatusConfig {
  label: string
  labelAr: string
  description: string
  descriptionAr: string
  variant: 'default' | 'outline' | 'success' | 'warning' | 'error' | 'ai' | 'neutral'
}

export function getStatusConfig(status: CampaignStatus): StatusConfig {
  switch (status) {
    case 'draft':
      return {
        label: 'Draft',
        labelAr: 'مسودة',
        description: 'Saved but not sent. Can be edited or scheduled.',
        descriptionAr: 'محفوظ كمسودة ولم يتم إرساله بعد. يمكن تعديله أو جدولته.',
        variant: 'outline',
      }
    case 'scheduled':
      return {
        label: 'Scheduled',
        labelAr: 'مجدول',
        description: 'Waiting for its scheduled launch time.',
        descriptionAr: 'في انتظار موعد الإرسال المحدد. يمكن إطلاقه فوراً أو إلغاؤه.',
        variant: 'warning',
      }
    case 'sending':
      return {
        label: 'Sending',
        labelAr: 'قيد الإرسال',
        description: 'Currently processing and dispatching messages to recipients.',
        descriptionAr: 'جاري الآن إرسال الرسائل إلى المستلمين في الخلفية.',
        variant: 'ai',
      }
    case 'sent':
      return {
        label: 'Sent',
        labelAr: 'مكتمل الإرسال',
        description: 'Sending finished successfully for all recipients.',
        descriptionAr: 'اكتمل إرسال جميع الرسائل بنجاح.',
        variant: 'success',
      }
    case 'partially_sent':
    case 'partially_failed':
      return {
        label: 'Partially Sent',
        labelAr: 'مرسل جزئياً',
        description: 'Some recipients received the message, but others failed.',
        descriptionAr: 'وصلت الرسالة لبعض المستلمين وفشلت للبعض الآخر. تحقق من السجلات.',
        variant: 'warning',
      }
    case 'paused':
      return {
        label: 'Paused',
        labelAr: 'متوقف مؤقتاً',
        description: 'Dispatch paused by admin. Can be resumed.',
        descriptionAr: 'تم إيقاف الإرسال مؤقتاً. يمكن استئنافه في أي وقت.',
        variant: 'neutral',
      }
    case 'failed':
      return {
        label: 'Failed',
        labelAr: 'فشل الإرسال',
        description: 'Sending encountered an error and was stopped.',
        descriptionAr: 'واجه الإرسال خطأ وتوقف. تفقد السجلات لمعرفة السبب.',
        variant: 'error',
      }
    default:
      return {
        label: status,
        labelAr: status,
        description: 'Campaign status',
        descriptionAr: 'حالة الحملة',
        variant: 'default',
      }
  }
}
