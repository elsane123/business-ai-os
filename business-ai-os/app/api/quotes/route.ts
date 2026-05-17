import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export interface QuoteLine {
  title: string
  description?: string
  qty: number
  unitPrice: number
  vatRate: number // 0, 10, 20
  unit?: string
}

function calcTotals(lines: QuoteLine[]) {
  // Normalize: accept both `qty` and `quantity` from frontend
  const normalized = lines.map(l => ({ ...l, qty: l.qty ?? (l as Record<string,unknown>).quantity as number ?? 0 }))
  const subtotalHT = normalized.reduce((s, l) => s + l.qty * l.unitPrice, 0)
  const totalVAT = normalized.reduce((s, l) => s + l.qty * l.unitPrice * (l.vatRate / 100), 0)
  const totalTTC = subtotalHT + totalVAT
  return { subtotalHT, totalVAT, totalTTC }
}

async function nextQuoteNumber(userId: string): Promise<string> {
  const year = new Date().getFullYear()
  const user = await prisma.user.update({
    where: { id: userId },
    data: { quoteCounter: { increment: 1 } },
    select: { quoteCounter: true }
  })
  return `DEVIS-${year}-${String(user.quoteCounter).padStart(3, '0')}`
}

// GET /api/quotes — liste tous les devis de l'utilisateur
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const prospectId = searchParams.get('prospectId')
  const id = searchParams.get('id')

  // Retourner un seul devis par ID (pour la page d'impression)
  if (id) {
    const quote = await prisma.quote.findFirst({
      where: { id, userId: user.userId },
      include: { prospect: { select: { id: true, name: true, company: true } } }
    })
    if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(quote)
    // Enrichir clientInfo pour la page d'impression
    const rawSingle: { id: string; clientInfo: string | null }[] = await prisma.$queryRaw`
      SELECT id, "clientInfo" FROM quotes WHERE id = ${id} AND "userId" = ${user.userId}
    `
    return NextResponse.json({ ...quote, clientInfo: rawSingle[0]?.clientInfo ?? null })
  }

  const quotes = await prisma.quote.findMany({
    where: { userId: user.userId, ...(prospectId ? { prospectId } : {}) },
    include: { prospect: { select: { id: true, name: true, company: true } } },
    orderBy: { createdAt: 'desc' }
  })

  // Enrichir avec clientInfo via SQL brut (non dans DMMF Prisma cache)
  const rawCI: { id: string; clientInfo: string | null }[] = await prisma.$queryRaw`
    SELECT id, "clientInfo" FROM quotes WHERE "userId" = ${user.userId}
  `
  const ciMap = Object.fromEntries(rawCI.map((r: { id: string; clientInfo: string | null }) => [r.id, r.clientInfo]))
  return NextResponse.json(quotes.map(q => ({ ...q, clientInfo: ciMap[q.id] ?? null })))
}

// POST /api/quotes — créer un devis
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { prospectId, lines, notes, validDays = 30, clientInfo } = body

  if (!lines || !Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json({ error: 'Au moins une ligne requise' }, { status: 400 })
  }

  const { subtotalHT, totalVAT, totalTTC } = calcTotals(lines)
  const number = await nextQuoteNumber(user.userId)
  const validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000)

  const quote = await prisma.quote.create({
    data: {
      userId: user.userId,
      prospectId: prospectId || null,
      number,
      lines: JSON.stringify(lines),
      subtotalHT,
      totalVAT,
      totalTTC,
      validUntil,
      notes: notes || null,
      status: 'DRAFT'
    },
    include: { prospect: { select: { id: true, name: true, company: true } } }
  })

  // Stocker clientInfo via SQL direct (bypass validation Prisma cache)
  if (clientInfo) {
    await prisma.$executeRawUnsafe(
      `UPDATE quotes SET "clientInfo" = $1 WHERE id = $2`,
      JSON.stringify(clientInfo),
      quote.id
    )
  }

  return NextResponse.json(quote, { status: 201 })
}

// PATCH /api/quotes — modifier statut ou données
export async function PATCH(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, status, lines, notes, validDays, clientInfo } = body

  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const existing = await prisma.quote.findFirst({ where: { id, userId: user.userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updateData: Record<string, unknown> = {}

  if (status) {
    updateData.status = status
    if (status === 'SENT') updateData.sentAt = new Date()
    if (status === 'ACCEPTED') updateData.acceptedAt = new Date()
  }

  if (lines && Array.isArray(lines)) {
    const totals = calcTotals(lines)
    updateData.lines = JSON.stringify(lines)
    updateData.subtotalHT = totals.subtotalHT
    updateData.totalVAT = totals.totalVAT
    updateData.totalTTC = totals.totalTTC
  }

  if (notes !== undefined) updateData.notes = notes
  if (validDays) updateData.validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000)

  const quote = await prisma.quote.update({
    where: { id },
    data: updateData,
    include: { prospect: { select: { id: true, name: true, company: true } } }
  })

  // Stocker clientInfo via SQL direct si fourni
  if (clientInfo) {
    await prisma.$executeRawUnsafe(
      `UPDATE quotes SET "clientInfo" = $1 WHERE id = $2`,
      JSON.stringify(clientInfo),
      id
    )
  }

  return NextResponse.json(quote)
}

// DELETE /api/quotes — supprimer un devis DRAFT
export async function DELETE(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const existing = await prisma.quote.findFirst({ where: { id, userId: user.userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.status !== 'DRAFT') {
    return NextResponse.json({ error: 'Seuls les devis DRAFT peuvent être supprimés' }, { status: 400 })
  }

  await prisma.quote.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
