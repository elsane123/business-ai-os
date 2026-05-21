import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/db'
import { AGENTS_CATALOG, canActivateAgent } from '@/lib/agents-catalog'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST — Activer un agent
export async function POST(_req: Request, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userId = session.userId
    const { id: agentId } = await params

    // Vérifier que l'agent existe
    const agent = AGENTS_CATALOG.find((a) => a.id === agentId)
    if (!agent) return NextResponse.json({ error: 'Agent introuvable' }, { status: 404 })

    // Récupérer le plan utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    })
    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

    // Compter les agents actifs
    const activeCount = await prisma.agentActivation.count({ where: { userId } })

    // Vérifier si déjà actif
    const existing = await prisma.agentActivation.findUnique({
      where: { userId_agentId: { userId, agentId } },
    })
    if (existing) {
      return NextResponse.json({ message: 'Agent déjà actif', alreadyActive: true })
    }

    // Vérifier les limites du plan
    const check = canActivateAgent(user.plan, activeCount)
    if (!check.allowed) {
      return NextResponse.json({ error: check.reason }, { status: 403 })
    }

    // Activer
    await prisma.agentActivation.create({
      data: { userId, agentId },
    })

    return NextResponse.json({ success: true, agentId })
  } catch (err) {
    console.error('[POST /api/agents/[id]/activate]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE — Désactiver un agent
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userId = session.userId
    const { id: agentId } = await params

    await prisma.agentActivation.deleteMany({
      where: { userId, agentId },
    })

    return NextResponse.json({ success: true, agentId })
  } catch (err) {
    console.error('[DELETE /api/agents/[id]/activate]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
