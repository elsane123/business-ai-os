import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Graceful fallback if Stripe not configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn('[stripe/portal] Stripe not configured — returning mock URL')
      return NextResponse.json({ url: '/focus' })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { stripeCustomerId: true },
    })

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Aucun abonnement Stripe trouvé. Veuillez d\'abord souscrire.' },
        { status: 400 }
      )
    }

    const { createPortalSession } = await import('@/lib/stripe')
    const portalSession = await createPortalSession(user.stripeCustomerId)

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('[stripe/portal POST]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
