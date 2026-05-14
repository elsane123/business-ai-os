import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// ─── GET — RDV du jour ou par prospect ────────────────────────────────────────
// ?today=true  → RDV du jour uniquement
// ?prospectId=xxx → RDV d'un prospect spécifique
// ?upcoming=true → Prochains RDV (7 jours)

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const url = new URL(request.url)
    const today = url.searchParams.get('today') === 'true'
    const upcoming = url.searchParams.get('upcoming') === 'true'
    const prospectId = url.searchParams.get('prospectId')

    const now = new Date()

    // Filtre de date selon le paramètre
    let startTime: Date | undefined
    let endTime: Date | undefined

    if (today) {
      startTime = new Date(now)
      startTime.setHours(0, 0, 0, 0)
      endTime = new Date(now)
      endTime.setHours(23, 59, 59, 999)
    } else if (upcoming) {
      startTime = now
      endTime = new Date(now)
      endTime.setDate(endTime.getDate() + 7)
    }

    const events = await prisma.calendarEvent.findMany({
      where: {
        userId: session.userId,
        status: { not: 'CANCELLED' },
        ...(prospectId ? { prospectId } : {}),
        ...(startTime && endTime ? {
          startTime: { gte: startTime, lte: endTime },
        } : {}),
      },
      orderBy: { startTime: 'asc' },
      include: {
        prospect: {
          select: { id: true, name: true, company: true, status: true },
        },
      },
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('[calcom/events GET]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// ─── DELETE — supprimer un événement manuellement ────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    await prisma.calendarEvent.deleteMany({
      where: { id, userId: session.userId },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[calcom/events DELETE]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
