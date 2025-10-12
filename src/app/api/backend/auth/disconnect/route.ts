import { NextRequest, NextResponse } from 'next/server'
import { buildBackendUrl } from '@/lib/api-config'

export async function POST(request: NextRequest) {
  try {
    // Get session ID from request body or query parameters
    const body = await request.json().catch(() => ({}))
    const sessionId = body.session_id || request.nextUrl.searchParams.get('session_id')
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }
    
    const response = await fetch(buildBackendUrl(`auth/disconnect?session_id=${sessionId}`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect account' },
      { status: 500 }
    )
  }
}




