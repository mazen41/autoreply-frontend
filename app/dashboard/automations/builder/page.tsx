'use client'

import { useRouter } from 'next/navigation'
import WorkflowBuilder from '../../../../components/automations/WorkflowBuilder'
import { useLang } from '../../../../lib/LangContext'

export default function WorkflowBuilderPage() {
  const router = useRouter()
  const { isRTL } = useLang()
  const returnToWorkflows = () => router.push('/dashboard/workflows')

  return (
    <main dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto min-h-[calc(100vh-5rem)] w-full max-w-[1520px]">
      <WorkflowBuilder
        workflow={null}
        onSave={returnToWorkflows}
        onCancel={returnToWorkflows}
      />
    </main>
  )
}
