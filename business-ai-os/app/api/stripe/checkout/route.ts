import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY ?? ''
    const priceId = process.env.STRIPE_PRICE_ID_SOLO_PRO ?? ''

    if (!stripeKey.startsWith('sk_') || !priceId.startsWith('price_')) {
      console.error('[stripe/checkout] Stripe non configuré — STRIPE_SECRET_KEY ou STRIPE_PRICE_ID_SOLO_PRO manquant')
      return NextResponse.json({ error: 'Paiement non disponible — configuration Stripe manquante' }, { status: 503 })
    }

    const { createCheckoutSession } = await import('@/lib/stripe')
    const baseUrl = request.headers.get('origin') || `http://${request.headers.get('host') || 'localhost:50082'}`
    const checkoutSession = await createCheckoutSession(session.userId, session.email, baseUrl)

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('[stripe/checkout POST]', error)
    return NextResponse.json({ error: 'Erreur lors de la création de la session' }, { status: 500 })
  }
}
