import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/db'
import { getAgentById } from '@/lib/agents-catalog'
import { searchWiki } from '@/lib/wiki/query'
import { chatCompletion } from '@/lib/openrouter'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET — Historique de conversation
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userId = session.userId
    const { id: agentId } = await params

    const messages = await prisma.agentChatMessage.findMany({
      where: { userId, agentId },
      orderBy: { createdAt: 'asc' },
      take: 50,
    })

    return NextResponse.json({ messages })
  } catch (err) {
    console.error('[GET /api/agents/[id]/chat]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST — Envoyer un message
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userId = session.userId
    const { id: agentId } = await params

    // Vérifier que l'agent est activé
    const activation = await prisma.agentActivation.findUnique({
      where: { userId_agentId: { userId, agentId } },
    })
    if (!activation) {
      return NextResponse.json({ error: 'Agent non activé' }, { status: 403 })
    }

    const agent = getAgentById(agentId)
    if (!agent) return NextResponse.json({ error: 'Agent introuvable' }, { status: 404 })

    const { message } = await req.json()
    if (!message?.trim()) return NextResponse.json({ error: 'Message vide' }, { status: 400 })

    // Sauvegarder le message utilisateur
    await prisma.agentChatMessage.create({
      data: { userId, agentId, role: 'USER', content: message },
    })

    // Récupérer le contexte wiki pertinent
    let wikiContext = ''
    try {
      const wikiResults = searchWiki(userId, message, 3)
      if (wikiResults.length > 0) {
        wikiContext = '\n\n## Contexte entreprise (Wiki)\n' + wikiResults.map((r) => r.content).join('\n\n')
      }
    } catch (_) {}

    // Récupérer l'historique de conversation récent
    const history = await prisma.agentChatMessage.findMany({
      where: { userId, agentId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Construire les messages pour le LLM (sans le dernier qui vient d'être ajouté)
    const historyMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = history
      .reverse()
      .slice(0, -1)
      .map((m) => ({
        role: m.role === 'USER' ? 'user' : 'assistant',
        content: m.content,
      }))

    // Appel LLM via openrouter
    const reply = await chatCompletion(
      [
        { role: 'system', content: agent.systemPrompt + wikiContext },
        ...historyMessages,
        { role: 'user', content: message },
      ],
      { max_tokens: 1024 }
    )

    // Sauvegarder la réponse
    await prisma.agentChatMessage.create({
      data: { userId, agentId, role: 'ASSISTANT', content: reply },
    })

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('[POST /api/agents/[id]/chat]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE — Effacer l'historique de conversation
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userId = session.userId
    const { id: agentId } = await params

    await prisma.agentChatMessage.deleteMany({ where: { userId, agentId } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/agents/[id]/chat]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
