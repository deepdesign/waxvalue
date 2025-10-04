import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Mock authentication - in production, this would validate against a database
    if (email === 'demo@waxvalue.com' && password === 'demo123') {
      const user = {
        id: '1',
        email: 'demo@waxvalue.com',
        firstName: 'Demo',
        lastName: 'User',
        username: 'demouser',
        discogsUserId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const token = 'mock-jwt-token-' + Date.now()

      return NextResponse.json({
        user,
        token,
        message: 'Login successful',
      })
    }

    // For development, accept any email/password combination
    const user = {
      id: Date.now().toString(),
      email: email,
      firstName: email.split('@')[0],
      lastName: 'User',
      username: email.split('@')[0],
      discogsUserId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const token = 'mock-jwt-token-' + Date.now()

    return NextResponse.json({
      user,
      token,
      message: 'Login successful',
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}




