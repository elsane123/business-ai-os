import { NextRequest, NextResponse } from 'next/server'
import { getResend } from '@/lib/resend'

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json()

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Nom, email et message sont requis.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 })
    }

    const subjectLabel = subject === 'support' ? 'Support client' : 'Demande commerciale'

    await getResend().emails.send({
      from: 'Brainlo Contact <noreply@brainlo.ai>',
      to: 'contact@brainlo.ai',
      reply_to: email.trim(),
      subject: `[${subjectLabel}] Message de ${name.trim()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #4f46e5; margin-bottom: 24px;">📬 Nouveau message via le formulaire de contact</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 0; font-weight: bold; color: #374151; width: 140px;">Nom</td>
              <td style="padding: 12px 0; color: #111827;">${name.trim()}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 0; font-weight: bold; color: #374151;">Email</td>
              <td style="padding: 12px 0; color: #111827;"><a href="mailto:${email.trim()}" style="color: #4f46e5;">${email.trim()}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 0; font-weight: bold; color: #374151;">Sujet</td>
              <td style="padding: 12px 0; color: #111827;">${subjectLabel}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-weight: bold; color: #374151; vertical-align: top;">Message</td>
              <td style="padding: 12px 0; color: #111827; white-space: pre-wrap;">${message.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
            </tr>
          </table>
          <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">Envoyé depuis brainlo.ai — ${new Date().toLocaleString('fr-FR')}</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[contact/route]', error)
    return NextResponse.json({ error: 'Erreur lors de l\'envoi. Veuillez réessayer.' }, { status: 500 })
  }
}
