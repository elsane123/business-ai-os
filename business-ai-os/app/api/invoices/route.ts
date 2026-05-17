import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

function calcTotals(lines: { qty: number; unitPrice: number; vatRate: number }[]) {
  const normalized = lines.map(l => ({ ...l, qty: l.qty ?? (l as Record<string,unknown>).quantity as number ?? 0 }))
  const subtotalHT = normalized.reduce((s, l) => s + l.qty * l.unitPrice, 0)
  const totalVAT = normalized.reduce((s, l) => s + l.qty * l.unitPrice * (l.vatRate / 100), 0)
  return { subtotalHT, totalVAT, totalTTC: subtotalHT + totalVAT }
}

async function nextInvoiceNumber(userId: string): Promise<string> {
  const year = new Date().getFullYear()
  const user = await prisma.user.update({
    where: { id: userId },
    data: { invoiceCounter: { increment: 1 } },
    select: { invoiceCounter: true }
  })
  return `FAC-${year}-${String(user.invoiceCounter).padStart(3, '0')}`
}

// GET /api/invoices — liste toutes les factures
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const prospectId = searchParams.get('prospectId')
  const status = searchParams.get('status')
  const id = searchParams.get('id')

  // Retourner une seule facture par ID
  if (id) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, userId: user.userId },
      include: { prospect: { select: { id: true, name: true, company: true, email: true } } }
    })
    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(invoice)
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      userId: user.userId,
      ...(prospectId ? { prospectId } : {}),
      ...(status ? { status } : {})
    },
    include: { prospect: { select: { id: true, name: true, company: true } } },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(invoices)
}

// POST /api/invoices — créer une facture (manuellement ou depuis un devis)
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { prospectId, lines, notes, paymentDays, fromQuoteId } = body

  let finalLines = lines
  let finalProspectId = prospectId

  // Si création depuis un devis
  if (fromQuoteId) {
    const quote = await prisma.quote.findFirst({ where: { id: fromQuoteId, userId: user.userId } })
    if (!quote) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
    if (quote.status !== 'ACCEPTED') {
      return NextResponse.json({ error: 'Le devis doit être accepté pour créer une facture' }, { status: 400 })
    }
    finalLines = JSON.parse(quote.lines)
    finalProspectId = quote.prospectId
  }

  if (!finalLines || !Array.isArray(finalLines) || finalLines.length === 0) {
    return NextResponse.json({ error: 'Au moins une ligne requise' }, { status: 400 })
  }

  const userSettings = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { paymentTerms: true }
  })

  const terms = paymentDays || userSettings?.paymentTerms || 30
  const { subtotalHT, totalVAT, totalTTC } = calcTotals(finalLines)
  const number = await nextInvoiceNumber(user.userId)
  const dueDate = new Date(Date.now() + terms * 24 * 60 * 60 * 1000)

  const invoice = await prisma.invoice.create({
    data: {
      userId: user.userId,
      prospectId: finalProspectId || null,
      number,
      lines: JSON.stringify(finalLines),
      subtotalHT,
      totalVAT,
      totalTTC,
      dueDate,
      notes: notes || null,
      status: 'DRAFT',
      ...(fromQuoteId ? {} : {})
    },
    include: { prospect: { select: { id: true, name: true, company: true } } }
  })

  // Lier le devis à la facture si applicable
  if (fromQuoteId) {
    await prisma.quote.update({
      where: { id: fromQuoteId },
      data: { invoiceId: invoice.id }
    })
  }

  return NextResponse.json(invoice, { status: 201 })
}

// PATCH /api/invoices — modifier statut, marquer payée, etc.
export async function PATCH(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, status, lines, notes, dueDate } = body

  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const existing = await prisma.invoice.findFirst({ where: { id, userId: user.userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updateData: Record<string, unknown> = {}

  if (status) {
    updateData.status = status
    if (status === 'SENT') updateData.sentAt = new Date()
    if (status === 'PAID') {
      updateData.paidAt = new Date()
      // Créer automatiquement une transaction INCOME dans Cash
      const transaction = await prisma.transaction.create({
        data: {
          userId: user.userId,
          amount: existing.totalTTC,
          type: 'INCOME',
          category: 'Paiement facture',
          description: `Règlement ${existing.number}${
            existing.prospectId ? '' : ''
          }`,
          date: new Date()
        }
      })
      updateData.transactionId = transaction.id
    }
  }

  if (lines && Array.isArray(lines)) {
    const totals = calcTotals(lines)
    updateData.lines = JSON.stringify(lines)
    updateData.subtotalHT = totals.subtotalHT
    updateData.totalVAT = totals.totalVAT
    updateData.totalTTC = totals.totalTTC
  }

  if (notes !== undefined) updateData.notes = notes
  if (dueDate) updateData.dueDate = new Date(dueDate)

  const invoice = await prisma.invoice.update({
    where: { id },
    data: updateData,
    include: { prospect: { select: { id: true, name: true, company: true } } }
  })

  return NextResponse.json(invoice)
}

// DELETE /api/invoices — supprimer une facture DRAFT uniquement
export async function DELETE(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const existing = await prisma.invoice.findFirst({ where: { id, userId: user.userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.status !== 'DRAFT') {
    return NextResponse.json({ error: 'Seules les factures DRAFT peuvent être supprimées' }, { status: 400 })
  }

  await prisma.invoice.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
