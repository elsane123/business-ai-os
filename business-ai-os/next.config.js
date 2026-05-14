/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── Compression & Performance ───
  compress: true,
  poweredByHeader: false,

  // ─── Experimental ───
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000', 'businessaios.com'] },
  },

  // ─── Variables d'environnement ───
  env: {
    PYTHON_AGENT_URL: process.env.PYTHON_AGENT_URL || 'http://localhost:8000',
    WIKI_BASE_PATH: process.env.WIKI_BASE_PATH || './wiki-data',
  },

  // ─── Headers SEO & Sécurité ───
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection',          value: '1; mode=block' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
        ],
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
      { source: '/register', destination: '/onboarding', permanent: true },
      { source: '/connexion', destination: '/login',  permanent: true },
    ]
  },

  // ─── Optimisation images ───
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'businessaios.com' },
    ],
  },
}

module.exports = nextConfig
