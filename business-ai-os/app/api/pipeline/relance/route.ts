import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

const FALLBACK_MESSAGES: Record<string, Record<string, { subject: string; message: string; hook: string }>> = {
  email: {
    professionnel: {
      subject: 'Suite à notre échange',
      hook: 'Je me permets de revenir vers vous concernant votre projet.',
      message: '',
    },
    decontracte: {
      subject: 'On remet ça ?',
      hook: 'Hello ! Je voulais prendre des nouvelles de votre côté.',
      message: '',
    },
    expert: {
      subject: 'Analyse et recommandations pour votre projet',
      hook: 'Suite à notre analyse initiale, j\'ai identifié plusieurs pistes concrètes.',
      message: '',
    },
  },
  linkedin: {
    professionnel: {
      subject: 'Message LinkedIn',
      hook: 'Bonjour, je me permets de reprendre contact suite à notre discussion.',
      message: '',
    },
    decontracte: {
      subject: 'Message LinkedIn',
      hook: 'Hello ! J\'espère que vous allez bien depuis notre dernier échange.',
      message: '',
    },
    expert: {
      subject: 'Message LinkedIn',
      hook: 'Depuis notre dernier échange, j\'ai approfondi certains aspects de votre problématique.',
      message: '',
    },
  },
}

function buildFallbackMessage(
  prospect: { name: string; company: string | null; status: string; value: number },
  tone: string,
  channel: string
): { subject: string; message: string; hook: string; channel: string } {
  const toneKey = tone in FALLBACK_MESSAGES[channel] ? tone : 'professionnel'
  const channelKey = channel in FALLBACK_MESSAGES ? channel : 'email'
  const template = FALLBACK_MESSAGES[channelKey][toneKey]

  const company = prospect.company || 'votre entreprise'
  const statusMessages: Record<string, string> = {
    IDENTIFIED: 'j\'ai remarqué votre profil et pense que nous pourrions travailler ensemble',
    CONTACTED: 'suite à notre premier contact, je voulais approfondir la discussion',
    INTERESTED: 'vous avez manifesté de l\'intérêt pour notre approche, voici la suite logique',
    PROPOSAL: `votre devis de ${prospect.value.toLocaleString('fr-FR')} € est toujours d\'actualité`,
    WON: 'je voulais prendre de vos nouvelles suite à notre collaboration',
    LOST: 'les circonstances changent — votre situation a peut-être évolué',
  }
  const statusCtx = statusMessages[prospect.status] || 'je voulais reprendre contact avec vous'

  const message = `${template.hook}\n\nBonjour ${prospect.name},\n\nJe me permets de vous recontacter car ${statusCtx} concernant ${company}.\n\nSeriez-vous disponible pour un échange de 15 minutes cette semaine afin de voir comment avancer ensemble ?\n\nCordialement`

  return {
    subject: template.subject,
    message,
    hook: template.hook,
    channel: channelKey,
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Plan enforcement: AI Relance is a Solo Pro feature
    const sessionUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { plan: true },
    })
    if (sessionUser?.plan === 'FREE') {
      return NextResponse.json(
        { error: 'Fonctionnalité Solo Pro', upgradeRequired: true },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { prospectId, tone = 'professionnel', channel = 'email' } = body

    if (!prospectId) {
      return NextResponse.json({ error: 'prospectId requis' }, { status: 400 })
    }

    const prospect = await prisma.prospect.findFirst({
      where: { id: prospectId, userId: session.userId },
    })

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect introuvable' }, { status: 404 })
    }

    let result = buildFallbackMessage(
      { name: prospect.name, company: prospect.company, status: prospect.status, value: prospect.value },
      tone,
      channel
    )

    // Try Python agent for AI-generated relance
    try {
      const wikiContext = `Prospect: ${prospect.name}, Entreprise: ${prospect.company}, Statut: ${prospect.status}, Valeur: ${prospect.value}€`
      const pythonRes = await fetch('http://localhost:8000/relance/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({
          user_id: session.userId,
          prospect_name: prospect.name,
          company: prospect.company || '',
          last_contact: prospect.lastContactDate
            ? new Date(prospect.lastContactDate).toISOString().split('T')[0]
            : null,
          status: prospect.status,
          value: prospect.value,
          context: wikiContext,
          tone,
          channel,
        }),
      })

      if (pythonRes.ok) {
        const data = await pythonRes.json()
        if (data.message) {
          result = {
            subject: data.subject || result.subject,
            message: data.message,
            hook: data.hook || result.hook,
            channel,
          }
        }
      }
    } catch (_) {
      // Python service unavailable — use fallback message
    }

    // Save relance to DB (channel stored in message prefix)
    const relance = await prisma.relance.create({
      data: {
        prospectId,
        message: `[${channel.toUpperCase()}] ${result.message}`,
      },
    })

    // Update prospect last contact date
    await prisma.prospect.update({
      where: { id: prospectId },
      data: { lastContactDate: new Date() },
    })

    return NextResponse.json({
      relance,
      subject: result.subject,
      message: result.message,
      hook: result.hook,
      channel: result.channel,
    }, { status: 201 })
  } catch (error) {
    console.error('[pipeline/relance POST]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
