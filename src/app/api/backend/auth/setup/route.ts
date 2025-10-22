import { NextRequest, NextResponse } from 'next/server'
import { buildBackendUrl } from '@/lib/api-config'

export async function POST(request: NextRequest) {
  try {
    // Frontend API: Proxying to backend /auth/setup
    
    // Proxy to backend
    const response = await fetch('http://127.0.0.1:8000/auth/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Backend response status received

    const data = await response.json()
    // Backend response data processed

    if (!response.ok) {
      console.error('Backend error:', data)
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to setup authentication',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}




