export type StepType = 'message' | 'delay' | 'condition' | 'action'
export type ChannelType = 'whatsapp' | 'telegram' | 'email' | 'instagram' | 'facebook'
export type DelayUnit = 'minutes' | 'hours' | 'days'
export type TriggerType = 'manual' | 'new_user' | 'tag_added' | 'no_reply' | 'order_created'

export interface SequenceStepUI {
  id: string
  step_type: StepType
  step_order: number
  message?: string
  config?: Record<string, any>
  delay_hours?: number
  delay_unit?: DelayUnit
  condition_config?: Record<string, any>
  is_active: boolean
}

export const NUMBER_INPUT_CLASS =
  'h-9 w-20 text-center rounded-lg border border-border bg-surface-elevated text-sm text-text-primary focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30'

export const CHANNELS: { id: ChannelType; label: string; dot: string }[] = [
  { id: 'whatsapp', label: 'WhatsApp', dot: 'bg-green-500' },
  { id: 'telegram', label: 'Telegram', dot: 'bg-sky-500' },
  { id: 'email', label: 'Email', dot: 'bg-orange-500' },
  { id: 'instagram', label: 'Instagram', dot: 'bg-pink-500' },
  { id: 'facebook', label: 'Facebook', dot: 'bg-blue-600' },
]

export const TRIGGERS: { id: TriggerType; label: string; desc: string; icon: string }[] = [
  { id: 'manual', label: 'Manual enrollment', desc: 'You enroll contacts yourself', icon: '✋' },
  { id: 'new_user', label: 'New customer', desc: 'When a new conversation starts', icon: '👤' },
  { id: 'tag_added', label: 'Contact tagged', desc: 'When a specific tag is added', icon: '🏷️' },
  { id: 'no_reply', label: 'No reply', desc: "When a customer hasn't replied for a while", icon: '⏳' },
  { id: 'order_created', label: 'Order placed', desc: 'When a new order is created', icon: '🛒' },
]

export const VARIABLES = [
  { tag: '{{customer_name}}', label: 'Name' },
  { tag: '{{business_name}}', label: 'Business' },
  { tag: '{{product_name}}', label: 'Product' },
  { tag: '{{order_number}}', label: 'Order #' },
  { tag: '{{order_total}}', label: 'Total' },
  { tag: '{{tracking_url}}', label: 'Tracking' },
]

export const SAMPLE_VALUES: Record<string, string> = {
  customer_name: 'Sara',
  business_name: 'Your Store',
  product_name: 'Classic Tee',
  order_number: '#1042',
  order_total: '$49.00',
  tracking_url: 'track.example.com/1042',
}

// ─── Conditions ───────────────────────────────────────────────────────────────

export interface ConditionOption {
  value: string
  label: string
  group: string
  common?: boolean
  needsValue?: boolean
  needsField?: boolean
}

export const CONDITION_OPTIONS: ConditionOption[] = [
  { value: 'customer_replied', label: 'Customer replied', group: 'Conversation', common: true },
  { value: 'customer_tag', label: 'Customer has a tag', group: 'Customer', common: true, needsValue: true },
  { value: 'has_order', label: 'Customer has an order', group: 'Orders', common: true },
  { value: 'order_status', label: 'Order status', group: 'Orders', common: true, needsValue: true },
  { value: 'channel', label: 'Channel is', group: 'Channel', common: true, needsValue: true },
  { value: 'within_business_hours', label: 'Within business hours', group: 'Schedule', common: true },
  { value: 'conversation_status', label: 'Conversation status', group: 'Conversation', needsValue: true },
  { value: 'last_message_from_customer', label: 'Last message from customer', group: 'Conversation' },
  { value: 'last_message_from_ai', label: 'Last message from AI', group: 'Conversation' },
  { value: 'is_escalated', label: 'Is escalated', group: 'Conversation' },
  { value: 'is_not_escalated', label: 'Is not escalated', group: 'Conversation' },
  { value: 'customer_field', label: 'Customer field', group: 'Customer', needsValue: true, needsField: true },
  { value: 'customer_exists', label: 'Customer exists', group: 'Customer' },
  { value: 'message_text', label: 'Message text', group: 'Message content', needsValue: true },
  { value: 'message_language', label: 'Message language', group: 'Message content', needsValue: true },
  { value: 'message_intent', label: 'Message intent', group: 'Message content', needsValue: true },
  { value: 'ai_confidence', label: 'AI confidence', group: 'AI', needsValue: true },
  { value: 'ai_intent', label: 'AI intent', group: 'AI', needsValue: true },
  { value: 'needs_escalation', label: 'Needs escalation', group: 'AI' },
  { value: 'does_not_have_order', label: 'Customer has no order', group: 'Orders' },
  { value: 'order_total', label: 'Order total', group: 'Orders', needsValue: true },
  { value: 'product_exists', label: 'Product exists', group: 'Orders', needsValue: true },
  { value: 'outside_business_hours', label: 'Outside business hours', group: 'Schedule' },
  { value: 'day_of_week', label: 'Day of week', group: 'Schedule', needsValue: true },
  { value: 'time_of_day', label: 'Time of day', group: 'Schedule', needsValue: true },
]

export const conditionOption = (type?: string) => CONDITION_OPTIONS.find((o) => o.value === type)

export const CONDITION_VALUE_HINTS: Record<string, string> = {
  customer_tag: 'e.g. VIP',
  conversation_status: 'e.g. open',
  customer_field: 'Value to match',
  message_text: 'e.g. refund',
  message_language: 'e.g. ar',
  message_intent: 'e.g. pricing',
  ai_confidence: '0 – 100',
  ai_intent: 'e.g. support',
  order_status: 'e.g. shipped',
  order_total: 'e.g. 100',
  product_exists: 'Product name or SKU',
  time_of_day: 'e.g. 17:00',
}

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// ─── Step helpers ─────────────────────────────────────────────────────────────

let uidCounter = 0
export const newId = () =>
  `s_${Date.now().toString(36)}_${(uidCounter++).toString(36)}_${Math.random().toString(36).slice(2, 6)}`

export function buildStep(type: StepType, overrides: Partial<SequenceStepUI> = {}): SequenceStepUI {
  const base: SequenceStepUI = { id: newId(), step_type: type, step_order: 0, is_active: true }
  if (type === 'message') base.message = ''
  if (type === 'delay') {
    base.delay_hours = 1
    base.delay_unit = 'days'
  }
  if (type === 'condition') {
    base.condition_config = { type: 'customer_replied', on_true: 'stop', on_false: 'continue' }
  }
  if (type === 'action') base.config = { action_type: 'stop_sequence' }
  return { ...base, ...overrides }
}

export const withOrder = (steps: SequenceStepUI[]) => steps.map((s, i) => ({ ...s, step_order: i + 1 }))

/**
 * Renumbers steps after an insert / delete / move and keeps condition jump
 * targets pointing at the same step (or falls back to "continue" if it's gone).
 */
export function renumberSteps(prev: SequenceStepUI[], next: SequenceStepUI[]): SequenceStepUI[] {
  const oldOrderToId = new Map(prev.map((s) => [Number(s.step_order), s.id]))
  const newOrderById = new Map(next.map((s, i) => [s.id, i + 1]))

  return next.map((s, i) => {
    let condition_config = s.condition_config
    if (s.step_type === 'condition' && condition_config) {
      const c: Record<string, any> = { ...condition_config }
      const routes: Array<['on_true' | 'on_false', 'true_step_order' | 'false_step_order']> = [
        ['on_true', 'true_step_order'],
        ['on_false', 'false_step_order'],
      ]
      for (const [route, key] of routes) {
        if (c[route] === 'jump') {
          const id = oldOrderToId.get(Number(c[key]))
          const mapped = id ? newOrderById.get(id) : undefined
          if (mapped) c[key] = mapped
          else {
            c[route] = 'continue'
            delete c[key]
          }
        }
      }
      condition_config = c
    }
    return { ...s, step_order: i + 1, condition_config }
  })
}

export function describeDelay(step: SequenceStepUI): string {
  const n = Number(step.delay_hours) || 0
  const unit = step.delay_unit || 'hours'
  const label = n === 1 ? unit.replace(/s$/, '') : unit
  return `${n} ${label}`
}

function describeRoute(c: Record<string, any>, route: 'on_true' | 'on_false'): string {
  const value = c[route] || (route === 'on_true' ? 'continue' : 'stop')
  if (value === 'stop') return 'stop'
  if (value === 'jump') return `go to step ${c[route === 'on_true' ? 'true_step_order' : 'false_step_order'] ?? '?'}`
  return 'continue'
}

export function summarizeStep(step: SequenceStepUI): string {
  switch (step.step_type) {
    case 'message':
      return step.message?.trim() ? step.message.trim().replace(/\s+/g, ' ') : 'Empty message — click to write it'
    case 'delay':
      return `Wait ${describeDelay(step)}`
    case 'condition': {
      const c = step.condition_config || {}
      const label = conditionOption(c.type)?.label || 'Condition'
      return `If ${label.toLowerCase()} → ${describeRoute(c, 'on_true')}, otherwise ${describeRoute(c, 'on_false')}`
    }
    case 'action': {
      const a = step.config?.action_type
      if (a === 'add_tag') return `Add tag "${step.config?.tag || '…'}"`
      if (a === 'remove_tag') return `Remove tag "${step.config?.tag || '…'}"`
      return 'Stop the sequence'
    }
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ValidationResult {
  name?: string
  trigger?: string
  steps: Record<string, string>
  stepsGeneral?: string
  count: number
  messages: string[]
  firstTarget?: string
}

export function validateSequence(input: {
  name: string
  triggerType: TriggerType
  triggerTag: string
  noReplyValue: number
  steps: SequenceStepUI[]
}): ValidationResult {
  const r: ValidationResult = { steps: {}, count: 0, messages: [] }
  const push = (msg: string, target?: string) => {
    r.count++
    r.messages.push(msg)
    if (!r.firstTarget && target) r.firstTarget = target
  }

  if (!input.name.trim()) {
    r.name = 'Give your sequence a name'
    push(r.name, 'field-name')
  }
  if (input.triggerType === 'tag_added' && !input.triggerTag.trim()) {
    r.trigger = 'Enter the tag that starts this sequence'
    push(r.trigger, 'field-trigger')
  }
  if (input.triggerType === 'no_reply' && !(input.noReplyValue >= 1)) {
    r.trigger = 'Enter how long to wait for a reply'
    push(r.trigger, 'field-trigger')
  }
  if (input.steps.length === 0) {
    r.stepsGeneral = 'Add at least one step'
    push(r.stepsGeneral, 'field-steps')
  }

  input.steps.forEach((s, i) => {
    let err = ''
    if (s.step_type === 'message' && !s.message?.trim()) err = 'Write the message to send'
    if (s.step_type === 'delay' && !(Number(s.delay_hours) >= 1)) err = 'Enter a wait time of at least 1'
    if (s.step_type === 'condition') {
      const c = s.condition_config || {}
      const opt = conditionOption(c.type)
      if (opt?.needsValue && !String(c.value ?? '').trim()) err = 'Enter a value to check'
      else if (opt?.needsField && !String(c.field ?? '').trim()) err = 'Enter the field name to check'
      else if (c.on_true === 'jump' && !c.true_step_order) err = 'Pick a step to jump to'
      else if (c.on_false === 'jump' && !c.false_step_order) err = 'Pick a step to jump to'
    }
    if (s.step_type === 'action') {
      const a = s.config?.action_type
      if ((a === 'add_tag' || a === 'remove_tag') && !String(s.config?.tag ?? '').trim()) err = 'Enter the tag name'
    }
    if (err) {
      r.steps[s.id] = err
      push(`Step ${i + 1}: ${err}`, `step-${s.id}`)
    }
  })

  return r
}

// ─── Templates ────────────────────────────────────────────────────────────────

export interface SequenceTemplate {
  id: string
  emoji: string
  name: string
  description: string
  trigger: TriggerType
  noReply?: { value: number; unit: DelayUnit }
  stopOnReply?: boolean
  build: () => SequenceStepUI[]
}

const msg = (message: string) => buildStep('message', { message })
const wait = (n: number, unit: DelayUnit) => buildStep('delay', { delay_hours: n, delay_unit: unit })

export const TEMPLATES: SequenceTemplate[] = [
  {
    id: 'welcome',
    emoji: '👋',
    name: 'Welcome new customers',
    description: 'Greet new contacts, then check in if they go quiet.',
    trigger: 'new_user',
    build: () => [
      msg('Hi {{customer_name}}! 👋 Welcome to {{business_name}}. How can we help you today?'),
      wait(1, 'days'),
      buildStep('condition', { condition_config: { type: 'customer_replied', on_true: 'stop', on_false: 'continue' } }),
      msg("Just checking in — did you find what you were looking for? We're happy to help."),
    ],
  },
  {
    id: 'followup',
    emoji: '⏳',
    name: 'Follow up when no reply',
    description: "Nudge customers who haven't answered.",
    trigger: 'no_reply',
    noReply: { value: 24, unit: 'hours' },
    stopOnReply: true,
    build: () => [
      msg('Hi {{customer_name}}, just following up on our last message. Is there anything else we can help with?'),
      wait(2, 'days'),
      msg("We don't want you to miss out — reply anytime and we'll take care of you."),
    ],
  },
  {
    id: 'post_purchase',
    emoji: '🛒',
    name: 'Post-purchase thank you',
    description: 'Thank customers for their order and ask for feedback.',
    trigger: 'order_created',
    build: () => [
      msg("Thank you for your order {{order_number}}, {{customer_name}}! 🎉 We'll keep you updated."),
      wait(3, 'days'),
      msg("How's everything with your order? We'd love to hear your feedback."),
    ],
  },
]
