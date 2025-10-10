import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
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
    
    const response = await fetch(`http://127.0.0.1:8000/inventory/suggestions/stream?session_id=${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/plain',
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      return NextResponse.json(
        { error: 'Failed to get streaming inventory suggestions' },
        { status: response.status }
      )
    }

    // Return the streaming response
    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
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
