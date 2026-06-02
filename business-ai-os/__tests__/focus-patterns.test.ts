import { describe, it, expect } from 'vitest'
import { computeSkipPatterns } from '@/lib/focus-patterns'

describe('computeSkipPatterns', () => {
  it('returns empty array for empty records', () => {
    expect(computeSkipPatterns([])).toEqual([])
  })

  it('returns empty array when keyword appears only once', () => {
    const records = [
      { actions: JSON.stringify([{ action: 'Appeler client important' }]), statuses: JSON.stringify(['skipped']) }
    ]
    expect(computeSkipPatterns(records)).toEqual([])
  })

  it('detects keyword skipped >60% with min 2 occurrences', () => {
    const skipped = {
      actions: JSON.stringify([{ action: 'Rédiger proposition commerciale' }]),
      statuses: JSON.stringify(['skipped'])
    }
    const done = {
      actions: JSON.stringify([{ action: 'Rédiger proposition commerciale' }]),
      statuses: JSON.stringify(['done'])
    }
    const records = [skipped, skipped, done] // 66.7% skip rate
    const result = computeSkipPatterns(records)
    expect(result.length).toBeGreaterThan(0)
    expect(result[0]).toContain('proposition')
  })

  it('does not flag keyword skipped exactly 50% of the time', () => {
    const skipped = {
      actions: JSON.stringify([{ action: 'Préparer rapport financier' }]),
      statuses: JSON.stringify(['skipped'])
    }
    const done = {
      actions: JSON.stringify([{ action: 'Préparer rapport financier' }]),
      statuses: JSON.stringify(['done'])
    }
    const records = [skipped, done] // exactly 50% — below 60% threshold
    expect(computeSkipPatterns(records)).toEqual([])
  })

  it('filters out stop words from keywords', () => {
    const records = [
      { actions: JSON.stringify([{ action: 'les dans pour avec' }]), statuses: JSON.stringify(['skipped']) },
      { actions: JSON.stringify([{ action: 'les dans pour avec' }]), statuses: JSON.stringify(['skipped']) },
    ]
    expect(computeSkipPatterns(records)).toEqual([])
  })

  it('filters out short words (<=3 chars)', () => {
    const records = [
      { actions: JSON.stringify([{ action: 'do it now' }]), statuses: JSON.stringify(['skipped']) },
      { actions: JSON.stringify([{ action: 'do it now' }]), statuses: JSON.stringify(['skipped']) },
    ]
    expect(computeSkipPatterns(records)).toEqual([])
  })

  it('handles malformed JSON gracefully without throwing', () => {
    const records = [
      { actions: 'invalid-json', statuses: 'also-invalid' }
    ]
    expect(() => computeSkipPatterns(records)).not.toThrow()
    expect(computeSkipPatterns(records)).toEqual([])
  })

  it('returns at most 5 patterns', () => {
    const makeRecord = (action: string, status: string) => ({
      actions: JSON.stringify([{ action }]),
      statuses: JSON.stringify([status])
    })
    const patterns = [
      'Analyser données financières', 'Préparer rapport mensuel', 'Contacter prospect important',
      'Rédiger article marketing', 'Planifier réunion équipe', 'Valider facture client'
    ]
    const records = patterns.flatMap(p => [makeRecord(p, 'skipped'), makeRecord(p, 'skipped')])
    const result = computeSkipPatterns(records)
    expect(result.length).toBeLessThanOrEqual(5)
  })
})
