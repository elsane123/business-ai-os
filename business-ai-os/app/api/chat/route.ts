import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'
import { buildWikiContext } from '@/lib/wiki/reader'
import { chatCompletion } from '@/lib/openrouter'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const messages = await prisma.chatMessage.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'asc' },
      take: 50,
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('[chat GET]', error)
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
    const { message } = body

    if (!message) {
      return NextResponse.json({ error: 'Message requis' }, { status: 400 })
    }

    const userId = session.userId

    // Save user message
    await prisma.chatMessage.create({
      data: { userId, role: 'USER', content: message },
    })

    // Build wiki context and recent history in parallel
    const [wikiContext, historyMessages] = await Promise.all([
      buildWikiContext(userId, message),
      prisma.chatMessage.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        take: 10,
      }),
    ])

    const systemPrompt =
      `Tu es le Business Brain d'un entrepreneur solo. Tu as accès à son contexte business complet:\n\n` +
      `${wikiContext}\n\nRéponds en français de manière concise, actionnable et personnalisée.`

    type ChatRole = 'user' | 'assistant' | 'system'
    const llmMessages: { role: ChatRole; content: string }[] = [
      { role: 'system' as ChatRole, content: systemPrompt },
      ...historyMessages.map((m) => ({
        role: m.role.toLowerCase() as ChatRole,
        content: m.content,
      })),
      { role: 'user' as ChatRole, content: message },
    ]

    const response = await chatCompletion(llmMessages, { temperature: 0.7 })

    // Save assistant response
    const assistantMessage = await prisma.chatMessage.create({
      data: { userId, role: 'ASSISTANT', content: response },
    })

    return NextResponse.json({
      message: { role: assistantMessage.role, content: assistantMessage.content },
      reply: assistantMessage.content,  // normalized alias for easier frontend consumption
    })
  } catch (error) {
    console.error('[chat POST]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
