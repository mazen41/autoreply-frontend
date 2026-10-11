export interface BotWizardChannel {
  id: number
  type?: string | null
}

const COMMERCE_CHANNEL_TYPES = new Set(['salla', 'shopify', 'woocommerce'])

export function isCommunicationChannel(channel: BotWizardChannel): boolean {
  return !COMMERCE_CHANNEL_TYPES.has((channel.type || '').toLowerCase())
}

export function getCommunicationChannels<T extends BotWizardChannel>(channels: T[]): T[] {
  return channels.filter(isCommunicationChannel)
}
