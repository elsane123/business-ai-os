import Stripe from 'stripe'

/**
 * Create a Stripe client using the user's personal restricted API key.
 * Used for importing the user's own Stripe invoices as Cash transactions.
 */
export function createPersonalStripe(apiKey: string): Stripe {
  return new Stripe(apiKey, {
    apiVersion: '2023-10-16',
    typescript: true,
  })
}

/**
 * Validate a Stripe restricted key by calling accounts.retrieve.
 * Returns the account display name on success, throws on failure.
 */
export async function validateStripeKey(apiKey: string): Promise<string> {
  const stripe = createPersonalStripe(apiKey)
  // For restricted keys, we use balance.retrieve which works without full account access
  const balance = await stripe.balance.retrieve()
  return balance.object === 'balance' ? 'valid' : 'unknown'
}
