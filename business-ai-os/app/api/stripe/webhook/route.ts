import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// Raw body required for Stripe signature verification
// Note: bodyParser config not needed in Next.js 14 App Router — request.text() works natively
export async function POST(request: NextRequest) {
  // Stripe not configured — skip gracefully
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn('[stripe/webhook] Stripe not configured — skipping')
    return NextResponse.json({ received: true })
  }

  let body: string
  try {
    body = await request.text()
  } catch (err) {
    console.error('[stripe/webhook] Failed to read body', err)
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: import('stripe').Stripe.Event
  try {
    const { constructWebhookEvent } = await import('@/lib/stripe')
    event = constructWebhookEvent(body, signature)
  } catch (err) {
    console.error('[stripe/webhook] Signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as import('stripe').Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const customerId = session.customer as string | null

        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: 'PRO',
              ...(customerId ? { stripeCustomerId: customerId } : {}),
            },
          })
          console.log(`[stripe/webhook] User ${userId} upgraded to PRO`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as import('stripe').Stripe.Subscription
        const customerId = subscription.customer as string

        if (customerId) {
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { plan: 'FREE' },
          })
          console.log(`[stripe/webhook] Customer ${customerId} downgraded to FREE`)
        }
        break
      }

      default:
        // Unhandled event type — ignore
        break
    }
  } catch (err) {
    console.error('[stripe/webhook] Handler error', err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
