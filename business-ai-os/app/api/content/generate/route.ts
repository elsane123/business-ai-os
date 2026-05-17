import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'
import { buildWikiContext } from '@/lib/wiki/reader'
import { chatCompletion } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { postType, subject } = body

    const userId = session.userId
    let content: string | null = null

    try {
      const context = await buildWikiContext(userId, subject)
      const res = await fetch('http://localhost:8000/linkedin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, postType, subject, context }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.content) {
          content = data.content
        }
      }
    } catch (_) {
      // Python service unavailable — fall through to OpenRouter
    }

    if (!content) {
      const systemPrompt = `Tu es un expert LinkedIn B2B. Génère un post ${postType ?? ''} en français, professionnel et engageant pour un entrepreneur.`
      const userPrompt = `Sujet: ${
        subject ?? 'expertise métier'
      }. Format: hook accrocheur + développement 3-4 paragraphes + CTA + 5 hashtags pertinents.`
      content = await chatCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        { temperature: 0.8 }
      )
    }

    const post = await prisma.linkedInPost.create({
      data: {
        userId,
        content: content ?? '',
        postType,
        status: 'DRAFT',
      },
    })

    return NextResponse.json({ post }, { status: 200 })
  } catch (error) {
    console.error('[content/generate POST]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
