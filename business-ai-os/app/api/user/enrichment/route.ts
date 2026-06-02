import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { writeBrainFromEnrichment } from '@/lib/wiki/brain-writer'

export interface EnrichmentData {
  // Offres & Pricing
  offerType?: string
  offerDescription?: string
  priceRange?: string
  typicalDuration?: string
  // ICP & Stratégie
  targetClient?: string
  clientPainPoint?: string
  valueProposition?: string
  competitors?: string
  differentiator?: string
  // Localisation & Marché
  targetGeography?: string
  workLanguages?: string
  // Brief Commercial
  briefContent?: string
}

const ALL_FIELDS: (keyof EnrichmentData)[] = [
  'offerType', 'offerDescription', 'priceRange', 'typicalDuration',
  'targetClient', 'clientPainPoint', 'valueProposition', 'competitors', 'differentiator',
  'targetGeography', 'workLanguages',
  'briefContent',
]

function computeScore(data: EnrichmentData): number {
  const filled = ALL_FIELDS.filter(f => {
    const v = data[f]
    return v && String(v).trim().length > 0
  }).length
  return Math.round((filled / ALL_FIELDS.length) * 100)
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { profileEnrichment: true },
    })

    let data: EnrichmentData = {}
    try { data = JSON.parse(user?.profileEnrichment ?? '{}') } catch { data = {} }

    return NextResponse.json({ data, score: computeScore(data) })
  } catch (error) {
    console.error('GET /api/user/enrichment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: Partial<EnrichmentData> = await req.json()

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { profileEnrichment: true },
    })

    let current: EnrichmentData = {}
    try { current = JSON.parse(user?.profileEnrichment ?? '{}') } catch { current = {} }

    // Merge — only update provided keys
    const updated: EnrichmentData = { ...current }
    for (const field of ALL_FIELDS) {
      if (body[field] !== undefined) updated[field] = body[field]
    }

    const userData = await prisma.user.update({
      where: { id: session.userId },
      data: { profileEnrichment: JSON.stringify(updated) },
      select: { businessName: true, sector: true, monthlyGoal: true },
    })

    // Sync BRAIN.md directly (replaces the indirect wiki/ingest call)
    try {
      writeBrainFromEnrichment(session.userId, updated, userData)
    } catch { /* non-blocking */ }

    return NextResponse.json({ ok: true, score: computeScore(updated) })
  } catch (error) {
    console.error('PATCH /api/user/enrichment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
