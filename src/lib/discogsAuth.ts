/**
 * Shared Discogs OAuth helpers used by landing, dashboard, and settings flows.
 */

export function ensureSessionId(): string {
  if (typeof window === 'undefined') {
    throw new Error('Session ID can only be created in the browser')
  }

  let sessionId = localStorage.getItem('waxvalue_session_id')
  if (!sessionId || sessionId === 'undefined') {
    const randomBytes = new Uint8Array(32)
    crypto.getRandomValues(randomBytes)
    sessionId = btoa(String.fromCharCode(...randomBytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
    localStorage.setItem('waxvalue_session_id', sessionId)
  }

  return sessionId
}

export function storeDiscogsRequestTokens(requestToken: string, requestTokenSecret: string) {
  localStorage.setItem('discogs_request_token', requestToken)
  localStorage.setItem('discogs_request_token_secret', requestTokenSecret)
  sessionStorage.setItem('discogs_request_token', requestToken)
  sessionStorage.setItem('discogs_request_token_secret', requestTokenSecret)
}

export async function startDiscogsOAuth(): Promise<void> {
  const sessionId = ensureSessionId()
  const setupUrl = `/api/backend/auth/setup?session_id=${encodeURIComponent(sessionId)}`

  const response = await fetch(setupUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })

  let result: {
    authUrl?: string
    requestToken?: string
    requestTokenSecret?: string
    detail?: string
    error?: string
    message?: string
  }

  try {
    result = await response.json()
  } catch {
    throw new Error('Invalid response from server. Please try again.')
  }

  if (!response.ok) {
    throw new Error(
      result.detail || result.error || result.message || `HTTP error: ${response.status}`
    )
  }

  if (!result.authUrl || !result.requestToken || !result.requestTokenSecret) {
    throw new Error('Invalid response from server. Missing required data.')
  }

  storeDiscogsRequestTokens(result.requestToken, result.requestTokenSecret)
  window.location.href = result.authUrl
}
