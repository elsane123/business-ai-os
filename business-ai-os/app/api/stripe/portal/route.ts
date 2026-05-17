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
      // Fallback: redirect to checkout if no Stripe customer yet
      console.log('[stripe/portal] No stripeCustomerId — redirecting to checkout')
      const { createCheckoutSession } = await import('@/lib/stripe')
      const user2 = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { email: true },
      })
      const checkoutSession = await createCheckoutSession(session.userId, user2?.email ?? session.email)
      return NextResponse.json({ url: checkoutSession.url, redirectedToCheckout: true })
    }

    const { createPortalSession } = await import('@/lib/stripe')
    const portalSession = await createPortalSession(user.stripeCustomerId)

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('[stripe/portal POST]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
