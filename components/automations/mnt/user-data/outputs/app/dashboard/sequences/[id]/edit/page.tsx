'use client'

import { useParams } from 'next/navigation'
import SequenceEditor from '../../../../../components/sequences/SequenceEditor'

export default function EditSequencePage() {
  const params = useParams<{ id: string }>()
  const id = Number(params?.id)

  if (!params?.id || Number.isNaN(id)) {
    return <div className="p-8 text-center text-sm text-text-secondary">Invalid sequence link.</div>
  }

  return <SequenceEditor sequenceId={id} />
}
