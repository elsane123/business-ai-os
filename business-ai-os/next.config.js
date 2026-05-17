/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── Compression & Performance ───
  compress: true,
  poweredByHeader: false,

  // ─── Experimental ───
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000', 'brainlo.ai'] },
  },

  // ─── Variables d'environnement ───
  env: {
    PYTHON_AGENT_URL: process.env.PYTHON_AGENT_URL || 'http://localhost:8000',
    WIKI_BASE_PATH: process.env.WIKI_BASE_PATH || './wiki-data',
  },

  // ─── Headers SEO & Sécurité ───
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production'
    const securityHeaders = [
      { key: 'X-Content-Type-Options',    value: 'nosniff' },
      { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
      { key: 'X-XSS-Protection',          value: '1; mode=block' },
      { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          // BUG-CSP-01 fix: removed 'unsafe-eval' (was only needed for old bundlers, Next.js 14 doesn't require it)
          "script-src 'self' 'unsafe-inline' https://js.stripe.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: blob: https:",
          "connect-src 'self' https://api.stripe.com https://openrouter.ai",
          "frame-src https://js.stripe.com https://hooks.stripe.com",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; '),
      },
      // HSTS: only activate once HTTPS is confirmed working
      ...(isProduction && process.env.HTTPS_ENABLED === 'true' ? [{
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      }] : []),
    ]
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // Cache agressif pour assets statiques
        source: '/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Cache images optimisées
        source: '/_next/image(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
    ]
  },

  // ─── Redirections canoniques ───
  async redirects() {
    return [
      { source: '/home',    destination: '/',         permanent: true },
      { source: '/tarifs',  destination: '/pricing',  permanent: true },
      { source: '/prix',    destination: '/pricing',  permanent: true },
      { source: '/signup',  destination: '/onboarding', permanent: true },
      { source: '/register', destination: '/onboarding', permanent: false },
      { source: '/connexion', destination: '/login',  permanent: true },
    ]
  },

  // ─── Optimisation images ───
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'brainlo.ai' },
    ],
  },
}

module.exports = nextConfig
