'use client'

import { useRouter } from 'next/navigation'
import WorkflowBuilder from '../../../../components/automations/WorkflowBuilder'

export default function WorkflowBuilderPage() {
  const router = useRouter()
  const returnToWorkflows = () => router.push('/dashboard/workflows')

  return (
    <div className="min-h-[calc(100vh-5rem)]">
      <WorkflowBuilder
        workflow={null}
        onSave={returnToWorkflows}
        onCancel={returnToWorkflows}
      />
    </div>
  )
}
