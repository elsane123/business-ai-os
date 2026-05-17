/**
 * In-memory password reset token store.
 * Tokens expire after 1 hour. Max 5 active tokens per email.
 * For production with multiple instances, replace with Redis or DB-backed store.
 */

interface ResetEntry {
  email: string
  expiresAt: number // Unix ms
}

// Map<token (uuid-like), ResetEntry>
const TOKEN_STORE = new Map<string, ResetEntry>()
const TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

// Cleanup expired tokens every 15 min
setInterval(() => {
  const now = Date.now()
  for (const [token, entry] of TOKEN_STORE.entries()) {
    if (entry.expiresAt < now) TOKEN_STORE.delete(token)
  }
}, 15 * 60 * 1000)

/** Generate a secure reset token for the given email */
export function createResetToken(email: string): string {
  // Remove any previous tokens for this email
  for (const [tok, entry] of TOKEN_STORE.entries()) {
    if (entry.email === email.toLowerCase()) TOKEN_STORE.delete(tok)
  }

  // Generate a random 64-char hex token
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const token = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')

  TOKEN_STORE.set(token, {
    email: email.toLowerCase(),
    expiresAt: Date.now() + TOKEN_TTL_MS,
  })

  return token
}

/** Validate a reset token. Returns the associated email or null if invalid/expired. */
export function validateResetToken(token: string): string | null {
  const entry = TOKEN_STORE.get(token)
  if (!entry) return null
  if (entry.expiresAt < Date.now()) {
    TOKEN_STORE.delete(token)
    return null
  }
  return entry.email
}

/** Consume (invalidate) a reset token after use */
export function consumeResetToken(token: string): void {
  TOKEN_STORE.delete(token)
}
