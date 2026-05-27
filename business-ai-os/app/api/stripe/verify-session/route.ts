import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/db'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { sessionId } = await request.json()
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId requis' }, { status: 400 })
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Paiement non confirmé' }, { status: 402 })
    }

    // Verify the session belongs to this user
    const userId = checkoutSession.metadata?.userId
    if (userId !== session.userId) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 403 })
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: { plan: 'PRO' },
    })

    console.log(`[stripe/verify-session] User ${session.userId} upgraded to PRO`)
    return NextResponse.json({ success: true, plan: 'PRO' })
  } catch (error) {
    console.error('[stripe/verify-session POST]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
