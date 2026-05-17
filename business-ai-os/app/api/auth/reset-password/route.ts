import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'
import { validateResetToken, consumeResetToken } from '@/lib/reset-tokens'

// POST /api/auth/reset-password
// Body: { token: string, password: string }
// Token must have been issued by /api/auth/forgot-password
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const { token, password } = body || {}

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token et nouveau mot de passe requis' },
        { status: 400 }
      )
    }

    // Validate token strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      )
    }
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre' },
        { status: 400 }
      )
    }

    // Validate token
    const email = validateResetToken(token)
    if (!email) {
      return NextResponse.json(
        { error: 'Lien invalide ou expiré. Veuillez refaire une demande de réinitialisation.' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json(
        { error: 'Compte introuvable' },
        { status: 404 }
      )
    }

    // Hash and update password
    const hash = await bcrypt.hash(password, 10)
    await prisma.user.update({ where: { email }, data: { passwordHash: hash } })

    // Invalidate token (one-time use)
    consumeResetToken(token)

    return NextResponse.json({ success: true, message: 'Mot de passe mis à jour avec succès.' })
  } catch (error) {
    console.error('[reset-password]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
