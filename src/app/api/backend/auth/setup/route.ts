import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('=== API ROUTE START ===')
  try {
    const body = await request.json()
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000'
    
    console.log('API Route: Making request to backend:', `${backendUrl}/auth/setup`)
    console.log('API Route: Request body:', body)
    
    const response = await fetch(`${backendUrl}/auth/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    console.log('API Route: Backend response status:', response.status, response.statusText)
    console.log('API Route: Response headers:', Object.fromEntries(response.headers.entries()))

    // Get raw response text first
    const responseText = await response.text()
    console.log('API Route: Raw response text:', responseText)
    console.log('API Route: Response text length:', responseText.length)

    if (!response.ok) {
      console.log('API Route: Backend error response:', responseText)
      throw new Error(`Backend request failed: ${response.status} ${response.statusText}`)
    }

    // Try to parse JSON
    if (!responseText || responseText.trim() === '') {
      throw new Error('Backend returned empty response')
    }

    let data
    try {
      data = JSON.parse(responseText)
      console.log('API Route: Parsed JSON successfully:', data)
    } catch (jsonError) {
      console.log('API Route: JSON parse error:', jsonError)
      console.log('API Route: Response was not valid JSON:', responseText)
      throw new Error(`Backend returned invalid JSON: ${jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'}`)
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error('API route error details:', error)
    return NextResponse.json(
      { error: 'Failed to setup authentication', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}




