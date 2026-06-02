import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { validateStripeKey } from '@/lib/stripe-personal'

// GET — check connection status
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { stripePersonalApiKey: true },
    })

    // Return connected status without exposing the key
    const connected = !!user?.stripePersonalApiKey
    const maskedKey = user?.stripePersonalApiKey
      ? `${user.stripePersonalApiKey.slice(0, 7)}...${user.stripePersonalApiKey.slice(-4)}`
      : null

    // Count already-imported transactions
    const importedCount = connected
      ? await prisma.transaction.count({
          where: { userId: session.userId, stripeId: { not: null } },
        })
      : 0

    return NextResponse.json({ connected, maskedKey, importedCount })
  } catch (error) {
    console.error('[stripe/connect GET]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// POST — validate and save personal Stripe API key
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { apiKey } = await request.json()
    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json({ error: 'Clé API requise' }, { status: 400 })
    }

    // Basic format check — accept sk_live_, sk_test_, or rk_live_, rk_test_
    if (!apiKey.match(/^(sk|rk)_(live|test)_/)) {
      return NextResponse.json(
        { error: 'Format invalide — la clé doit commencer par sk_live_, sk_test_, rk_live_ ou rk_test_' },
        { status: 400 }
      )
    }

    // Validate key against Stripe API
    try {
      await validateStripeKey(apiKey)
    } catch {
      return NextResponse.json(
        { error: 'Clé Stripe invalide ou permissions insuffisantes — vérifiez vos droits de lecture (invoices, charges)' },
        { status: 400 }
      )
    }

    // Save the key
    await prisma.user.update({
      where: { id: session.userId },
      data: { stripePersonalApiKey: apiKey },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[stripe/connect POST]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// DELETE — remove personal Stripe API key
export async function DELETE() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    await prisma.user.update({
      where: { id: session.userId },
      data: { stripePersonalApiKey: null },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[stripe/connect DELETE]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
