/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DISCOGS_API_URL: process.env.DISCOGS_API_URL || 'https://api.discogs.com',
    DATABASE_URL: process.env.DATABASE_URL,
  },
  compress: true,
  poweredByHeader: false,
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
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://localhost:8000/:path*',
      },
    ]
  },
}

module.exports = nextConfig
