/**
 * DB-backed password reset token store.
 * Tokens expire after 1 hour. One active token per email (previous invalidated on new request).
 */

import { prisma } from '@/lib/db'

const TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

/** Generate a secure reset token for the given email */
export async function createResetToken(email: string): Promise<string> {
  const normalizedEmail = email.toLowerCase()

  // Invalidate any existing tokens for this email
  await prisma.passwordResetToken.deleteMany({
    where: { email: normalizedEmail },
  })

  // Generate a random 64-char hex token
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const token = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')

  await prisma.passwordResetToken.create({
    data: {
      token,
      email: normalizedEmail,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  })

  return token
}

/** Validate a reset token. Returns the associated email or null if invalid/expired. */
export async function validateResetToken(token: string): Promise<string | null> {
  const entry = await prisma.passwordResetToken.findUnique({
    where: { token },
  })

  if (!entry) return null

  if (entry.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { token } })
    return null
  }

  return entry.email
}

/** Consume (invalidate) a reset token after use */
export async function consumeResetToken(token: string): Promise<void> {
  await prisma.passwordResetToken.deleteMany({ where: { token } })
}
