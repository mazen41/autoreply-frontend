'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import { subscribeToDialogs, type InPageDialogOptions } from '../../lib/dialogService'

type Request = InPageDialogOptions & { resolve: (value: boolean | string | null) => void }

export default function InPageDialogProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<Request | null>(null)
  const [value, setValue] = useState('')
  const pendingRequest = useRef<Request | null>(null)

  useEffect(() => subscribeToDialogs((next) => {
    pendingRequest.current?.resolve(null)
    pendingRequest.current = next
    setRequest(next)
    setValue(next.initialValue || '')
  }), [])

  const close = (result: boolean | string | null) => {
    pendingRequest.current?.resolve(result)
    pendingRequest.current = null
    setRequest(null)
  }

  return <>
    {children}
    <Modal
      isOpen={request !== null}
      onClose={() => close(null)}
      title={request?.title}
      description={request?.message}
      size="sm"
      footer={request && <>
        <Button variant="outline" onClick={() => close(request.mode === 'confirm' ? false : null)}>{request.cancelLabel || 'Cancel'}</Button>
        <Button variant={request.destructive ? 'destructive' : 'primary'} onClick={() => close(request.mode === 'confirm' ? true : value)}>
          {request.confirmLabel || (request.mode === 'confirm' ? 'Confirm' : 'Save')}
        </Button>
      </>}
    >
      {request?.mode === 'prompt' && (request.multiline
        ? <textarea autoFocus rows={4} value={value} onChange={(event) => setValue(event.target.value)} className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-brand" />
        : <input autoFocus value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') close(value) }} className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-brand" />)}
    </Modal>
  </>
}
