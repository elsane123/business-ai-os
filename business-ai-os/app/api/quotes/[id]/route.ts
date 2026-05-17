import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/quotes/[id] — récupérer un devis par ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const quote = await prisma.quote.findFirst({
    where: { id: params.id, userId: user.userId },
    include: { prospect: { select: { id: true, name: true, company: true, email: true } } }
  })

  if (!quote) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
  return NextResponse.json(quote)
}

// PATCH /api/quotes/[id] — mettre à jour un devis (statut, lignes, etc.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { status, lines, notes, validUntil, clientName, clientCompany, clientEmail } = body

  // Vérifier que le devis appartient à l'utilisateur
  const existing = await prisma.quote.findFirst({
    where: { id: params.id, userId: user.userId }
  })
  if (!existing) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })

  // Préparer les données à mettre à jour
  const updateData: Record<string, unknown> = {}

  if (status !== undefined) {
    updateData.status = status
    if (status === 'ACCEPTED') updateData.acceptedAt = new Date()
    if (status === 'SENT') updateData.sentAt = new Date()
  }
  if (notes !== undefined) updateData.notes = notes
  if (validUntil !== undefined) updateData.validUntil = new Date(validUntil)

  // Recalculer les totaux si les lignes changent
  if (lines !== undefined && Array.isArray(lines) && lines.length > 0) {
    const normalized = lines.map((l: Record<string, unknown>) => ({
      ...l,
      qty: (l.qty as number) ?? (l.quantity as number) ?? 0
    }))
    const subtotalHT = normalized.reduce((s: number, l: Record<string, unknown>) =>
      s + (l.qty as number) * (l.unitPrice as number), 0)
    const totalVAT = normalized.reduce((s: number, l: Record<string, unknown>) =>
      s + (l.qty as number) * (l.unitPrice as number) * ((l.vatRate as number) / 100), 0)
    updateData.lines = JSON.stringify(lines)
    updateData.subtotalHT = subtotalHT
    updateData.totalVAT = totalVAT
    updateData.totalTTC = subtotalHT + totalVAT
  }

  // Mettre à jour clientInfo si fourni
  if (clientName || clientCompany || clientEmail) {
    const clientInfo = JSON.stringify({
      name: clientName ?? '',
      company: clientCompany ?? '',
      email: clientEmail ?? ''
    })
    updateData.clientInfo = clientInfo
  }

  const updated = await prisma.quote.update({
    where: { id: params.id },
    data: updateData,
    include: { prospect: { select: { id: true, name: true, company: true } } }
  })

  return NextResponse.json(updated)
}

// DELETE /api/quotes/[id] — supprimer un devis (uniquement DRAFT)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await prisma.quote.findFirst({
    where: { id: params.id, userId: user.userId }
  })
  if (!existing) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
  if (existing.status !== 'DRAFT') {
    return NextResponse.json(
      { error: 'Seuls les devis en brouillon peuvent être supprimés' },
      { status: 400 }
    )
  }

  await prisma.quote.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true, message: 'Devis supprimé' })
}
