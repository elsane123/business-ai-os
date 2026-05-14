import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth'
import { ensureUserWikiExists } from '@/lib/wiki/ingest'
import { sendWelcomeEmail } from '@/lib/resend'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      password,
      businessName,
      sector,
      monthlyGoal,
      fixedCharges,
      linkedinUrl,
    } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nom, email et mot de passe requis' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 409 }
      )
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        businessName,
        sector,
        monthlyGoal: parseFloat(monthlyGoal || '0'),
        fixedCharges: parseFloat(fixedCharges || '0'),
        linkedinUrl,
      },
    })

    try {
      await ensureUserWikiExists(user.id, user.businessName ?? 'Mon Entreprise', user.sector ?? 'Non défini')
    } catch (_) {}

    try {
      await sendWelcomeEmail(email, name)
    } catch (_) {}

    const token = await signToken({ userId: user.id, email: user.email, plan: user.plan })

    const response = NextResponse.json(
      {
        success: true,
        token,
        user: { id: user.id, name: user.name, email: user.email, plan: user.plan },
      },
      { status: 201 }
    )
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    })
    return response
  } catch (error) {
    if ((error as any)?.code === 'P2002') {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 })
    }
    console.error('[auth/register]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
