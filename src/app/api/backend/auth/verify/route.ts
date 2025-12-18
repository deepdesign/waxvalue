import { NextRequest, NextResponse } from 'next/server'
import { buildBackendUrl } from '@/lib/api-config'
import { withSecurity } from '@/lib/api-security'

async function handleVerify(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get session ID from query parameters
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 401 }
      )
    }
    
    const response = await fetch(buildBackendUrl(`auth/verify?session_id=${sessionId}`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    // Try to parse response as JSON, but handle non-JSON responses
    let data
    try {
      const text = await response.text()
      data = text ? JSON.parse(text) : {}
    } catch (parseError) {
      // If response isn't JSON, create a structured error
      data = {
        detail: `Backend returned ${response.status}: ${response.statusText}`,
        error: 'Invalid response from backend'
      }
    }

    if (!response.ok) {
      // Ensure we return a proper error structure
      return NextResponse.json(
        {
          detail: data.detail || data.error || `Verification failed with status ${response.status}`,
          ...data
        },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Failed to verify authentication' },
      { status: 500 }
    )
  }
}

export const POST = withSecurity(handleVerify, { allowPublic: true })




