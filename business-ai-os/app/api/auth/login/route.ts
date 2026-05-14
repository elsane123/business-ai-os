import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { comparePassword, signToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
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

    const token = await signToken({ userId: user.id, email: user.email, plan: user.plan })

    const response = NextResponse.json(
      {
        success: true,
        token,
        user: { id: user.id, name: user.name, email: user.email, plan: user.plan },
      },
      { status: 200 }
    )

    // Set auth cookie directly on response
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    return response
  } catch (error) {
    console.error('[auth/login]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
