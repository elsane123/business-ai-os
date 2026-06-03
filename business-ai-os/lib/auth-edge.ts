/**
 * Edge-compatible JWT verification — safe to import in middleware.ts
 * Does NOT import bcrypt or next/headers (Node.js-only APIs)
 */
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-please-change-in-production'
)

export interface JWTPayload {
  userId: string
  email: string
  plan: string
}

export async function verifyTokenEdge(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}
