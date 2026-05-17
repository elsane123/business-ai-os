/**
 * In-memory rate limiter — no external dependency required
 * Uses a sliding window counter per key (IP-based)
 *
 * Usage:
 *   const limiter = new RateLimiter({ max: 5, windowMs: 15 * 60 * 1000 })
 *   const result = limiter.check('ip-address')
 *   if (!result.allowed) return 429
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitOptions {
  /** Maximum number of requests allowed per window */
  max: number
  /** Window duration in milliseconds */
  windowMs: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  /** Seconds until the window resets (for Retry-After header) */
  retryAfter: number
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private readonly max: number
  private readonly windowMs: number

  constructor(options: RateLimitOptions) {
    this.max = options.max
    this.windowMs = options.windowMs

    // Purge expired entries every 5 minutes to prevent memory leak
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.purge(), 5 * 60 * 1000)
    }
  }

  check(key: string): RateLimitResult {
    const now = Date.now()
    const entry = this.store.get(key)

    // No entry or window expired → reset
    if (!entry || now > entry.resetAt) {
      const resetAt = now + this.windowMs
      this.store.set(key, { count: 1, resetAt })
      return {
        allowed: true,
        remaining: this.max - 1,
        resetAt,
        retryAfter: 0,
      }
    }

    // Window still active
    entry.count += 1
    const remaining = Math.max(0, this.max - entry.count)
    const allowed = entry.count <= this.max
    const retryAfter = allowed ? 0 : Math.ceil((entry.resetAt - now) / 1000)

    return { allowed, remaining, resetAt: entry.resetAt, retryAfter }
  }

  /** Remove expired entries */
  private purge() {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) this.store.delete(key)
    }
  }
}

/**
 * Extract the real client IP from Next.js request headers.
 * Supports X-Forwarded-For (proxies/CDN) and X-Real-IP.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list; take the first (client) IP
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') ?? 'unknown'
}

// ── Singleton instances ──────────────────────────────────────────────────────

/** Login rate limiter: 5 attempts per 15 minutes per IP */
export const loginRateLimiter = new RateLimiter({
  max: 5,
  windowMs: 15 * 60 * 1000,
})
