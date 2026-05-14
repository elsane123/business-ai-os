import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY ?? ''
    const priceId = process.env.STRIPE_PRICE_ID_SOLO_PRO ?? ''
    const testMode = process.env.STRIPE_TEST_MODE === 'true'

    // ─── Mode Test : upgrade direct sans Stripe ───────────────────────────────
    if (testMode || !stripeKey.startsWith('sk_')) {
      console.log(`[stripe/checkout] TEST MODE — upgrading user ${session.userId} to PRO directly`)

      await prisma.user.update({
        where: { id: session.userId },
        data: { plan: 'PRO' },
      })

      return NextResponse.json({ url: '/focus?upgrade=success&mock=true' })
    }

    // ─── Stripe Live : vérifier configuration complète ───────────────────────
    const isConfigured =
      stripeKey.length > 10 &&
      priceId.startsWith('price_') &&
      !priceId.includes('roadmap') &&
      !priceId.includes('xxx')

    if (!isConfigured) {
      console.warn('[stripe/checkout] Stripe not fully configured — test upgrade fallback')
      await prisma.user.update({
        where: { id: session.userId },
        data: { plan: 'PRO' },
      })
      return NextResponse.json({ url: '/focus?upgrade=success&mock=true' })
    }

    // ─── Stripe Live : créer une vraie session checkout ───────────────────────
    const { createCheckoutSession } = await import('@/lib/stripe')
    const checkoutSession = await createCheckoutSession(session.userId, session.email)

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('[stripe/checkout POST]', error)
    return NextResponse.json({ error: 'Erreur lors de la création de la session' }, { status: 500 })
  }
}
