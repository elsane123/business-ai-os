import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/db'
import { AGENTS_CATALOG, AGENT_SLOTS_BY_PLAN } from '@/lib/agents-catalog'

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userId = session.userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    })
    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

    const activations = await prisma.agentActivation.findMany({
      where: { userId },
      select: { agentId: true, activatedAt: true },
    })

    const activeIds = new Set(activations.map((a: { agentId: string }) => a.agentId))
    const maxSlots = AGENT_SLOTS_BY_PLAN[user.plan] ?? 0

    const agents = AGENTS_CATALOG.map((agent) => ({
      ...agent,
      isActive: activeIds.has(agent.id),
      activatedAt: activations.find((a: { agentId: string; activatedAt: Date }) => a.agentId === agent.id)?.activatedAt ?? null,
    }))

    return NextResponse.json({
      agents,
      userPlan: user.plan,
      maxSlots,
      activeCount: activations.length,
    })
  } catch (err) {
    console.error('[GET /api/agents]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
