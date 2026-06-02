import { describe, it, expect } from 'vitest'
import { getClientIp } from '@/lib/rate-limit'

describe('getClientIp', () => {
  it('returns first IP from x-forwarded-for header', () => {
    const req = new Request('http://localhost/', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8, 9.10.11.12' }
    })
    expect(getClientIp(req)).toBe('1.2.3.4')
  })

  it('trims whitespace from x-forwarded-for entries', () => {
    const req = new Request('http://localhost/', {
      headers: { 'x-forwarded-for': '  1.2.3.4  , 5.6.7.8' }
    })
    expect(getClientIp(req)).toBe('1.2.3.4')
  })

  it('handles single IP in x-forwarded-for', () => {
    const req = new Request('http://localhost/', {
      headers: { 'x-forwarded-for': '203.0.113.42' }
    })
    expect(getClientIp(req)).toBe('203.0.113.42')
  })

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = new Request('http://localhost/', {
      headers: { 'x-real-ip': '10.0.0.1' }
    })
    expect(getClientIp(req)).toBe('10.0.0.1')
  })

  it('returns "unknown" when no IP headers are present', () => {
    const req = new Request('http://localhost/')
    expect(getClientIp(req)).toBe('unknown')
  })

  it('prefers x-forwarded-for over x-real-ip when both are present', () => {
    const req = new Request('http://localhost/', {
      headers: {
        'x-forwarded-for': '1.2.3.4',
        'x-real-ip': '9.9.9.9'
      }
    })
    expect(getClientIp(req)).toBe('1.2.3.4')
  })
})
