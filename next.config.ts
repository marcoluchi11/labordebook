import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
]

const isDev = process.env.NODE_ENV === 'development'

const viewerCsp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://*.supabase.co",
  "worker-src blob:",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ')

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: [
    'ce89-2803-9800-98c2-87fa-7c6f-739a-b028-4a3a.ngrok-free.app',
    '192.168.100.49',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/read/:bookId*',
        headers: [
          ...securityHeaders,
          { key: 'Content-Security-Policy', value: viewerCsp },
        ],
      },
    ]
  },
  // Silence Turbopack warning — no custom config needed, pdf-lib works without fs polyfill
  turbopack: {},
}

export default nextConfig
