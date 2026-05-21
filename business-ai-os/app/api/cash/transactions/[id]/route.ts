import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'

type RouteContext = { params: Promise<{ id: string }> }

// DELETE /api/cash/transactions/:id
export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const tx = await prisma.transaction.findFirst({
      where: { id, userId: session.userId },
    })
    if (!tx) return NextResponse.json({ error: 'Transaction introuvable' }, { status: 404 })

    await prisma.transaction.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[cash/transactions/:id DELETE]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// PATCH /api/cash/transactions/:id
export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const tx = await prisma.transaction.findFirst({
      where: { id, userId: session.userId },
    })
    if (!tx) return NextResponse.json({ error: 'Transaction introuvable' }, { status: 404 })

    const body = await req.json().catch(() => ({}))
    const { amount, type, category, description, date } = body

    const updateData: Record<string, unknown> = {}
    if (amount !== undefined)      updateData.amount = Math.abs(parseFloat(amount))
    if (type !== undefined)        updateData.type = type
    if (category !== undefined)    updateData.category = category
    if (description !== undefined) updateData.description = description
    if (date !== undefined)        updateData.date = new Date(date)

    const updated = await prisma.transaction.update({ where: { id }, data: updateData })
    return NextResponse.json({ transaction: updated })
  } catch (error) {
    console.error('[cash/transactions/:id PATCH]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
