export type InPageDialogOptions = {
  mode: 'confirm' | 'prompt'
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  initialValue?: string
  multiline?: boolean
  destructive?: boolean
}

type DialogRequest = InPageDialogOptions & { resolve: (value: boolean | string | null) => void }

const dialogEvent = 'naz:in-page-dialog'

function requestDialog(options: InPageDialogOptions): Promise<boolean | string | null> {
  if (typeof window === 'undefined') return Promise.resolve(null)
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent<DialogRequest>(dialogEvent, { detail: { ...options, resolve } }))
  })
}

export async function confirmInPage(options: Omit<InPageDialogOptions, 'mode'>): Promise<boolean> {
  return (await requestDialog({ ...options, mode: 'confirm' })) === true
}

export async function promptInPage(options: Omit<InPageDialogOptions, 'mode'>): Promise<string | null> {
  const result = await requestDialog({ ...options, mode: 'prompt' })
  return typeof result === 'string' ? result : null
}

export function subscribeToDialogs(listener: (request: DialogRequest) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<DialogRequest>).detail)
  window.addEventListener(dialogEvent, handler)
  return () => window.removeEventListener(dialogEvent, handler)
}
