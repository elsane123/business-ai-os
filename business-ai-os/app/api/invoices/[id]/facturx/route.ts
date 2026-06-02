import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: user.userId },
    include: { prospect: { select: { id: true, name: true, company: true, email: true } } }
  })
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const seller = await prisma.user.findUnique({
    where: { id: user.userId },
    select: {
      name: true, email: true, businessName: true, legalName: true,
      address: true, zipCode: true, city: true,
      siret: true, legalForm: true, vatNumber: true, invoiceFooter: true
    }
  })

  const pythonUrl = process.env.PYTHON_AGENT_URL || 'http://localhost:8000'

  let lines: unknown[]
  try {
    lines = JSON.parse(invoice.lines)
  } catch {
    lines = []
  }

  const body = {
    invoice: {
      ...invoice,
      lines,
      createdAt: invoice.createdAt.toISOString(),
      dueDate: invoice.dueDate?.toISOString() ?? null,
      paidAt: invoice.paidAt?.toISOString() ?? null,
      sentAt: invoice.sentAt?.toISOString() ?? null,
    },
    seller: seller ?? {}
  }

  const res = await fetch(`${pythonUrl}/facturx/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: `Erreur génération Factur-X: ${err}` }, { status: 500 })
  }

  const pdfBuffer = await res.arrayBuffer()
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.number}-facturx.pdf"`
    }
  })
}
