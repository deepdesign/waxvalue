import { NextRequest, NextResponse } from 'next/server'
import { buildBackendUrl } from '@/lib/api-config'
import { withSecurity } from '@/lib/api-security'

async function handleSimulate(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    const response = await fetch(`${process.env.BACKEND_URL || 'http://127.0.0.1:8000'}/simulate`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader || '',
      },
    })

    if (!response.ok) {
      throw new Error('Backend request failed')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Failed to run simulation' },
      { status: 500 }
    )
  }
}

export const POST = withSecurity(handleSimulate, { allowPublic: false })




