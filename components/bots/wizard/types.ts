export interface BotAvatarOption {
  id: string
  nameEn: string
  nameAr: string
  titleEn: string
  titleAr: string
  descEn: string
  descAr: string
  image: string
  themeColor: string
  glowColor: string
  gradient: string
}

export const BOT_AVATARS: BotAvatarOption[] = [
  {
    id: 'robot-01',
    nameEn: 'Spark',
    nameAr: 'سبارك',
    titleEn: 'Omnichannel Conversationalist',
    titleAr: 'مساعد المحادثة متعدد القنوات',
    descEn: 'Warm, natural, and empathetic. Masters rapid replies to customer questions and everyday inquiries.',
    descAr: 'طبيعي وودود ومتعاطف. يجيد الرد السريع على استفسارات العملاء وأسئلتهم اليومية.',
    image: '/bots/robot-01.png',
    themeColor: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.45)',
    gradient: 'from-blue-600/30 via-indigo-600/20 to-cyan-500/10',
  },
  {
    id: 'robot-02',
    nameEn: 'Nexus',
    nameAr: 'نيكسوس',
    titleEn: 'Knowledge & Commerce Core',
    titleAr: 'عقل المعرفة والتجارة الذكية',
    descEn: 'Analytical, fast and accurate. Directly grounded in your store catalog, shipping rules, and policies.',
    descAr: 'دقيق وتحليلي وسريع. يستند مباشرة إلى كتالوج متجرك وسياسات الشحن والأسئلة الشائعة.',
    image: '/bots/robot-02.png',
    themeColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    gradient: 'from-cyan-600/30 via-teal-600/20 to-blue-500/10',
  },
  {
    id: 'robot-03',
    nameEn: 'Pulse',
    nameAr: 'بولس',
    titleEn: 'Sales & Growth Specialist',
    titleAr: 'مستشار المبيعات والنمو',
    descEn: 'Persuasive, proactive and engaging. Recommends products, guides shoppers, and closes orders.',
    descAr: 'مقنع ومحفز واستباقي. يقترح المنتجات المناسبة ويساعد العملاء على إتمام طلباتهم بسرعة.',
    image: '/bots/robot-03.png',
    themeColor: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.45)',
    gradient: 'from-purple-600/30 via-violet-600/20 to-pink-500/10',
  },
  {
    id: 'robot-04',
    nameEn: 'Apex',
    nameAr: 'أبيكس',
    titleEn: 'Enterprise Guardian',
    titleAr: 'الحارس المؤسسي المتكامل',
    descEn: 'Robust, authoritative and protective. Handles post comments, triage, and seamless human escalation.',
    descAr: 'قوي وموثوق ومحكم. يدير الردود على التعليقات، ويصنف الطلبات المعقدة للتحويل البشري.',
    image: '/bots/robot-04.png',
    themeColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.45)',
    gradient: 'from-pink-600/30 via-rose-600/20 to-purple-500/10',
  },
]

export type WizardStepId = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type PublicInfoCategory =
  | 'general_business_info'
  | 'product_names'
  | 'product_descriptions'
  | 'product_prices'
  | 'discounts'
  | 'availability'
  | 'product_links'

export interface CommentSettings {
  enabled: boolean
  public_reply_enabled: boolean
  private_reply_enabled: boolean
  settings: {
    public_information: PublicInfoCategory[]
    fallback_response: string
    trigger_keywords: string[]
    excluded_keywords: string[]
  }
}

export interface KnowledgeFile {
  id: number
  filename: string
  file_type?: string | null
  chunks_count?: number | null
}

export interface ChannelRecord {
  id: number
  type: string
  page_id?: string
  page_name?: string
  status?: string
  comment_webhook_status?: 'subscribed' | 'error' | 'unknown' | string
  comment_webhook_error_code?: string | null
  bots?: Array<{ id: number; name?: string; status?: string; pivot?: { is_primary?: boolean } }>
}

export interface BotCapabilitiesState {
  autoReply: boolean
  faqGrounding: boolean
  commerceRouting: boolean
  humanHandoff: boolean
  commentAutomation: boolean
}

export interface KnowledgeAssignment {
  file_id: number
  channel_id: number | null
}

export interface PersonaTemplate {
  id: string
  titleEn: string
  titleAr: string
  descEn: string
  descAr: string
  toneEn: string
  toneAr: string
  instructionsEn: string
  instructionsAr: string
  avatarId: string
}

export const PERSONA_TEMPLATES: PersonaTemplate[] = [
  {
    id: 'support',
    titleEn: 'Customer Support',
    titleAr: 'خدمة العملاء والدعم',
    descEn: 'Calm, empathetic, and clear. Resolves customer inquiries using store knowledge.',
    descAr: 'هادئ ومتعاطف وواضح. يحل مشاكل العملاء ويجيب عن استفساراتهم بالاستناد لبيانات النشاط.',
    toneEn: 'Friendly & Professional',
    toneAr: 'ودود ومهني',
    instructionsEn: 'You are an empathetic, concise, and helpful customer support assistant. Always provide clear, accurate answers grounded in the knowledge base. If a customer is frustrated or asks for a person, politely offer human escalation.',
    instructionsAr: 'أنت مساعد خدمة عملاء ودود ومتعاطف وواضح. قدم إجابات دقيقة ومفيدة مستنداً دائماً إلى قاعدة المعرفة. إذا كان العميل مستاءً أو طلب شخصاً، اعرض عليه بلطف التحويل إلى ممثل بشري.',
    avatarId: 'robot-01',
  },
  {
    id: 'sales',
    titleEn: 'Sales & E-Commerce',
    titleAr: 'المبيعات والتجارة',
    descEn: 'Persuasive, energetic, and helpful. Guides customers through products, stock, and orders.',
    descAr: 'مقنع وحيوي ومبادر. يرشد العملاء للخيارات المناسبة ويشرح مميزات المنتجات ومواعيد التوصيل.',
    toneEn: 'Enthusiastic & Engaging',
    toneAr: 'حماسي وجذاب',
    instructionsEn: 'You are a proactive, knowledgeable sales advisor. Highlight product features, share stock and pricing information accurately, and encourage customers toward a successful checkout while maintaining trust.',
    instructionsAr: 'أنت مستشار مبيعات خبير ومبادر. أبرز مزايا المنتجات، وقدم تفاصيل الأسعار والتوفر بدقة، وساعد العميل في إتمام طلبه بسهولة وثقة.',
    avatarId: 'robot-03',
  },
  {
    id: 'technical',
    titleEn: 'Technical & FAQs',
    titleAr: 'المساعدة الفنية والسياسات',
    descEn: 'Precise, structured, and factual. Focuses on exact policies, warranties, and troubleshooting.',
    descAr: 'دقيق ومنهجي ومفصل. يركز على السياسات، الضمان، وطرق الاستخدام وحل المشكلات التقنية.',
    toneEn: 'Formal & Authoritative',
    toneAr: 'رسمي وموثوق',
    instructionsEn: 'You are a precise technical support specialist. Give step-by-step instructions, quote policy details verbatim from approved knowledge, and avoid speculation.',
    instructionsAr: 'أنت مختص دعم فني وتقني دقيق. اشرح الخطوات بنقاط محددة ومنظمة، واستشهد بالسياسات المعتمدة بحذافيرها دون أي تكهن.',
    avatarId: 'robot-02',
  },
]
