import { NextRequest, NextResponse } from 'next/server'
import { buildBackendUrl } from '@/lib/api-config'
import { withSecurity } from '@/lib/api-security'

async function handleStream(request: NextRequest) {
  try {
    // Get session ID from query parameters
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 401 }
      )
    }
    
    const response = await fetch(buildBackendUrl(`inventory/suggestions/stream?session_id=${sessionId}`), {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      return NextResponse.json(
        { error: 'Failed to get streaming inventory suggestions' },
        { status: response.status }
      )
    }

    // Return the streaming response with correct SSE headers
    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Failed to get streaming inventory suggestions' },
      { status: 500 }
    )
  }
}

export const GET = withSecurity(handleStream, { allowPublic: false })
