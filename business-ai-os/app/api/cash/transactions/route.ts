import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { ingestWikiEvent } from '@/lib/wiki/ingest'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: session.userId },
      orderBy: { date: 'desc' },
      take: 100,
    })

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('[cash/transactions GET]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, type, category, description, date } = body

    if (!amount || !type || !category || !date) {
      return NextResponse.json(
        { error: 'Montant, type, catégorie et date requis' },
        { status: 400 }
      )
    }

    const parsedAmount = Math.abs(parseFloat(amount))
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
    }

    const tvaRate = body.tvaRate !== undefined ? parseFloat(body.tvaRate) : 0

    const transaction = await prisma.transaction.create({
      data: {
        userId: session.userId,
        amount: parsedAmount,
        type,
        category,
        description: description || '',
        date: new Date(date),
        tvaRate: isNaN(tvaRate) ? 0 : tvaRate,
      },
    })

    try {
      await ingestWikiEvent(session.userId, 'transaction_added', {
        amount: parsedAmount,
        type,
        category,
        description,
        date,
      })
    } catch (_) {
      // wiki ingest optional — ignore silently
    }

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error) {
    console.error('[cash/transactions POST]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    // Verify ownership before deleting
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId: session.userId },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction introuvable' }, { status: 404 })
    }

    await prisma.transaction.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[cash/transactions DELETE]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
