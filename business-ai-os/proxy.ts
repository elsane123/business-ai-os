import { NextRequest, NextResponse } from 'next/server'
import { verifyTokenEdge } from '@/lib/auth-edge'

// ─── Public pages (no auth required) ────────────────────────────────────────
const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/onboarding',
  '/forgot-password',
  '/reset-password',
  '/assessment',
  '/fonctionnalites',
  '/robots.txt',
  '/sitemap.xml',
  '/opengraph-image',
  '/site.webmanifest',
])

// Path prefixes that are always public
const PUBLIC_PREFIXES = [
  '/blog',               // /blog and /blog/[slug]
  '/api/auth/',          // login, register, logout, forgot-password, reset-password
  '/api/stripe/webhook', // Stripe signed webhooks — no user auth
  '/api/calcom/webhook', // Cal.com signed webhooks — no user auth
  '/api/assessment',     // Public lead gen endpoint
  '/_next/',             // Next.js internals
]

// Static file extensions — never intercepted
const STATIC_EXT = /\.(?:ico|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|otf|map|txt|json|xml)$/

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 1. Skip static file extensions
  if (STATIC_EXT.test(pathname)) return NextResponse.next()

  // 2. Skip public paths and prefixes
  if (
    PUBLIC_PATHS.has(pathname) ||
    PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))
  ) {
    return NextResponse.next()
  }

  // 3. Verify JWT from auth_token cookie
  const token = req.cookies.get('auth_token')?.value
  const session = token ? await verifyTokenEdge(token) : null

  if (!session) {
    // API routes → 401 JSON (no HTML redirect)
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Page routes → redirect to /login preserving the intended URL
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('returnTo', pathname + (req.nextUrl.search || ''))
    const res = NextResponse.redirect(loginUrl)
    // Clear invalid/expired token cookie if present
    if (token) res.cookies.delete('auth_token')
    return res
  }

  // 4. Redirect authenticated users away from /login
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/focus', req.url))
  }

  // 5. Forward with lightweight session headers for server components
  const res = NextResponse.next()
  res.headers.set('x-user-id', session.userId)
  res.headers.set('x-user-email', session.email)
  res.headers.set('x-user-plan', session.plan)
  return res
}

export const config = {
  // Run on all paths — static files and _next/ are filtered in the function
  matcher: [
    '/((?!_next/static|_next/image|_next/webpack-hmr).*)'
  ],
}
