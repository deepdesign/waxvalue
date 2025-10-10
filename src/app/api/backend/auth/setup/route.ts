import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('Frontend API: Proxying to backend /auth/setup')
    
    // Proxy to backend
    const response = await fetch('http://127.0.0.1:8000/auth/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('Backend response status:', response.status)

    const data = await response.json()
    console.log('Backend response data:', data)

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




