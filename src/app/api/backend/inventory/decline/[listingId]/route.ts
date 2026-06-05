import { NextRequest, NextResponse } from 'next/server'
import { buildBackendUrl } from '@/lib/api-config'
import { withSecurity, type RouteContext } from '@/lib/api-security'

async function handleDeclineListing(request: NextRequest, context: RouteContext) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    const { listingId } = await context.params
    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID required' }, { status: 400 })
    }
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }
    
    const response = await fetch(buildBackendUrl(`inventory/decline/${listingId}?session_id=${sessionId}`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error:', errorText)
      return NextResponse.json({ error: 'Failed to decline price suggestion' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withSecurity(handleDeclineListing, { allowPublic: false })
