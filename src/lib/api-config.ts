/**
 * API Configuration
 * 
 * Centralized configuration for API endpoints.
 * Uses environment variables for production deployment.
 */

// Get backend API URL from environment or default to remote server
export const getBackendUrl = () => {
  // In production, this should be set to your backend server URL
  // For remote deployment, use the production URL
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'https://waxvalue.com/api/backend'
}

// Build full backend API URL
export const buildBackendUrl = (path: string) => {
  const baseUrl = getBackendUrl()
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${baseUrl}/${cleanPath}`
}

