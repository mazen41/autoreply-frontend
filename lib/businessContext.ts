const ACTIVE_BUSINESS_KEY = 'naz_selected_business_id'

export function getSelectedBusinessId(): number | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(ACTIVE_BUSINESS_KEY)
  const id = raw ? Number(raw) : NaN
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

export function getBusinessHeaders(): Record<string, string> {
  const id = getSelectedBusinessId()
  return id ? { 'X-Business-Id': String(id) } : {}
}
