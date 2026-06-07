import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/wiki/reader', () => ({
  readBrain: vi.fn(),
  getUserWikiPath: vi.fn(),
  getWikiFilePath: vi.fn(),
  readWikiPage: vi.fn(),
  listWikiPages: vi.fn(),
}))

import { prisma } from '@/lib/db'
import * as wikiReader from '@/lib/wiki/reader'
import { getBrainContext } from '@/lib/brain-context'

const mockUser = prisma.user.findUnique as ReturnType<typeof vi.fn>
const mockReadBrain = wikiReader.readBrain as ReturnType<typeof vi.fn>

// ─── Base user fixture ───────────────────────────────────────────────────────

const baseUser = {
  businessName: 'TestCorp SARL',
  sector: 'Conseil informatique',
  monthlyGoal: 5000,
  fixedCharges: 1200,
  legalForm: 'SARL',
  activityType: 'Prestation de services',
  city: 'Paris',
  profileEnrichment: '{}',
}

beforeEach(() => {
  vi.clearAllMocks()
  mockReadBrain.mockReturnValue('# Business Brain\n\nNon configuré.')
})

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('getBrainContext', () => {

  it('BC-U01: injecte businessName, sector, monthlyGoal dans le contexte', async () => {
    mockUser.mockResolvedValue(baseUser)
    const ctx = await getBrainContext('user-test-id')
    expect(ctx).toContain('TestCorp SARL')
    expect(ctx).toContain('Conseil informatique')
    expect(ctx).toContain('5000')
    expect(ctx).toContain('## 🧠 Identité Business')
  })

  it('BC-U02: briefContent du wizard prend le dessus sur BRAIN.md', async () => {
    mockUser.mockResolvedValue({
      ...baseUser,
      profileEnrichment: JSON.stringify({ briefContent: 'Mon offre unique XYZ' }),
    })
    // BRAIN.md has different content
    mockReadBrain.mockReturnValue('Contenu wiki alternatif')

    const ctx = await getBrainContext('user-test-id')

    expect(ctx).toContain('Mon offre unique XYZ')
    expect(ctx).not.toContain('## 📋 Wiki Business Brain')
    expect(ctx).not.toContain('Contenu wiki alternatif')
  })

  it('BC-U03: BRAIN.md wiki injecté quand briefContent absent', async () => {
    mockUser.mockResolvedValue({
      ...baseUser,
      profileEnrichment: '{}',
    })
    mockReadBrain.mockReturnValue('# Brain\nExpertise Odoo depuis 2018')

    const ctx = await getBrainContext('user-test-id')

    expect(ctx).toContain('Expertise Odoo depuis 2018')
    expect(ctx).toContain('## 📋 Wiki Business Brain')
  })

  it('BC-U04: retourne chaîne vide pour userId inexistant', async () => {
    mockUser.mockResolvedValue(null)

    const ctx = await getBrainContext('non-existent-user-id')

    expect(ctx).toBe('')
  })

  it('BC-U05: JSON malformé dans profileEnrichment → no crash, header présent', async () => {
    mockUser.mockResolvedValue({
      ...baseUser,
      profileEnrichment: '{invalid json',
    })

    const ctx = await getBrainContext('user-test-id')

    expect(ctx).toBeTruthy()
    expect(ctx).toContain('Identité Business')
  })

  it('BC-U06: section Offre principale apparaît si offerType renseigné', async () => {
    mockUser.mockResolvedValue({
      ...baseUser,
      profileEnrichment: JSON.stringify({
        offerType: 'Accompagnement',
        offerDescription: 'Coaching CEO',
        priceRange: '3000-6000€',
      }),
    })

    const ctx = await getBrainContext('user-test-id')

    expect(ctx).toContain('## 💼 Offre principale')
    expect(ctx).toContain('Accompagnement')
    expect(ctx).toContain('Coaching CEO')
    expect(ctx).toContain('3000-6000€')
  })

  it('BC-U06b: section Positionnement apparaît si valueProposition renseigné', async () => {
    mockUser.mockResolvedValue({
      ...baseUser,
      profileEnrichment: JSON.stringify({
        valueProposition: 'Productivité x3 en 90 jours',
        differentiator: 'Méthode propriétaire APEX',
        targetClient: 'CEO PME 10-50 salariés',
      }),
    })

    const ctx = await getBrainContext('user-test-id')

    expect(ctx).toContain('## 🎯 Positionnement')
    expect(ctx).toContain('Productivité x3 en 90 jours')
    expect(ctx).toContain('Méthode propriétaire APEX')
    expect(ctx).toContain('CEO PME 10-50 salariés')
  })

  it('BC-U07: BRAIN.md absent → hasBrain=false, pas de section wiki', async () => {
    mockUser.mockResolvedValue({ ...baseUser, profileEnrichment: '{}' })
    // simulate readBrain returning default unconfigured text
    mockReadBrain.mockReturnValue('# Business Brain\n\nNon configuré.')

    const ctx = await getBrainContext('user-test-id')

    expect(ctx).not.toContain('## 📋 Wiki Business Brain')
    // Base identity header still present
    expect(ctx).toContain('## 🧠 Identité Business')
  })

})

// ─── Wiki Reader — path validation (real implementation via importActual) ───

describe('wiki reader — path security (real implementation)', () => {

  it('BC-U08: getWikiFilePath rejette path traversal (..)', async () => {
    const { getWikiFilePath } = await vi.importActual<typeof import('@/lib/wiki/reader')>('@/lib/wiki/reader')
    expect(() => getWikiFilePath('validuser123abc', '../../../etc/passwd'))
      .toThrow()
  })

  it('BC-U08b: getUserWikiPath rejette userId avec / ou ..', async () => {
    const { getUserWikiPath } = await vi.importActual<typeof import('@/lib/wiki/reader')>('@/lib/wiki/reader')
    expect(() => getUserWikiPath('user/../hack'))
      .toThrow()
    expect(() => getUserWikiPath('user/subdir'))
      .toThrow()
  })

})
