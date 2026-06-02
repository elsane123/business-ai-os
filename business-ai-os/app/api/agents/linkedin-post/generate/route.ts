import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getAgentContext } from '@/lib/agents-context'
import { chatCompletion } from '@/lib/openrouter'

export async function POST() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
    }
    const userId = session.userId

    const context = await getAgentContext('agent-cmo', userId)
    const systemPrompt = `Tu es le CMO Agent de Brainlo, expert en marketing B2B et LinkedIn.\n\n${context}`

    const userPrompt = `Redige un post LinkedIn percutant ciblant les points de douleur de mon client ideal (ICP).\n\nRegles:\n- Commence par un hook fort (premiere ligne accrocheuse)\n- Structure: hook + probleme + solution (ton offre) + CTA\n- Ton: professionnel mais humain, adapte a ma voix\n- Longueur: 1000-1800 caracteres (optimal LinkedIn)\n- Utilise des sauts de ligne pour la lisibilite\n- Pas de hashtags generiques (max 3 hashtags pertinents en fin de post)\n\nReponds avec le texte du post uniquement, sans explication.`

    const content = await chatCompletion(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      { temperature: 0.7, track: { userId, feature: 'linkedin-post-generate' } }
    )

    return NextResponse.json({ content: content.trim() })
  } catch (error) {
    console.error('[linkedin-post/generate]', error)
    return NextResponse.json({ error: 'Erreur generation post LinkedIn' }, { status: 500 })
  }
}
