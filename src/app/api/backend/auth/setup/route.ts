import { NextRequest, NextResponse } from 'next/server'
import { buildBackendUrl } from '@/lib/api-config'
import { withSecurity } from '@/lib/api-security'

async function handleSetup(request: NextRequest) {
  try {
    console.log('Frontend API: Proxying to backend /auth/setup')
    const backendUrl = buildBackendUrl('auth/setup')
    console.log('Backend URL:', backendUrl)
    
    // Proxy to backend
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('Backend response status:', response.status)

    // Try to parse JSON, but handle non-JSON responses
    let data
    try {
      data = await response.json()
      console.log('Backend response data:', data)
    } catch (jsonError) {
      console.error('Failed to parse JSON response:', jsonError)
      const text = await response.text().catch(() => 'Unknown error')
      return NextResponse.json(
        { 
          detail: `Backend returned invalid response: ${text}`,
          error: 'Invalid response from backend'
        },
        { status: response.status || 500 }
      )
    }

    if (!response.ok) {
      console.error('Backend error:', data)
      return NextResponse.json(
        { 
          detail: data.detail || data.error || data.message || 'Backend request failed',
          ...data
        },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API route error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED')
    
    return NextResponse.json(
      { 
        detail: isNetworkError 
          ? 'Cannot reach backend server. Please ensure the backend is running and accessible.'
          : `Failed to setup authentication: ${errorMessage}`,
        error: 'Failed to setup authentication',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

// Export with security middleware (rate limiting + input validation)
export const POST = withSecurity(handleSetup, { allowPublic: true })




