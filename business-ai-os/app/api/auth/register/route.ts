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
      // Extended profile fields
      legalName,
      address,
      zipCode,
      city,
      siret,
      legalForm,
      activityType,
      urssafRate,
      vatNumber,
      paymentTerms,
    } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nom, email et mot de passe requis' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Adresse email invalide' },
        { status: 400 }
      )
    }

    // Require businessName for Focus IA to work properly
    if (!businessName || String(businessName).trim().length < 2) {
      return NextResponse.json(
        { error: 'Le nom de votre entreprise est requis (min. 2 caractères)' },
        { status: 400 }
      )
    }

    // Validate password strength (min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit)
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      )
    }
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasDigit = /\d/.test(password)
    if (!hasUppercase || !hasLowercase || !hasDigit) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre' },
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
        linkedinUrl: linkedinUrl || null,
        // Extended profile fields
        legalName: legalName || null,
        address: address || null,
        zipCode: zipCode || null,
        city: city || null,
        siret: siret || null,
        legalForm: legalForm || null,
        activityType: activityType || null,
        urssafRate: urssafRate ? parseFloat(String(urssafRate)) : null,
        vatNumber: vatNumber || null,
        paymentTerms: paymentTerms ? parseInt(String(paymentTerms)) : 30,
      },
    })

    try {
      await ensureUserWikiExists(user.id, user.businessName ?? 'Mon Entreprise', user.sector ?? 'Non défini')
    } catch (_) {}

    try {
      await sendWelcomeEmail(email, name)
    } catch (_) {}

    const token = await signToken({ userId: user.id, email: user.email, plan: user.plan })

    // ── BUG-06: JWT removed from response body — only set in httpOnly cookie ──
    const response = NextResponse.json(
      {
        success: true,
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
