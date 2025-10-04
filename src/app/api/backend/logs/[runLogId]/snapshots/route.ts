import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { runLogId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8000'}/logs/${params.runLogId}/snapshots`, {
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
      { error: 'Failed to fetch snapshots' },
      { status: 500 }
    )
  }
}




