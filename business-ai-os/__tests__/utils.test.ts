import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { daysSince, normalizeSector, SECTORS } from '@/lib/utils'

describe('daysSince', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('returns Infinity for null input', () => {
    expect(daysSince(null)).toBe(Infinity)
  })

  it('returns 0 for today', () => {
    vi.setSystemTime(new Date('2026-06-03T12:00:00Z'))
    expect(daysSince('2026-06-03T12:00:00Z')).toBe(0)
  })

  it('returns 7 for 7 days ago', () => {
    vi.setSystemTime(new Date('2026-06-03T00:00:00Z'))
    expect(daysSince('2026-05-27T00:00:00Z')).toBe(7)
  })

  it('returns 30 for 30 days ago', () => {
    vi.setSystemTime(new Date('2026-06-03T00:00:00Z'))
    expect(daysSince('2026-05-04T00:00:00Z')).toBe(30)
  })

  it('returns Infinity for ghost deal detection (exceeds any threshold)', () => {
    expect(daysSince(null) > 30).toBe(true)
    expect(daysSince(null) >= 14).toBe(true)
  })
})

describe('normalizeSector', () => {
  it('returns empty string for empty input', () => {
    expect(normalizeSector('')).toBe('')
  })

  it('returns id unchanged when already a valid id', () => {
    expect(normalizeSector('tech')).toBe('tech')
    expect(normalizeSector('consulting')).toBe('consulting')
    expect(normalizeSector('other')).toBe('other')
    expect(normalizeSector('real_estate')).toBe('real_estate')
  })

  it('converts legacy label to id (exact case)', () => {
    expect(normalizeSector('Tech / SaaS')).toBe('tech')
    expect(normalizeSector('Consulting')).toBe('consulting')
    expect(normalizeSector('Marketing / Communication')).toBe('marketing')
    expect(normalizeSector('Finance / Comptabilité')).toBe('finance')
  })

  it('converts legacy label to id (case-insensitive)', () => {
    expect(normalizeSector('CONSULTING')).toBe('consulting')
    expect(normalizeSector('tech / saas')).toBe('tech')
  })

  it('returns original value for unrecognized sector', () => {
    expect(normalizeSector('unknown_sector')).toBe('unknown_sector')
    expect(normalizeSector('Biotechnology')).toBe('Biotechnology')
  })
})

describe('SECTORS', () => {
  it('has 13 entries', () => {
    expect(SECTORS).toHaveLength(13)
  })

  it('all entries have id and label', () => {
    SECTORS.forEach(s => {
      expect(s.id).toBeTruthy()
      expect(s.label).toBeTruthy()
    })
  })

  it('all ids are unique', () => {
    const ids = SECTORS.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
