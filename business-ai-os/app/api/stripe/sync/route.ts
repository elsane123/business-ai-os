import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createPersonalStripe } from '@/lib/stripe-personal'

// POST — Sync Stripe paid invoices as INCOME transactions in Cash
export async function POST() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { stripePersonalApiKey: true },
    })

    if (!user?.stripePersonalApiKey) {
      return NextResponse.json(
        { error: 'Aucune clé Stripe configurée — connectez votre compte Stripe dans les paramètres' },
        { status: 400 }
      )
    }

    const stripe = createPersonalStripe(user.stripePersonalApiKey)

    // Fetch all paid invoices with pagination (one-time + subscription)
    const invoices: any[] = [] // eslint-disable-line @typescript-eslint/no-explicit-any
    let hasMore = true
    let startingAfter: string | undefined = undefined

    while (hasMore) {
      const page: Awaited<ReturnType<typeof stripe.invoices.list>> = await stripe.invoices.list({
        status: 'paid',
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      })
      invoices.push(...page.data)
      hasMore = page.has_more
      if (page.data.length > 0) {
        startingAfter = page.data[page.data.length - 1].id
      }
    }

    let imported = 0
    let skipped = 0

    for (const invoice of invoices) {
      // Skip invoices with no amount or no paid_at timestamp
      if (!invoice.amount_paid || !invoice.status_transitions?.paid_at) {
        skipped++
        continue
      }

      const amount = invoice.amount_paid / 100
      const paidAt = new Date(invoice.status_transitions.paid_at * 1000)

      // Build a readable description
      const customerName = typeof invoice.customer_name === 'string'
        ? invoice.customer_name
        : (invoice.customer_email ?? '')
      const lineDesc = invoice.lines?.data?.[0]?.description ?? ''
      const description = [
        customerName,
        lineDesc || invoice.number,
      ].filter(Boolean).join(' — ').slice(0, 200)

      // Upsert via unique(userId, stripeId) — idempotent
      const existing = await prisma.transaction.findFirst({
        where: { userId: session.userId, stripeId: invoice.id },
      })

      if (existing) {
        skipped++
        continue
      }

      await prisma.transaction.create({
        data: {
          userId: session.userId,
          amount,
          type: 'INCOME',
          category: 'Ventes Stripe',
          description: description || `Facture Stripe ${invoice.number}`,
          date: paidAt,
          tvaRate: 0,
          stripeId: invoice.id,
        },
      })

      imported++
    }

    return NextResponse.json({
      ok: true,
      total: invoices.length,
      imported,
      skipped,
    })
  } catch (error) {
    console.error('[stripe/sync POST]', error)
    // Return specific Stripe error message if available
    const message = error instanceof Error ? error.message : 'Erreur interne'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
