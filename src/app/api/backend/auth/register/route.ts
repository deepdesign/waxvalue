import { NextRequest, NextResponse } from 'next/server'
import { buildBackendUrl } from '@/lib/api-config'
import { withSecurity } from '@/lib/api-security'

async function handleRegister(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, password } = body

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      )
    }

    // Basic validation
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Check if email is already taken (in production, this would check a database)
    if (email === 'demo@waxvalue.com') {
      return NextResponse.json(
        { message: 'Email address is already registered' },
        { status: 409 }
      )
    }

    // Mock user creation - in production, this would save to a database
    const user = {
      id: Date.now().toString(),
      email: email,
      firstName: firstName,
      lastName: lastName,
      username: email.split('@')[0],
      discogsUserId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const token = 'mock-jwt-token-' + Date.now()

    return NextResponse.json({
      user,
      token,
      message: 'Registration successful',
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = withSecurity(handleRegister, { allowPublic: true })




