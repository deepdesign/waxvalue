/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DISCOGS_API_URL: process.env.DISCOGS_API_URL || 'https://api.discogs.com',
    DATABASE_URL: process.env.DATABASE_URL,
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
