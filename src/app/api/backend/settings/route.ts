import { NextRequest, NextResponse } from 'next/server'
import { buildBackendUrl } from '@/lib/api-config'
import { withSecurity } from '@/lib/api-security'

async function handleSettings(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const body = await request.json()
    
    const response = await fetch(`${process.env.BACKEND_URL || 'http://127.0.0.1:8000'}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader || '',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error('Backend request failed')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

export const PUT = withSecurity(handleSettings, { allowPublic: false })




