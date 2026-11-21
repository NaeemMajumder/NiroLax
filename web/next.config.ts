import type { NextConfig } from 'next';

// `npm run export` builds a static preview (used for the shareable demo link) — it always runs on in-browser demo data.
const isExport = process.env.NEXT_EXPORT === '1';
// With API_URL set (e.g. http://localhost:4000) the site talks to the Express server through /api/v1/*.
// Same-origin requests keep the sign-in cookie first-party on every browser, phones included.
const apiUrl = !isExport ? process.env.API_URL?.replace(/\/+$/, '') : undefined;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_ASSET_BASE: isExport ? './' : '/',
    NEXT_PUBLIC_EXPORT: isExport ? '1' : '0',
    NEXT_PUBLIC_API_MODE: apiUrl ? 'server' : 'demo',
  },
  ...(apiUrl && {
    async rewrites() {
      return [{ source: '/api/v1/:path*', destination: `${apiUrl}/api/v1/:path*` }];
    },
  }),
  ...(!isExport && {
    async headers() {
      const dev = process.env.NODE_ENV !== 'production';
      const csp = [
        "default-src 'self'",
        `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https://res.cloudinary.com",
        "font-src 'self' data:",
        "connect-src 'self' https://api.cloudinary.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
      ].join('; ');
      return [
        {
          source: '/:path*',
          headers: [
            { key: 'Content-Security-Policy', value: csp },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
            { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          ],
        },
      ];
    },
  }),
  ...(isExport && {
    output: 'export',
    assetPrefix: './',
    images: { unoptimized: true },
  }),
};

export default nextConfig;
