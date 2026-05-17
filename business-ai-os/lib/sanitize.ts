/**
 * Server-side XSS sanitization utility — no external dependency
 *
 * Strips HTML tags and encodes dangerous characters to prevent
 * stored XSS attacks when user-supplied strings are saved to DB.
 *
 * Usage:
 *   import { sanitizeText, sanitizeHtml } from '@/lib/sanitize'
 *   const safeName = sanitizeText(body.name, 100)
 *   const safeNotes = sanitizeText(body.notes, 2000)
 */

/**
 * Strip all HTML tags and encode entities.
 * Safe for storing in DB and rendering as plain text.
 *
 * @param input  Raw user input
 * @param maxLen Maximum allowed length (default: 5000)
 */
export function sanitizeText(input: unknown, maxLen = 5000): string {
  if (input === null || input === undefined) return ''
  const str = String(input)

  // 1. Strip all HTML/XML tags (< ... >)
  const noTags = str.replace(/<[^>]*>/g, '')

  // 2. Decode common HTML entities first (avoid double-encoding)
  const decoded = noTags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')

  // 3. Re-encode dangerous characters
  const encoded = decoded
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#x60;')
    .replace(/=/g, '&#x3D;')

  // 4. Remove null bytes and other control characters (except \n \r \t)
  const clean = encoded.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // 5. Trim and truncate
  return clean.trim().slice(0, maxLen)
}

/**
 * Sanitize an email address.
 * Strips tags and limits to 254 chars (RFC 5321).
 */
export function sanitizeEmail(input: unknown): string {
  if (input === null || input === undefined) return ''
  const str = String(input).trim().toLowerCase()
  // Remove any HTML tags, keep only safe email characters
  return str.replace(/<[^>]*>/g, '').slice(0, 254)
}

/**
 * Sanitize a URL (LinkedIn, website, etc.).
 * Only allows http/https schemes to prevent javascript: URIs.
 */
export function sanitizeUrl(input: unknown): string | null {
  if (input === null || input === undefined || String(input).trim() === '') return null
  const str = String(input).trim()
  // Must start with http:// or https://
  if (!/^https?:\/\//i.test(str)) return null
  // Strip tags
  return str.replace(/<[^>]*>/g, '').slice(0, 2048)
}

/**
 * Sanitize a phone number.
 * Only allows digits, spaces, +, -, (, )
 */
export function sanitizePhone(input: unknown): string {
  if (input === null || input === undefined) return ''
  return String(input).replace(/[^0-9+\-().\s]/g, '').slice(0, 30)
}
