import { NextRequest, NextResponse } from 'next/server'
import { buildBackendUrl } from '@/lib/api-config'
import { withSecurity } from '@/lib/api-security'

async function handleAdjustPrice(request: NextRequest) {
  try {
    const body = await request.json()
    const sessionId = request.headers.get('x-session-id') || 
                     request.nextUrl.searchParams.get('session_id')
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }

    const backendUrl = buildBackendUrl(`inventory/adjust-suggested-price?session_id=${sessionId}`)
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Failed to adjust suggested price' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Adjust suggested price error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = withSecurity(handleAdjustPrice, { allowPublic: false })
