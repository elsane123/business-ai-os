/**
 * Shared pure utility functions.
 * Extracted for testability — no external dependencies.
 */

// ── Sector constants ─────────────────────────────────────────────────────────

export const SECTORS = [
  { id: 'tech',        label: 'Tech / SaaS' },
  { id: 'consulting',  label: 'Consulting' },
  { id: 'commerce',   label: 'Commerce' },
  { id: 'services',   label: 'Services' },
  { id: 'creative',   label: 'Créatif' },
  { id: 'freelance',  label: 'Freelance / Indépendant' },
  { id: 'health',     label: 'Santé / Bien-être' },
  { id: 'education',  label: 'Formation / Education' },
  { id: 'marketing',  label: 'Marketing / Communication' },
  { id: 'real_estate', label: 'Immobilier' },
  { id: 'finance',    label: 'Finance / Comptabilité' },
  { id: 'legal',      label: 'Juridique' },
  { id: 'other',      label: 'Autre' },
]

// ── Pipeline utilities ────────────────────────────────────────────────────────

/**
 * Returns the number of days since a date string, or null if dateStr is null.
 * Returns Infinity if dateStr is null (for ghost-deal detection: never-contacted
 * prospects should always exceed any threshold).
 */
export function daysSince(dateStr: string | null): number {
  if (!dateStr) return Infinity
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

// ── Settings utilities ────────────────────────────────────────────────────────

/**
 * Normalizes a legacy sector label string to the canonical id-based value.
 * Returns the original value unchanged if it is already a valid id or unrecognized.
 */
export function normalizeSector(v: string): string {
  if (!v) return ''
  if (SECTORS.some(s => s.id === v)) return v
  const match = SECTORS.find(s => s.label.toLowerCase() === v.toLowerCase())
  return match ? match.id : v
}
