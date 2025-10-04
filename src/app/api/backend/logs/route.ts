import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8000'}/logs`, {
      method: 'GET',
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
      { error: 'Failed to fetch logs' },
      { status: 500 }
    )
  }
}




