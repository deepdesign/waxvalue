import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8000'}/simulate`, {
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




