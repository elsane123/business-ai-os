import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { AGENTS_CATALOG, AGENT_SLOTS_BY_PLAN } from '@/lib/agents-catalog'
import prisma from '@/lib/db'

// GET /api/agents/catalog — returns full catalog with activation state
// (Alias for GET /api/agents — BUG-F Sprint 3 fix)
export async function GET(_req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { plan: true },
    })
    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

    const activations = await prisma.agentActivation.findMany({
      where: { userId: session.userId },
      select: { agentId: true, activatedAt: true },
    })
    const activeIds = new Set(activations.map((a: { agentId: string }) => a.agentId))
    const maxSlots = AGENT_SLOTS_BY_PLAN[user.plan] ?? 0

    const agents = AGENTS_CATALOG.map((agent) => ({
      ...agent,
      isActive: activeIds.has(agent.id),
      canActivate: user.plan !== 'FREE' && activeIds.size < maxSlots,
    }))

    return NextResponse.json({ agents, maxSlots, activatedCount: activeIds.size, plan: user.plan })
  } catch (error) {
    console.error('[agents/catalog GET]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
