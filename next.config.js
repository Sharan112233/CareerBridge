/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Use SWC's minifier — ~15% smaller bundles than Terser for our code.
  swcMinify: true,

  // Strip console.log in production builds. Keeps console.error/warn.
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'logo.clearbit.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Turn off the "X-Powered-By: Next.js" header — tiny byte saving + a bit of
  // defense-in-depth (don't advertise the stack).
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // Longer cache for fonts — they're immutable once hashed.
        source: '/_next/static/media/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/ads.txt',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600' }],
      },
    ];
  },

  async redirects() {
    return [];
  },
};

module.exports = nextConfig;