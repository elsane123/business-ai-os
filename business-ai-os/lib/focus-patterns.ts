/**
 * Shared focus pattern utilities.
 * Extracted from focus/route.ts and focus/history/route.ts to eliminate duplication.
 */

const STOP_WORDS = new Set([
  'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'en', 'au', 'aux',
  'ce', 'se', 'sa', 'son', 'ses', 'mon', 'ma', 'mes', 'votre', 'vos', 'sur',
  'par', 'pour', 'avec', 'dans', 'est', 'ou', 'qui', 'que', 'à', 'nos',
  'leur', 'leurs',
])

interface RawFocusRecord {
  actions: string
  statuses: string
}

/**
 * Compute skip patterns from a list of daily focus records.
 * Returns up to 5 keyword phrases that have been skipped >60% of the time
 * and appeared at least 2 times.
 */
export function computeSkipPatterns(records: RawFocusRecord[]): string[] {
  const keywordSkip: Record<string, number> = {}
  const keywordTotal: Record<string, number> = {}

  for (const record of records) {
    let actions: { action: string }[] = []
    let statuses: string[] = []
    try { actions = JSON.parse(record.actions) } catch { /* ignore */ }
    try { statuses = JSON.parse(record.statuses) } catch { /* ignore */ }

    actions.forEach((a, i) => {
      const words = a.action
        .toLowerCase()
        .split(/\W+/)
        .filter((w: string) => w.length > 3 && !STOP_WORDS.has(w))
      const key = words.slice(0, 3).join('_')
      if (key) {
        keywordTotal[key] = (keywordTotal[key] ?? 0) + 1
        if (statuses[i] === 'skipped') {
          keywordSkip[key] = (keywordSkip[key] ?? 0) + 1
        }
      }
    })
  }

  return Object.entries(keywordSkip)
    .filter(([key, count]) => (keywordTotal[key] ?? 0) >= 2 && count / (keywordTotal[key] ?? 1) > 0.6)
    .map(([key]) => key.replace(/_/g, ' '))
    .slice(0, 5)
}
