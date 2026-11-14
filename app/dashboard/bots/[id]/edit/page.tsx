'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import BotWizardStudio from '../../../../../components/bots/wizard/BotWizardStudio'

export default function EditBotPage() {
  const params = useParams<{ id: string }>()
  const botId = params?.id ? Number(params.id) : undefined

  return <BotWizardStudio mode="edit" botId={botId} />
}
