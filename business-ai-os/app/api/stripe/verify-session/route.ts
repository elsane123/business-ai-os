import { NextRequest, NextResponse } from 'next/server'
import { getSession, signToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { cookies } from 'next/headers'

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

    // Refresh JWT cookie so the client token is in sync with the new plan
    const newToken = await signToken({ userId: session.userId, email: session.email, plan: 'PRO' })
    const cookieStore = await cookies()
    cookieStore.set('auth_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    console.log(`[stripe/verify-session] User ${session.userId} upgraded to PRO`)
    return NextResponse.json({ success: true, plan: 'PRO' })
  } catch (error) {
    console.error('[stripe/verify-session POST]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
