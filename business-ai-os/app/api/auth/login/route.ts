import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { comparePassword, signToken } from '@/lib/auth'
import { loginRateLimiter, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // ── BUG-05: Rate limiting — 5 attempts per 15 min per IP ─────────────────
    const ip = getClientIp(request)
    const rl = loginRateLimiter.check(ip)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Trop de tentatives. Réessayez dans ${Math.ceil(rl.retryAfter / 60)} minute(s).` },
        {
          status: 429,
          headers: {
            'Retry-After': String(rl.retryAfter),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    const isValid = await comparePassword(password, user.passwordHash)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    if (user.isSuspended) {
      return NextResponse.json(
        { error: 'Votre compte a été suspendu. Contactez le support.' },
        { status: 403 }
      )
    }

    const token = await signToken({ userId: user.id, email: user.email, plan: user.plan })

    // ── BUG-06: JWT removed from response body — only set in httpOnly cookie ──
    const response = NextResponse.json(
      {
        success: true,
        user: { id: user.id, name: user.name, email: user.email, plan: user.plan },
      },
      { status: 200 }
    )

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[auth/login]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
