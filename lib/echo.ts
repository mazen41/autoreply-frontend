'use client'

import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

// Keep a single Echo connection alive for the whole app session instead of
// reconnecting every time a component mounts.
let echoInstance: Echo<any> | null = null

function getToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

export function getEcho(): Echo<any> {
  if (echoInstance) return echoInstance

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  // laravel-echo's pusher broadcaster expects Pusher to be globally available
  ;(window as any).Pusher = Pusher

  echoInstance = new Echo({
    broadcaster: 'pusher',
    key: process.env.NEXT_PUBLIC_PUSHER_KEY,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    forceTLS: true,
    // Private channels need to be authorized against our Laravel backend.
    // withBroadcasting() registers this route with the auth:sanctum middleware,
    // so we just need to send the Bearer token along with the auth request.
    authEndpoint: `${apiUrl}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        Accept: 'application/json',
      },
    },
  })

  return echoInstance
}

export function disconnectEcho() {
  if (echoInstance) {
    echoInstance.disconnect()
    echoInstance = null
  }
}
