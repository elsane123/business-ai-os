import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2023-10-16',
  typescript: true,
})

export async function createCheckoutSession(userId: string, email: string, baseUrl?: string) {
  const appUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    customer_email: email,
    line_items: [{
      price: process.env.STRIPE_PRICE_ID_SOLO_PRO,
      quantity: 1,
    }],
    success_url: `${appUrl}/settings?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/settings?upgrade=cancel`,
    metadata: { userId },
  })
  return session
}

export async function createPortalSession(customerId: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
  })
}

export function constructWebhookEvent(body: string, signature: string) {
  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET ?? ''
  )
}
