/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DISCOGS_API_URL: process.env.DISCOGS_API_URL || 'https://api.discogs.com',
    DATABASE_URL: process.env.DATABASE_URL,
  },
  // Force IPv4 for Node.js
  serverRuntimeConfig: {
    // This will be available only on the server side
  },
  compress: true,
  poweredByHeader: false,
  // Disable Next.js dev tools indicator completely
  devIndicators: false,
  // Allow build to succeed with warnings
  eslint: {
    ignoreDuringBuilds: false, // Still run ESLint but don't fail build
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  compiler: {
    // Remove console.* calls in production bundles except important ones
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  // Ensure only the icons that are actually used are included in the client bundle
  modularizeImports: {
    '@heroicons/react/24/outline': {
      transform: '@heroicons/react/24/outline/{{member}}',
    },
    '@heroicons/react/24/solid': {
      transform: '@heroicons/react/24/solid/{{member}}',
    },
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000'
    return [
      {
        source: '/api/backend/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ]
  },
  // Moved from experimental in Next.js 15
  serverExternalPackages: [],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gravatar.com',
        port: '',
        pathname: '/avatar/**',
      },
      {
        protocol: 'https',
        hostname: 'img.discogs.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.discogs.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
