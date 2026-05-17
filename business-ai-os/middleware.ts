import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-please-change-in-production'
)

const PROTECTED_PATHS = [
  '/focus', '/cash', '/pipeline', '/content', '/chat',
  '/tasks', '/settings', '/knowledge-base', '/calendar', '/profile', '/invoices', '/agents',
]
const AUTH_PATHS = ['/login', '/onboarding']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth_token')?.value

  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p))
  const isAuthPath = AUTH_PATHS.some(p => pathname.startsWith(p))

  if (isProtected) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    try {
      await jwtVerify(token, JWT_SECRET)
    } catch {
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('auth_token')
      return response
    }
  }

  // Redirect logged-in users away from auth pages
  if (isAuthPath && token) {
    try {
      await jwtVerify(token, JWT_SECRET)
      return NextResponse.redirect(new URL('/focus', request.url))
    } catch {
      // Invalid token, let them through
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/focus/:path*',
    '/cash/:path*',
    '/pipeline/:path*',
    '/content/:path*',
    '/chat/:path*',
    '/tasks/:path*',
    '/settings/:path*',
    '/knowledge-base/:path*',
    '/calendar/:path*',
    '/profile/:path*',
    '/invoices/:path*',
    '/agents/:path*',
    '/login',
    '/onboarding',
  ],
}
