import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createResetToken } from '@/lib/reset-tokens'
import { resend } from '@/lib/resend'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:50082'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const email = (body?.email || '').toString().trim().toLowerCase()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }

    // Always return 200 even if email not found (prevent user enumeration)
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ success: true, message: 'Si ce compte existe, un email a été envoyé.' })
    }

    const token = await createResetToken(email)
    const resetUrl = `${APP_URL}/reset-password?token=${token}`

    await resend.emails.send({
      from: process.env.RESEND_FROM || 'noreply@brainlo.ai',
      to: email,
      subject: '🔐 Réinitialisation de votre mot de passe Brainlo',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #6366f1;">Réinitialiser votre mot de passe</h2>
          <p>Bonjour <strong>${user.name || email}</strong>,</p>
          <p>Vous avez demandé à réinitialiser votre mot de passe Brainlo.</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}"
               style="background: #6366f1; color: white; padding: 12px 24px;
                      border-radius: 8px; text-decoration: none; font-weight: bold;">
              Réinitialiser mon mot de passe
            </a>
          </p>
          <p style="color: #888; font-size: 13px;">Ce lien expire dans 1 heure.</p>
          <p style="color: #888; font-size: 13px;">
            Si vous n'avez pas fait cette demande, ignorez cet email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;"/>
          <p style="color: #ccc; font-size: 11px;">Brainlo — L'OS IA pour solopreneurs</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, message: 'Si ce compte existe, un email a été envoyé.' })
  } catch (error) {
    console.error('[forgot-password]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
