/**
 * API Security Middleware
 * Protects against CVE-2025-55182 (React2Shell) and other vulnerabilities
 */

import { NextRequest, NextResponse } from 'next/server'

// Rate limiting store (in-memory, consider Redis for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10 // Max requests per window

/**
 * Rate limiting middleware
 */
export function rateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  record.count++
  return true
}

/**
 * Get client IP address
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

/**
 * Validate request body to prevent code injection
 */
export function validateRequestBody(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: true } // Empty body is fine
  }

  const bodyString = JSON.stringify(body)
  
  // Block common injection patterns
  const dangerousPatterns = [
    /eval\s*\(/i,
    /Function\s*\(/i,
    /setTimeout\s*\(/i,
    /setInterval\s*\(/i,
    /require\s*\(/i,
    /import\s*\(/i,
    /process\./i,
    /child_process/i,
    /exec\s*\(/i,
    /spawn\s*\(/i,
    /\.\.\/\.\.\//, // Path traversal
    /<script/i,
    /javascript:/i,
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(bodyString)) {
      return { valid: false, error: 'Invalid request body detected' }
    }
  }

  return { valid: true }
}

/**
 * Security middleware wrapper
 */
export function withSecurity(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean
    allowPublic?: boolean
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Rate limiting
    const ip = getClientIP(request)
    if (!rateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Validate request body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const body = await request.json().catch(() => null)
        if (body) {
          const validation = validateRequestBody(body)
          if (!validation.valid) {
            return NextResponse.json(
              { error: validation.error || 'Invalid request' },
              { status: 400 }
            )
          }
        }
      } catch (e) {
        // If body parsing fails, that's okay - let the handler deal with it
      }
    }

    // Check authentication if required
    if (options.requireAuth && !options.allowPublic) {
      const authHeader = request.headers.get('authorization')
      if (!authHeader) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
    }

    return handler(request)
  }
}

